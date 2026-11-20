/* =========================================================
 * 开发工具箱 — 通用查找 / 替换
 * 任何工具都可以用 Finder.attach() 给自己的文本域挂上查找能力；
 * Ctrl+F 交给当前激活的工具处理，工具没接管时再回退到全局查找。
 * ========================================================= */
(function (root) {
  'use strict';

  var override = null;

  function isEditable(node) {
    if (!node) return false;
    var tag = node.tagName;
    if (tag === 'INPUT') {
      var type = (node.getAttribute('type') || 'text').toLowerCase();
      return type === 'text' || type === 'search' || type === 'url' || type === 'tel' || type === 'email' || type === 'number';
    }
    return tag === 'TEXTAREA' || node.isContentEditable === true;
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ---------------- 文本类目标（textarea / input） ---------------- */

  function TextTarget(input, options) {
    this.input = input;
    this.kind = 'text';
    this.options = options || {};
    this.mirror = null;
  }

  TextTarget.prototype.getValue = function () {
    return this.input.value;
  };

  TextTarget.prototype.setValue = function (value) {
    var history = root.TextHistory && root.TextHistory.of(this.input);
    if (history && !history.applying) history.record();

    this.input.value = value;
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  /**
   * 文本域本身没法给命中上色，用 TextMirror 叠一层透明文本画色块。
   * 只有 textarea 才值得这么做；单行 input 的命中靠选区就够了。
   */
  TextTarget.prototype.ensureMirror = function () {
    if (this.mirror) return this.mirror;
    if (!root.TextMirror || this.input.tagName !== 'TEXTAREA') return null;
    if (this.options.highlight === false) return null;

    this.mirror = root.TextMirror.attach(this.input);
    return this.mirror;
  };

  TextTarget.prototype.paint = function (matches, index) {
    var mirror = this.ensureMirror();
    if (!mirror) return false;

    mirror.setMarks(matches.map(function (match, order) {
      return { start: match.start, end: match.end, current: order === index };
    }));

    return true;
  };

  TextTarget.prototype.clearPaint = function () {
    if (this.mirror) this.mirror.clearMarks();
  };

  TextTarget.prototype.select = function (start, end) {
    this.input.focus();

    try {
      this.input.setSelectionRange(start, end);
    } catch (err) {
      /* number 输入框不支持 */
    }

    /* 手动滚动到命中行，textarea 的 setSelectionRange 不保证可见 */
    var before = this.input.value.slice(0, start);
    var line = before.split('\n').length - 1;
    var lineHeight = parseFloat(getComputedStyle(this.input).lineHeight) || 20;
    var target = line * lineHeight - this.input.clientHeight / 2;
    this.input.scrollTop = Math.max(0, target);
  };

  TextTarget.prototype.focus = function () {
    this.input.focus();
  };

  /* ---------------- DOM 类目标（着色后的 pre） ---------------- */

  function DomTarget(element, getText, onReplace) {
    this.element = element;
    this.kind = 'dom';
    this.getText = getText;
    this.onReplace = onReplace;
    this.marks = [];
    this.activeIndex = -1;
    this.hits = [];
  }

  DomTarget.prototype.getValue = function () {
    return this.getText ? this.getText() : this.element.textContent;
  };

  DomTarget.prototype.clearMarks = function () {
    if (!this.marks.length) return;
    this.marks.forEach(function (mark) {
      var parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });
    this.element.normalize();
    this.marks = [];
    this.activeIndex = -1;
  };

  DomTarget.prototype.collectHits = function (query, options) {
    this.clearMarks();
    this.hits = [];

    if (!query) return this.hits;

    var pattern;
    try {
      pattern = options.regex ? new RegExp(query, options.caseSensitive ? 'g' : 'gi') : new RegExp(escapeRegExp(query), options.caseSensitive ? 'g' : 'gi');
    } catch (err) {
      this.invalid = err.message;
      return this.hits;
    }

    this.invalid = '';

    /* 只在最深的文本节点里找，避免跨标签匹配破坏 DOM */
    var walker = document.createTreeWalker(this.element, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    var node;

    while ((node = walker.nextNode())) {
      if (!node.nodeValue) continue;
      nodes.push(node);
    }

    var self = this;

    nodes.forEach(function (textNode) {
      var text = textNode.nodeValue;
      pattern.lastIndex = 0;
      var match;

      while ((match = pattern.exec(text)) !== null) {
        if (match[0].length === 0) {
          pattern.lastIndex++;
          continue;
        }

        self.hits.push({
          node: textNode,
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });

        if (self.hits.length > 4000) break;
      }
    });

    return this.hits;
  };

  DomTarget.prototype.paintHits = function () {
    var self = this;
    /* 从后往前包裹，避免前面的偏移量失效 */
    var sorted = this.hits.slice().sort(function (a, b) {
      return b.start - a.start;
    });

    sorted.forEach(function (hit) {
      var node = hit.node;
      if (!node || !node.parentNode) return;

      try {
        var range = document.createRange();
        range.setStart(node, hit.start);
        range.setEnd(node, hit.end);
        var mark = document.createElement('mark');
        mark.className = 'app-hit';
        range.surroundContents(mark);
        self.marks.unshift(mark);
      } catch (err) {
        /* 跨节点或已被替换时跳过 */
      }
    });
  };

  DomTarget.prototype.reveal = function (index) {
    if (!this.marks.length) return;

    this.marks.forEach(function (mark) {
      mark.classList.remove('is-current');
    });

    var mark = this.marks[index];
    if (!mark) return;

    this.activeIndex = index;
    mark.classList.add('is-current');

    /* 滚动到可视区中央 */
    var scroller = this.findScroller();
    if (!scroller) {
      mark.scrollIntoView({ block: 'center' });
      return;
    }

    var markRect = mark.getBoundingClientRect();
    var boxRect = scroller.getBoundingClientRect();
    var delta = markRect.top - boxRect.top - boxRect.height / 2 + markRect.height / 2;
    scroller.scrollTop += delta;
    if (markRect.left < boxRect.left || markRect.right > boxRect.right) {
      scroller.scrollLeft += markRect.left - boxRect.left - 40;
    }
  };

  DomTarget.prototype.findScroller = function () {
    var node = this.element.parentNode;
    while (node && node.nodeType === 1) {
      var style = getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) return node;
      node = node.parentNode;
    }
    return null;
  };

  DomTarget.prototype.select = function (index) {
    this.reveal(index);
  };

  DomTarget.prototype.replaceAt = function (index, replacement) {
    var hit = this.hits[index];
    if (!hit) return false;

    var text = this.getValue();
    /* DOM 命中无法稳定换算全局偏移，改用元素文本整体替换 */
    var offset = this.offsetOfHit(hit);
    if (offset < 0) return false;

    var next = text.slice(0, offset) + replacement + text.slice(offset + hit.text.length);
    if (typeof this.onReplace === 'function') this.onReplace(next);
    return true;
  };

  DomTarget.prototype.offsetOfHit = function (hit) {
    var range = document.createRange();
    range.selectNodeContents(this.element);
    range.setEnd(hit.node, hit.start);
    var offset = range.toString().length;
    range.detach();
    return offset;
  };

  DomTarget.prototype.supportsReplace = function () {
    return typeof this.onReplace === 'function';
  };

  DomTarget.prototype.focus = function () {
    if (this.marks[this.activeIndex]) return;
    if (this.marks[0]) this.reveal(0);
  };

  /* ---------------- 查找控制器 ---------------- */

  function FindController(options) {
    this.label = options.label || '查找';
    this.targets = (options.targets || []).filter(Boolean);
    this.getTarget = options.getTarget;
    this.onClose = options.onClose;
    this.bar = null;
    this.open = false;
    this.query = '';
    this.replacement = '';
    this.caseSensitive = false;
    this.useRegex = false;
    this.index = 0;
    this.matches = [];
    this.invalid = '';
    this.replacing = false;

    var self = this;

    function refresh() {
      if (!self.open || self.replacing) return;
      self.execute(true);
    }

    var refreshLater = null;
    if (root.Toolbox && root.Toolbox.ui && root.Toolbox.ui.debounce) {
      refreshLater = root.Toolbox.ui.debounce(refresh, 90);
    }

    /* 文本域被修改后命中位置会漂移，重新收集一次 */
    this.targets.forEach(function (target) {
      if (target.kind !== 'text' || !target.input) return;

      target.input.addEventListener('input', function () {
        if (!self.open || self.replacing) return;
        if (refreshLater && target.input.value.length > 8000) refreshLater();
        else refresh();
      });

      /* textarea 滚动时镜像层自己会跟，这里只做一次对齐 */
      target.input.addEventListener('scroll', function () {
        var mirror = target.input.__textMirror;
        if (mirror && self.open) mirror.align();
      });
    });
  }

  FindController.prototype.currentTarget = function () {
    if (this.getTarget) {
      var target = this.getTarget();
      if (target) return target;
    }
    return this.targets[0] || null;
  };

  FindController.prototype.ensureBar = function () {
    if (this.bar) return this.bar;
    this.bar = buildBar(this);
    return this.bar;
  };

  FindController.prototype.show = function (focusReplace) {
    var bar = this.ensureBar();

    /* 同一个视图里只保留一条查找条；其它视图的查找条随视图一起被隐藏 */
    var all = document.querySelectorAll('.app-find');
    for (var i = 0; i < all.length; i++) {
      if (all[i] !== bar) all[i].hidden = true;
    }

    this.open = true;
    bar.hidden = false;

    var target = this.currentTarget();
    if (target && target.kind === 'text') {
      var selected = selectedTextOf(target.input);
      if (selected && selected.indexOf('\n') < 0 && selected.length <= 120) {
        this.query = selected;
      }
    }

    syncFields(this);
    this.execute();
    this.refreshControls();

    var focusNode = focusReplace ? bar.querySelector('.app-find-replace') : bar.querySelector('.app-find-input');
    if (focusNode) {
      focusNode.focus();
      focusNode.select();
    }

    return true;
  };

  FindController.prototype.hide = function () {
    this.open = false;
    if (this.bar) this.bar.hidden = true;

    this.clearHighlights();

    if (typeof this.onClose === 'function') this.onClose();
  };

  FindController.prototype.clearHighlights = function () {
    this.targets.forEach(function (target) {
      if (target.kind === 'dom') target.clearMarks();
      else if (typeof target.clearPaint === 'function') target.clearPaint();
    });
  };

  /* 隐藏时除了清高亮，还要把各目标的镜像层一起收掉 */
  FindController.prototype.clearAllPaint = function () {
    this.clearHighlights();
  };

  FindController.prototype.execute = function (keepIndex) {
    var target = this.currentTarget();
    this.matches = [];
    this.invalid = '';

    if (!target || !this.query) {
      this.renderState();
      return;
    }

    if (target.kind === 'dom') {
      var hits = target.collectHits(this.query, { regex: this.useRegex, caseSensitive: this.caseSensitive });
      this.invalid = target.invalid || '';
      this.matches = hits.map(function (hit) {
        var position = lineColumnOfText(target.getValue(), hitStart(target, hit));
        return { line: position.line, column: position.column, text: hit.text };
      });
    } else {
      var value = target.getValue();
      var pattern;

      try {
        pattern = this.useRegex
          ? new RegExp(this.query, this.caseSensitive ? 'g' : 'gi')
          : new RegExp(escapeRegExp(this.query), this.caseSensitive ? 'g' : 'gi');
      } catch (err) {
        this.invalid = err.message;
        this.renderState();
        return;
      }

      var match;
      while ((match = pattern.exec(value)) !== null) {
        if (match[0].length === 0) {
          pattern.lastIndex++;
          continue;
        }

        var pos = lineColumnOfText(value, match.index);
        this.matches.push({
          start: match.index,
          end: match.index + match[0].length,
          line: pos.line,
          column: pos.column,
          text: match[0]
        });

        if (this.matches.length >= 5000) break;
      }
    }

    if (!this.matches.length) {
      this.index = 0;
    } else if (!keepIndex || this.index >= this.matches.length) {
      this.index = 0;
    }

    this.applyHighlights();
    this.paintOthers();
    this.renderState();
    this.refreshControls();
  };

  FindController.prototype.applyHighlights = function () {
    var target = this.currentTarget();
    if (!target) return;

    if (target.kind === 'dom') {
      target.paintHits();
      if (this.matches.length) target.reveal(this.index);
      return;
    }

    if (typeof target.paint === 'function') {
      target.paint(this.matches, this.index);
      this.paintOthers();
    }
  };

  /**
   * 每个文本域各自算命中：同一个查询词在不同输入框里位置并不相同，
   * 所以除当前目标外，其余目标单独收集一次并上色。
   */
  FindController.prototype.paintOthers = function () {
    var self = this;
    if (!this.query || this.invalid) return;

    this.targets.forEach(function (target) {
      if (target === self.currentTarget()) return;
      if (target.kind !== 'text' || typeof target.paint !== 'function') return;

      var value = target.getValue();
      if (!value) {
        target.clearPaint();
        return;
      }

      var pattern;

      try {
        pattern = self.useRegex
          ? new RegExp(self.query, self.caseSensitive ? 'g' : 'gi')
          : new RegExp(escapeRegExp(self.query), self.caseSensitive ? 'g' : 'gi');
      } catch (err) {
        target.clearPaint();
        return;
      }

      var list = [];
      var match;

      while ((match = pattern.exec(value)) !== null) {
        if (match[0].length === 0) {
          pattern.lastIndex++;
          continue;
        }

        list.push({ start: match.index, end: match.index + match[0].length });

        if (list.length >= 2000) break;
      }

      if (list.length) target.paint(list, -1);
      else target.clearPaint();
    });
  };

  FindController.prototype.renderState = function () {
    if (!this.bar) return;

    var count = this.bar.querySelector('.app-find-count');
    if (!count) return;

    count.classList.toggle('is-error', !!this.invalid);
    count.classList.toggle('is-empty', !this.invalid && !this.matches.length);

    if (this.invalid) {
      count.textContent = '正则错误';
      count.title = this.invalid;
      return;
    }

    if (!this.query) {
      count.textContent = '—';
      count.title = '输入关键字开始查找';
      return;
    }

    if (!this.matches.length) {
      count.textContent = '0/0';
      count.title = '没有找到匹配';
      return;
    }

    count.textContent = (this.index + 1) + '/' + this.matches.length;
    var current = this.matches[this.index];
    count.title = current ? '第 ' + current.line + ' 行，第 ' + current.column + ' 列' : '';
  };

  FindController.prototype.refreshControls = function () {
    if (!this.bar) return;

    var self = this;
    var target = this.currentTarget();
    var canReplace = !!target && (target.kind === 'text' || target.supportsReplace());

    ['.app-find-prev', '.app-find-next'].forEach(function (selector) {
      var button = self.bar.querySelector(selector);
      if (button) button.disabled = !self.matches.length;
    });

    ['.app-find-replace-one', '.app-find-replace-all'].forEach(function (selector) {
      var button = self.bar.querySelector(selector);
      if (button) button.disabled = !canReplace || !self.matches.length || !!self.invalid;
    });

    var stepText = this.bar.querySelector('.app-find-step');
    if (stepText) {
      stepText.textContent = this.matches.length && !this.invalid
        ? '第 ' + this.matches[this.index].line + ' 行，第 ' + this.matches[this.index].column + ' 列'
        : '';
    }

    var replaceRow = this.bar.querySelector('.app-find-replace-row');
    if (replaceRow) replaceRow.hidden = !canReplace;
  };

  FindController.prototype.step = function (delta) {
    if (!this.matches.length) return;

    this.index = (this.index + delta + this.matches.length) % this.matches.length;
    var target = this.currentTarget();

    if (target && target.kind === 'dom') {
      target.reveal(this.index);
    } else if (target && this.matches[this.index]) {
      target.select(this.matches[this.index].start, this.matches[this.index].end);
      if (typeof target.paint === 'function') target.paint(this.matches, this.index);
    }

    this.renderState();
  };

  /* 替换之后文本长度变了，命中位置全部作废，重新查找 */
  FindController.prototype.afterReplace = function (keepIndex) {
    this.execute(keepIndex);
    if (this.matches.length) {
      var target = this.currentTarget();
      if (target && target.kind === 'text' && typeof target.paint === 'function') {
        target.paint(this.matches, this.index);
      }
    }
  };

  FindController.prototype.compileReplace = function () {
    if (this.useRegex) return null;
    return null;
  };

  FindController.prototype.replaceOne = function () {
    var target = this.currentTarget();
    var match = this.matches[this.index];
    if (!target || !match) return;

    var self = this;
    var replacement = this.replacement;

    this.replacing = true;
    try {
      if (target.kind === 'text') {
        var value = target.getValue();
        var text = this.useRegex && replacement.indexOf('$') >= 0
          ? expandReplacement(value, match, replacement, this.caseSensitive)
          : replacement;

        target.setValue(value.slice(0, match.start) + text + value.slice(match.end));
        this.execute(true);
        if (this.matches.length) this.step(0);
        return;
      }

      var domText = target.getValue();
      var regex = this.buildGlobalRegex();

      if (!regex) return;

      var changed = false;
      var next = domText.replace(regex, function () {
        if (changed) return arguments[0];
        changed = true;
        return replacement;
      });

      if (changed && typeof target.onReplace === 'function') {
        target.onReplace(next);
        this.execute(true);
      }
    } finally {
      setTimeout(function () { self.replacing = false; }, 0);
    }
  };

  FindController.prototype.replaceAll = function () {
    var target = this.currentTarget();
    if (!target) return;

    var regex = this.buildGlobalRegex();
    if (!regex) return;

    var count = this.matches.length;
    var self = this;

    this.replacing = true;
    try {
      if (target.kind === 'text') {
        var value = target.getValue();
        target.setValue(value.replace(regex, this.replacement));
      } else if (typeof target.onReplace === 'function') {
        target.onReplace(target.getValue().replace(regex, this.replacement));
      }

      this.execute(false);

      if (root.Toolbox && root.Toolbox.ui) {
        root.Toolbox.ui.toast('已替换 ' + count + ' 处');
      }
    } finally {
      setTimeout(function () { self.replacing = false; }, 0);
    }
  };

  FindController.prototype.buildGlobalRegex = function () {
    try {
      return this.useRegex
        ? new RegExp(this.query, this.caseSensitive ? 'g' : 'gi')
        : new RegExp(escapeRegExp(this.query), this.caseSensitive ? 'g' : 'gi');
    } catch (err) {
      if (root.Toolbox && root.Toolbox.ui) root.Toolbox.ui.toast('正则表达式无效');
      return null;
    }
  };

  /* ---------------- 辅助函数 ---------------- */

  function selectedTextOf(input) {
    if (!input || typeof input.selectionStart !== 'number') return '';
    if (input.selectionStart === input.selectionEnd) return '';
    return input.value.slice(input.selectionStart, input.selectionEnd);
  }

  function hitStart(target, hit) {
    if (typeof hit.offset === 'number') return hit.offset;
    return target.offsetOfHit(hit);
  }

  function lineColumnOfText(text, index) {
    var line = 1;
    var lastBreak = -1;
    var end = Math.min(Math.max(index, 0), text.length);

    for (var i = 0; i < end; i++) {
      if (text.charCodeAt(i) === 10) {
        line++;
        lastBreak = i;
      }
    }

    return { line: line, column: end - lastBreak };
  }

  function expandReplacement(value, match, replacement, caseSensitive) {
    /* 计算这次匹配捕获到的分组，供 $1..$9 使用 */
    var regex;
    try {
      regex = new RegExp(escapeRegExp(match.text), caseSensitive ? '' : 'i');
    } catch (err) {
      return replacement;
    }
    var found = regex.exec(value.slice(match.start));
    if (!found) return replacement;

    return replacement.replace(/\$(\$|&|\d)/g, function (whole, token) {
      if (token === '$') return '$';
      if (token === '&') return match.text;
      var group = found[Number(token)];
      return group === undefined ? whole : group;
    });
  }

  function syncFields(controller) {
    if (!controller.bar) return;

    var input = controller.bar.querySelector('.app-find-input');
    if (input) input.value = controller.query;

    var replace = controller.bar.querySelector('.app-find-replace');
    if (replace) replace.value = controller.replacement;

    var caseBtn = controller.bar.querySelector('.app-find-case');
    if (caseBtn) caseBtn.setAttribute('aria-pressed', controller.caseSensitive ? 'true' : 'false');

    var regexBtn = controller.bar.querySelector('.app-find-regex');
    if (regexBtn) regexBtn.setAttribute('aria-pressed', controller.useRegex ? 'true' : 'false');
  }

  function buildBar(controller) {
    var ui = root.Toolbox.ui;
    var bar = document.createElement('div');
    bar.className = 'app-find';
    bar.hidden = true;
    bar.setAttribute('role', 'search');
    bar.setAttribute('aria-label', controller.label);

    var row = document.createElement('div');
    row.className = 'app-find-row';

    var field = document.createElement('div');
    field.className = 'find-field';

    var icon = document.createElement('svg');
    icon.setAttribute('class', 'icon find-field-icon');
    icon.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-search');
    icon.appendChild(use);
    field.appendChild(icon);

    var input = document.createElement('input');
    input.className = 'find-input app-find-input';
    input.type = 'text';
    input.placeholder = '查找内容';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-label', '查找内容');
    field.appendChild(input);

    var count = document.createElement('span');
    count.className = 'find-count app-find-count';
    count.setAttribute('aria-live', 'polite');
    field.appendChild(count);

    row.appendChild(field);

    var caseBtn = document.createElement('button');
    caseBtn.type = 'button';
    caseBtn.className = 'find-opt app-find-case';
    caseBtn.textContent = 'Aa';
    caseBtn.title = '区分大小写';
    caseBtn.setAttribute('aria-pressed', 'false');
    row.appendChild(caseBtn);

    var regexBtn = document.createElement('button');
    regexBtn.type = 'button';
    regexBtn.className = 'find-opt app-find-regex';
    regexBtn.textContent = '.*';
    regexBtn.title = '使用正则表达式';
    regexBtn.setAttribute('aria-pressed', 'false');
    row.appendChild(regexBtn);

    [
      ['app-find-prev', 'i-chevron-left', '上一个匹配 (Shift+Enter)', '上一个匹配'],
      ['app-find-next', 'i-chevron-right', '下一个匹配 (Enter)', '下一个匹配']
    ].forEach(function (item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'find-nav ' + item[0];
      btn.title = item[2];
      btn.setAttribute('aria-label', item[3]);
      btn.disabled = true;
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'icon');
      svg.setAttribute('aria-hidden', 'true');
      var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      u.setAttribute('href', '#' + item[1]);
      svg.appendChild(u);
      btn.appendChild(svg);
      row.appendChild(btn);
    });

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'find-nav find-close app-find-close';
    close.title = '关闭查找 (Esc)';
    close.setAttribute('aria-label', '关闭查找');
    var closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeSvg.setAttribute('class', 'icon');
    var closeUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    closeUse.setAttribute('href', '#i-close');
    closeSvg.appendChild(closeUse);
    close.appendChild(closeSvg);
    row.appendChild(close);

    bar.appendChild(row);

    var replaceRow = document.createElement('div');
    replaceRow.className = 'app-find-row app-find-replace-row';

    var replaceField = document.createElement('div');
    replaceField.className = 'find-field';
    var replaceIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    replaceIcon.setAttribute('class', 'icon find-field-icon');
    var replaceUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    replaceUse.setAttribute('href', '#i-replace');
    replaceIcon.appendChild(replaceUse);
    replaceField.appendChild(replaceIcon);

    var replaceInput = document.createElement('input');
    replaceInput.className = 'find-input app-find-replace';
    replaceInput.type = 'text';
    replaceInput.placeholder = '替换为（留空即删除）';
    replaceInput.autocomplete = 'off';
    replaceInput.spellcheck = false;
    replaceInput.setAttribute('aria-label', '替换内容');
    replaceField.appendChild(replaceInput);

    replaceRow.appendChild(replaceField);

    [
      ['app-find-replace-one', '替换', '替换当前匹配'],
      ['app-find-replace-all', '全部替换', '替换全部匹配']
    ].forEach(function (item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'find-action ' + item[0];
      btn.textContent = item[1];
      btn.title = item[2];
      btn.disabled = true;
      replaceRow.appendChild(btn);
    });

    bar.appendChild(replaceRow);

    var hint = document.createElement('div');
    hint.className = 'app-find-hint';
    hint.innerHTML = '<span>Enter 下一个 · Shift+Enter 上一个 · Esc 关闭</span>' +
      '<span class="app-find-step"></span>' +
      '<span class="app-find-scope"></span>';
    bar.appendChild(hint);
    /* ---------- 事件 ---------- */

    input.addEventListener('input', function () {
      controller.query = input.value;
      controller.execute(false);
      controller.refreshControls();
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.shiftKey) controller.step(-1);
        else controller.step(1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        controller.hide();
        if (controller.getTarget) {
          var t = controller.currentTarget();
          if (t && t.focus) t.focus();
        }
      }
    });

    replaceInput.addEventListener('input', function () {
      controller.replacement = replaceInput.value;
    });

    replaceInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        controller.replaceOne();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        controller.hide();
      }
    });

    caseBtn.addEventListener('click', function () {
      controller.caseSensitive = !controller.caseSensitive;
      caseBtn.setAttribute('aria-pressed', controller.caseSensitive ? 'true' : 'false');
      controller.execute(true);
      controller.refreshControls();
    });

    regexBtn.addEventListener('click', function () {
      controller.useRegex = !controller.useRegex;
      regexBtn.setAttribute('aria-pressed', controller.useRegex ? 'true' : 'false');
      controller.execute(true);
      controller.refreshControls();
    });

    bar.querySelector('.app-find-prev').addEventListener('click', function () { controller.step(-1); });
    bar.querySelector('.app-find-next').addEventListener('click', function () { controller.step(1); });
    bar.querySelector('.app-find-close').addEventListener('click', function () { controller.hide(); });
    bar.querySelector('.app-find-replace-one').addEventListener('click', function () { controller.replaceOne(); });
    bar.querySelector('.app-find-replace-all').addEventListener('click', function () { controller.replaceAll(); });

    return bar;
  }

  /* ---------------- 对外接口 ---------------- */

  function attach(host, options) {
    options = options || {};

    var targetOptions = { highlight: options.highlight !== false };

    var targets = (options.targets || []).map(function (item) {
      if (!item) return null;
      if (item.nodeType === 1 && item.tagName === 'TEXTAREA') return new TextTarget(item, targetOptions);
      if (item.nodeType === 1 && item.tagName === 'INPUT') return new TextTarget(item, targetOptions);
      if (item.nodeType === 1) {
        return new DomTarget(item, options.getText, options.onReplace);
      }
      if (item instanceof DomTarget || item instanceof TextTarget) return item;
      return null;
    }).filter(Boolean);

    /* 同一个 DOM 节点被重复挂查找时复用旧的，避免叠出多层镜像 */
    targets.forEach(function (target) {
      if (target.kind === 'text' && target.input.__textMirror) {
        target.mirror = target.input.__textMirror;
      }
    });

    var controller = new FindController({
      label: options.label,
      targets: targets,
      getTarget: options.getTarget,
      onClose: options.onClose
    });

    var bar = controller.ensureBar();

    var anchor = host || document.getElementById('content');
    if (anchor) anchor.appendChild(bar);

    var scope = bar.querySelector('.app-find-scope');
    if (scope) scope.textContent = options.scope || '';

    return controller;
  }

  /**
   * 为一个纯文本 textarea 快速挂上查找条（工具内部使用）。
   */
  function attachTextarea(host, textarea, options) {
    return attach(host, Object.assign({}, options, { targets: [textarea] }));
  }

  /**
   * 工具可以注册自己的查找入口；Ctrl+F 时优先调用它。
   */
  function setOverride(fn) {
    override = typeof fn === 'function' ? fn : null;
  }

  function clearOverride() {
    override = null;
  }

  function runOverride() {
    if (!override) return false;
    try {
      return override() !== false;
    } catch (err) {
      if (root.console && console.error) console.error('[finder] override 失败', err);
      return false;
    }
  }

  root.Finder = {
    attach: attach,
    attachTextarea: attachTextarea,
    setOverride: setOverride,
    clearOverride: clearOverride,
    runOverride: runOverride,
    isEditable: isEditable,
    escapeRegExp: escapeRegExp,
    lineColumnOfText: lineColumnOfText,
    TextTarget: TextTarget,
    DomTarget: DomTarget
  };
})(window);
