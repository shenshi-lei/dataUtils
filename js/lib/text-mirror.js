/* =========================================================
 * 开发工具箱 — 文本域镜像层
 * 在 textarea 上方叠一层排版完全一致的文本：文字透明，只用背景色 /
 * 波浪下划线给「查找命中」「语法检查错误」画标记，不改变 textarea 的
 * 输入、选区、滚动等原生行为。
 *
 *   Mirror.attach(textarea)          取得（或创建）镜像层
 *   api.setMarks([{start,end,...}])  设置查找命中
 *   api.setIssues([{start,end,...}]) 设置错误 / 警告范围
 *   api.caretRect()                  估算光标在镜像层坐标系里的位置
 * ========================================================= */
(function (root) {
  'use strict';

  /* 超过这个长度不再画标记，避免逐字符拼接 HTML 卡住页面 */
  var MAX_LENGTH = 200000;
  /* 单层最多画多少个标记 */
  var MAX_ANNOTATIONS = 3000;

  function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, function (ch) {
      if (ch === '&') return '&amp;';
      if (ch === '<') return '&lt;';
      if (ch === '>') return '&gt;';
      return '&quot;';
    });
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function px(value) {
    var number = parseFloat(value);
    return isNaN(number) ? 0 : number;
  }

  /**
   * 把若干区间合并成不重叠的分段，供渲染使用。
   * 每段带上同时覆盖它的标记信息，重叠时类名叠加。
   */
  function segment(text, annotations) {
    var list = annotations.slice().sort(function (a, b) {
      if (a.start !== b.start) return a.start - b.start;
      return a.end - b.end;
    });

    var bounds = [0, text.length];
    list.forEach(function (item) {
      var start = Math.max(0, Math.min(item.start, text.length));
      var end = Math.max(start, Math.min(item.end, text.length));
      if (end <= start) return;
      bounds.push(start, end);
    });

    bounds.sort(function (a, b) { return a - b; });

    var unique = [];
    for (var i = 0; i < bounds.length; i++) {
      if (!unique.length || unique[unique.length - 1] !== bounds[i]) unique.push(bounds[i]);
    }

    var pieces = [];

    for (var b = 0; b + 1 < unique.length; b++) {
      var from = unique[b];
      var to = unique[b + 1];
      if (to <= from) continue;

      var active = [];

      for (var k = 0; k < list.length; k++) {
        var item = list[k];
        var start = Math.max(0, Math.min(item.start, text.length));
        var end = Math.max(start, Math.min(item.end, text.length));
        if (start <= from && end >= to) active.push(item);
      }

      if (!active.length) {
        pieces.push({ from: from, to: to, classes: '', title: '' });
        continue;
      }

      var classes = [];
      var title = '';

      active.forEach(function (item) {
        if (item.kind === 'issue') {
          classes.push('mirror-issue', 'is-' + (item.severity || 'error'));
          if (!title && item.message) title = item.message;
        } else {
          classes.push('mirror-hit');
          if (item.current) classes.push('is-current');
        }
      });

      pieces.push({
        from: from,
        to: to,
        classes: classes.join(' '),
        title: title
      });
    }

    return pieces;
  }

  function TextMirror(input) {
    this.input = input;
    this.host = input.parentNode;
    this.marks = [];
    this.issues = [];
    this.charWidth = 0;
    this.frame = 0;

    var mirror = el('div', 'text-mirror');
    mirror.setAttribute('aria-hidden', 'true');
    mirror.hidden = true;

    var inner = el('div', 'text-mirror-inner');
    mirror.appendChild(inner);

    /* 紧跟在 textarea 后面，保证绘制在它上面 */
    if (input.nextSibling) this.host.insertBefore(mirror, input.nextSibling);
    else this.host.appendChild(mirror);

    this.node = mirror;
    this.inner = inner;

    input.__textMirror = this;

    var self = this;

    input.addEventListener('scroll', function () {
      self.align();
    });

    /* 值变化后镜像的换行也会变，重新对齐几何尺寸 */
    input.addEventListener('input', function () {
      self.schedule();
    });

    if (root.ResizeObserver) {
      this.observer = new ResizeObserver(function () {
        self.schedule();
      });
      this.observer.observe(input);
    } else {
      root.addEventListener('resize', function () { self.schedule(); });
    }
  }

  TextMirror.prototype.schedule = function () {
    var self = this;
    if (this.frame) return;
    this.frame = root.requestAnimationFrame(function () {
      self.frame = 0;
      self.syncGeometry();
      self.render();
    });
  };

  /* 让镜像层与 textarea 的内容盒精确重合，并复制排版参数 */
  TextMirror.prototype.syncGeometry = function () {
    var input = this.input;
    if (!input || !input.isConnected) return false;

    var style = getComputedStyle(input);
    var hostRect = this.host.getBoundingClientRect();
    var rect = input.getBoundingClientRect();

    var left = rect.left - hostRect.left + px(style.borderLeftWidth);
    var top = rect.top - hostRect.top + px(style.borderTopWidth);

    this.node.style.left = left + 'px';
    this.node.style.top = top + 'px';
    this.node.style.width = Math.max(0, input.clientWidth) + 'px';
    this.node.style.height = Math.max(0, input.clientHeight) + 'px';

    var inner = this.inner;
    var wrapOff = (input.getAttribute('wrap') || '').toLowerCase() === 'off';

    inner.style.padding = style.padding;
    inner.style.fontFamily = style.fontFamily;
    inner.style.fontSize = style.fontSize;
    inner.style.fontWeight = style.fontWeight;
    inner.style.fontStyle = style.fontStyle;
    inner.style.letterSpacing = style.letterSpacing;
    inner.style.wordSpacing = style.wordSpacing;
    inner.style.lineHeight = style.lineHeight;
    inner.style.tabSize = style.tabSize || '2';
    inner.style.textIndent = style.textIndent;
    inner.style.textTransform = style.textTransform;
    inner.style.whiteSpace = wrapOff ? 'pre' : 'pre-wrap';
    inner.style.overflowWrap = wrapOff ? 'normal' : 'anywhere';
    inner.style.boxSizing = 'border-box';
    inner.style.width = wrapOff ? 'max-content' : '100%';
    inner.style.minWidth = wrapOff ? '100%' : '0';

    return true;
  };

  TextMirror.prototype.align = function () {
    var input = this.input;
    this.inner.style.transform =
      'translate(' + (-input.scrollLeft) + 'px,' + (-input.scrollTop) + 'px)';
  };

  TextMirror.prototype.count = function () {
    return this.marks.length + this.issues.length;
  };

  TextMirror.prototype.render = function () {
    var input = this.input;
    var text = input.value;

    if (!this.count() || !text || text.length > MAX_LENGTH) {
      this.node.hidden = true;
      this.inner.textContent = '';
      return false;
    }

    if (!this.syncGeometry()) {
      this.node.hidden = true;
      return false;
    }

    var all = this.marks.concat(this.issues);
    var pieces = segment(text, all.slice(0, MAX_ANNOTATIONS));
    var html = '';

    for (var i = 0; i < pieces.length; i++) {
      var piece = pieces[i];
      var chunk = escapeHtml(text.slice(piece.from, piece.to));
      if (piece.classes) {
        html += '<span class="' + piece.classes + '"' +
          (piece.title ? ' title="' + escapeHtml(piece.title) + '"' : '') +
          '>' + chunk + '</span>';
      } else {
        html += chunk;
      }
    }

    /* 末尾补一个换行，保证最后一行的行高与 textarea 一致 */
    this.inner.innerHTML = html + '\n';
    this.node.hidden = false;
    this.align();
    return true;
  };

  TextMirror.prototype.setMarks = function (marks) {
    this.marks = (marks || []).filter(function (item) {
      return item && item.end > item.start;
    }).map(function (item) {
      return {
        kind: 'find',
        start: item.start,
        end: item.end,
        current: !!item.current
      };
    });
    this.render();
  };

  TextMirror.prototype.setIssues = function (issues) {
    this.issues = (issues || []).filter(function (item) {
      return item && item.end > item.start;
    }).map(function (item) {
      return {
        kind: 'issue',
        start: item.start,
        end: item.end,
        severity: item.severity || 'error',
        message: item.message || ''
      };
    });
    this.render();
  };

  TextMirror.prototype.clearMarks = function () {
    this.marks = [];
    this.render();
  };

  TextMirror.prototype.clearIssues = function () {
    this.issues = [];
    this.render();
  };

  TextMirror.prototype.destroy = function () {
    if (this.observer) this.observer.disconnect();
    if (this.node.parentNode) this.node.parentNode.removeChild(this.node);
    if (this.input) this.input.__textMirror = null;
    this.marks = [];
    this.issues = [];
  };

  /* ---------------- 光标定位（补全弹层用） ---------------- */

  TextMirror.prototype.measureChar = function () {
    if (this.charWidth) return this.charWidth;

    var input = this.input;
    var style = getComputedStyle(input);
    var probe = el('span');
    probe.style.position = 'absolute';
    probe.style.left = '-9999px';
    probe.style.top = '0';
    probe.style.visibility = 'hidden';
    probe.style.whiteSpace = 'pre';
    probe.style.fontFamily = style.fontFamily;
    probe.style.fontSize = style.fontSize;
    probe.style.fontWeight = style.fontWeight;
    probe.style.letterSpacing = style.letterSpacing;
    probe.textContent = 'MMMMM';
    document.body.appendChild(probe);

    var width = probe.getBoundingClientRect().width / 5;
    document.body.removeChild(probe);

    this.charWidth = width || 7.5;
    return this.charWidth;
  };

  /**
   * 估算光标相对 textarea 内容盒的位置（像素）。
   * textarea 是等宽字体，按行 / 列乘字符宽度即可，足够给补全弹层定位。
   */
  TextMirror.prototype.caretRect = function () {
    var input = this.input;
    var style = getComputedStyle(input);
    var lineHeight = px(style.lineHeight) || px(style.fontSize) * 1.4 || 18;
    var padTop = px(style.paddingTop);

    var position = input.selectionStart || 0;
    var before = input.value.slice(0, position);
    var lineIndex = before.split('\n').length - 1;
    var lastBreak = before.lastIndexOf('\n');
    var column = position - lastBreak - 1;

    var charWidth = this.measureChar();

    return {
      left: column * charWidth - input.scrollLeft,
      top: padTop + lineIndex * lineHeight - input.scrollTop,
      lineHeight: lineHeight,
      charWidth: charWidth,
      line: lineIndex + 1,
      column: column + 1
    };
  };

  /* ---------------- 对外接口 ---------------- */

  function attach(input, options) {
    if (!input) return null;
    if (input.__textMirror) return input.__textMirror;

    var mirror = new TextMirror(input);
    if (options && options.onUpdate) mirror.onUpdate = options.onUpdate;
    return mirror;
  }

  function of(input) {
    return input && input.__textMirror ? input.__textMirror : null;
  }

  root.TextMirror = {
    attach: attach,
    of: of,
    MAX_LENGTH: MAX_LENGTH
  };
})(window);
