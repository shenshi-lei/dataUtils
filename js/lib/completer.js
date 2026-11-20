/* =========================================================
 * 开发工具箱 — 文本域关键字补全
 * 一个轻量的候选弹层：输入时给出候选，↑↓ 选择，Enter / Tab 接受，
 * Esc 关闭。候选由调用方提供，这里只负责取词、定位、按键与插入。
 *
 *   var c = Completer.attach(textarea, {
 *     getCandidates: function (prefix, context) { return [{ word, kind }]; },
 *     minChars: 2,
 *     onAccept: function (word) {}
 *   });
 *   c.open(force)   c.close()   c.refresh()
 * ========================================================= */
(function (root) {
  'use strict';

  var KIND_LABELS = {
    keyword: '关键字',
    type: '类型',
    function: '函数',
    table: '表',
    column: '字段',
    snippet: '片段'
  };

  /* 取光标所在的那个「词」：字母、数字、下划线、$ 与中文字符 */
  function wordAt(text, caret) {
    var start = caret;
    while (start > 0 && /[A-Za-z0-9_$#\u4e00-\u9fa5]/.test(text.charAt(start - 1))) start--;
    return { start: start, end: caret, word: text.slice(start, caret) };
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function Completer(input, options) {
    options = options || {};

    this.input = input;
    this.getCandidates = typeof options.getCandidates === 'function' ? options.getCandidates : null;
    this.minChars = options.minChars === undefined ? 2 : options.minChars;
    this.maxItems = options.maxItems || 60;
    this.onAccept = typeof options.onAccept === 'function' ? options.onAccept : null;
    this.host = options.host || input.parentNode;

    this.node = null;
    this.list = null;
    this.items = [];
    this.active = -1;
    this.open = false;
    this.range = null;
    this.suppressed = false;

    var self = this;

    input.addEventListener('keydown', function (event) {
      self.handleKeydown(event);
    });

    input.addEventListener('input', function () {
      self.suppressed = false;
      self.refresh();
    });

    input.addEventListener('blur', function () {
      /* 点击弹层时 input 会先失焦，延后关闭避免点了没反应 */
      setTimeout(function () {
        if (!self.node) return;
        var focused = document.activeElement;
        if (focused && self.node.contains(focused)) return;
        self.close();
      }, 120);
    });

    input.addEventListener('click', function () {
      self.refresh();
    });

    if (root.ResizeObserver) {
      this.observer = new ResizeObserver(function () {
        if (self.open) self.position();
      });
      this.observer.observe(input);
    }
  }

  Completer.prototype.ensureNode = function () {
    if (this.node) return this.node;

    var box = el('div', 'sql-complete');
    box.hidden = true;

    var list = el('div', 'sql-complete-list');
    box.appendChild(list);

    var foot = el('div', 'sql-complete-foot', '↑↓ 选择 · Enter 补全 · Esc 关闭');
    box.appendChild(foot);

    this.host.appendChild(box);

    this.node = box;
    this.list = list;
    return box;
  };

  Completer.prototype.candidates = function (prefix) {
    if (!this.getCandidates) return [];

    var context = {
      input: this.input,
      value: this.input.value,
      caret: this.input.selectionStart || 0
    };

    var list;

    try {
      list = this.getCandidates(prefix, context) || [];
    } catch (err) {
      return [];
    }

    var seen = Object.create(null);
    var result = [];

    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item) continue;

      var word = typeof item === 'string' ? item : item.word;
      if (!word) continue;
      if (prefix && word.toLowerCase().indexOf(prefix.toLowerCase()) !== 0) continue;

      var key = word.toLowerCase();
      if (seen[key]) continue;
      seen[key] = true;

      result.push({
        word: word,
        kind: typeof item === 'object' && item.kind ? item.kind : 'keyword',
        detail: typeof item === 'object' && item.detail ? item.detail : ''
      });

      if (result.length >= this.maxItems) break;
    }

    /* 前缀完全相等的候选排第一，其余按长度排序，短词优先 */
    result.sort(function (a, b) {
      var exactA = a.word.toLowerCase() === prefix.toLowerCase() ? 0 : 1;
      var exactB = b.word.toLowerCase() === prefix.toLowerCase() ? 0 : 1;
      if (exactA !== exactB) return exactA - exactB;
      if (a.word.length !== b.word.length) return a.word.length - b.word.length;
      return a.word.toLowerCase() < b.word.toLowerCase() ? -1 : 1;
    });

    return result;
  };

  Completer.prototype.refresh = function (force) {
    if (this.suppressed) return false;

    var input = this.input;
    var caret = input.selectionStart || 0;

    if (input.selectionStart !== input.selectionEnd) {
      this.close();
      return false;
    }

    var found = wordAt(input.value, caret);
    var prefix = found.word;

    if (!force && prefix.length < this.minChars) {
      this.close();
      return false;
    }

    var items = this.candidates(prefix);

    /* 只有一个候选且已经完全写出来了，就不打扰 */
    if (items.length === 1 && items[0].word.toLowerCase() === prefix.toLowerCase()) {
      this.close();
      return false;
    }

    if (!items.length) {
      this.close();
      return false;
    }

    this.range = found;
    this.items = items;
    this.active = 0;
    this.ensureNode();
    this.render();
    this.node.hidden = false;
    this.open = true;
    this.position();
    return true;
  };

  Completer.prototype.render = function () {
    var self = this;
    this.list.textContent = '';

    this.items.forEach(function (item, index) {
      var row = el('button', 'sql-complete-item' + (index === self.active ? ' is-active' : ''));
      row.type = 'button';
      row.title = item.detail || item.word;

      row.appendChild(el('span', 'sql-complete-kind', KIND_LABELS[item.kind] || item.kind));
      row.appendChild(el('span', 'sql-complete-word', item.word));

      /* mousedown 而不是 click：抢在输入框失焦之前完成插入 */
      row.addEventListener('mousedown', function (event) {
        event.preventDefault();
        self.accept(index);
      });

      self.list.appendChild(row);
    });

    var current = this.list.children[this.active];
    if (current && current.scrollIntoView) current.scrollIntoView({ block: 'nearest' });
  };

  Completer.prototype.position = function () {
    if (!this.node || !this.open) return;

    var input = this.input;
    var host = this.host;
    var style = getComputedStyle(input);
    var hostRect = host.getBoundingClientRect();
    var inputRect = input.getBoundingClientRect();

    var mirror = root.TextMirror && root.TextMirror.of(input);
    var caret = mirror ? mirror.caretRect() : null;

    var left;
    var top;

    if (caret) {
      left = inputRect.left - hostRect.left + (parseFloat(style.borderLeftWidth) || 0) + caret.left;
      top = inputRect.top - hostRect.top + (parseFloat(style.borderTopWidth) || 0) + caret.top + caret.lineHeight;
    } else {
      left = inputRect.left - hostRect.left + 12;
      top = inputRect.top - hostRect.top + 32;
    }

    var width = this.node.offsetWidth || 240;
    var maxLeft = host.clientWidth - width - 6;

    this.node.style.left = Math.max(4, Math.min(left, Math.max(4, maxLeft))) + 'px';
    this.node.style.top = Math.max(4, top) + 'px';
  };

  Completer.prototype.move = function (delta) {
    if (!this.items.length) return;

    this.active = (this.active + delta + this.items.length) % this.items.length;
    this.render();
  };

  Completer.prototype.accept = function (index) {
    var item = this.items[index === undefined ? this.active : index];
    if (!item || !this.range) return false;

    var input = this.input;
    var range = this.range;

    /* 光标在等待期间被挪走了就放弃这次补全，避免插到错误的位置 */
    if (input.selectionStart !== range.end) {
      this.close();
      return false;
    }

    var after = input.value.slice(range.end);
    var next = input.value.slice(0, range.start) + item.word + after;

    input.value = next;
    input.setSelectionRange(range.start + item.word.length, range.start + item.word.length);
    input.dispatchEvent(new Event('input', { bubbles: true }));

    this.close();

    if (this.onAccept) this.onAccept(item.word, item);
    return true;
  };

  Completer.prototype.close = function () {
    this.open = false;
    this.items = [];
    this.active = -1;
    if (this.node) this.node.hidden = true;
  };

  Completer.prototype.handleKeydown = function (event) {
    if (event.isComposing) return;

    var modifier = event.ctrlKey || event.metaKey;

    /* Ctrl+Space 手动打开，即使还没输入够字符 */
    if (modifier && (event.key === ' ' || event.code === 'Space')) {
      event.preventDefault();
      this.refresh(true);
      return;
    }

    if (!this.open) {
      if (event.key === 'Escape') return;
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.move(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.move(-1);
      return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      this.accept();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      /* 关闭弹层时吞掉这次 Esc，避免上层再处理一遍 */
      this.suppressed = true;
    }
  };

  Completer.prototype.destroy = function () {
    if (this.observer) this.observer.disconnect();
    if (this.node && this.node.parentNode) this.node.parentNode.removeChild(this.node);
    this.node = null;
    this.items = [];
  };

  function attach(input, options) {
    if (!input) return null;
    if (input.__completer) return input.__completer;

    var completer = new Completer(input, options);
    input.__completer = completer;
    return completer;
  }

  root.Completer = {
    attach: attach,
    of: function (input) {
      return input && input.__completer ? input.__completer : null;
    },
    wordAt: wordAt
  };
})(window);
