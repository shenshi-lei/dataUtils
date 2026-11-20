/* =========================================================
 * 开发工具箱 — 通用撤销 / 重做
 * 给任意 textarea 挂一份独立的历史栈：输入时自动记录快照，
 * Ctrl+Z / Ctrl+Y（以及 Ctrl+Shift+Z / Mac 的 ⌘⇧Z）走我们自己的栈，
 * 保证跨工具的撤销行为一致，并且撤销后滚动位置与光标都被还原。
 *
 *   History.attach(textarea, options) -> api
 *   api.undo() / api.redo() / api.canUndo() / api.canRedo()
 *   api.record(force)     记录当前值（程序化修改后手动调用）
 *   api.reset(value)      清空历史并以当前值为基线
 * ========================================================= */
(function (root) {
  'use strict';

  /* 快照数量与总字符数双重上限，避免大文本把内存吃光 */
  var LIMIT = 120;
  var CHAR_LIMIT = 4000000;
  /* 连续输入合并成一次撤销的静默间隔 */
  var BURST_GAP = 700;

  function closest(node, selector) {
    while (node && node.nodeType === 1) {
      if (node.matches ? node.matches(selector) : false) return node;
      node = node.parentNode;
    }
    return null;
  }

  function isEditable(node) {
    if (!node || node.nodeType !== 1) return false;
    if (node.tagName === 'TEXTAREA') return true;
    if (node.tagName === 'INPUT') {
      var type = (node.getAttribute('type') || 'text').toLowerCase();
      return type === 'text' || type === 'search' || type === 'url' || type === 'tel' || type === 'email' || type === 'number';
    }
    return node.isContentEditable === true;
  }

  /* 工具正被弹窗之类的浮层占用焦点时，不让全局 Ctrl+Z 抢走按键 */
  function inFloatingLayer(node) {
    while (node && node.nodeType === 1) {
      if (node.matches && node.matches('.app-find, .sql-complete, .toast, dialog[open]')) return true;
      node = node.parentNode;
    }
    return false;
  }

  function TextHistory(input, options) {
    options = options || {};

    this.input = input;
    this.limit = options.limit || LIMIT;
    this.charLimit = options.charLimit || CHAR_LIMIT;
    this.onChange = typeof options.onChange === 'function' ? options.onChange : null;
    this.undoStack = [];
    this.redoStack = [];
    this.chars = 0;
    this.lastText = input.value;
    this.lastStart = input.selectionStart || 0;
    this.lastEnd = input.selectionEnd || 0;
    this.lastAt = 0;
    this.burst = false;
    this.ignoreNext = false;
    this.applying = false;
    this.pending = false;

    var self = this;

    input.addEventListener('beforeinput', function (event) {
      if (event.inputType === 'historyUndo') {
        event.preventDefault();
        self.undo();
      } else if (event.inputType === 'historyRedo') {
        event.preventDefault();
        self.redo();
      }
    });

    input.addEventListener('input', function () {
      if (self.applying) return;
      self.capture();
    });

    input.addEventListener('blur', function () {
      self.burst = false;
      self.lastAt = 0;
    });

    input.__history = this;
  }

  TextHistory.prototype.snapshot = function () {
    return {
      text: this.input.value,
      start: this.input.selectionStart || 0,
      end: this.input.selectionEnd || 0,
      scrollTop: this.input.scrollTop,
      scrollLeft: this.input.scrollLeft
    };
  };

  TextHistory.prototype.pushUndo = function (snapshot) {
    var top = this.undoStack[this.undoStack.length - 1];
    if (top && top.text === snapshot.text) {
      this.redoStack.length = 0;
      this.notify();
      return;
    }

    this.undoStack.push(snapshot);
    this.chars += snapshot.text.length;

    while (this.undoStack.length > 1 &&
      (this.undoStack.length > this.limit || this.chars > this.charLimit)) {
      this.chars -= this.undoStack.shift().text.length;
    }

    this.redoStack.length = 0;
    this.notify();
  };

  /* 收集一次可撤销的变更；连续击键按时间合并 */
  TextHistory.prototype.capture = function () {
    var text = this.input.value;

    /* record() 刚把「修改前」记成一个撤销点，这里的 input 事件不再重复记 */
    if (this.pendingBaseline) {
      this.pendingBaseline = false;
      this.burst = false;
      this.lastAt = 0;
      this.lastText = text;
      this.lastStart = this.input.selectionStart || 0;
      this.lastEnd = this.input.selectionEnd || 0;
      return;
    }

    if (text === this.lastText) return;

    var now = Date.now();
    var previous = {
      text: this.lastText,
      start: this.lastStart,
      end: this.lastEnd
    };

    if (!this.burst || now - this.lastAt > BURST_GAP) {
      this.pushUndo(previous);
      this.burst = true;
    }

    this.lastAt = now;
    this.lastText = text;
    this.lastStart = this.input.selectionStart || 0;
    this.lastEnd = this.input.selectionEnd || 0;
  };

  /* 程序化修改后调用：把当前值记为新的基线（不产生撤销点） */
  TextHistory.prototype.reset = function () {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.chars = 0;
    this.burst = false;
    this.lastAt = 0;
    this.lastText = this.input.value;
    this.lastStart = this.input.selectionStart || 0;
    this.lastEnd = this.input.selectionEnd || 0;
    this.notify();
  };

  /* 程序化修改前调用：把「修改前的值」记成一个撤销点 */
  TextHistory.prototype.record = function () {
    var current = this.input.value;

    if (current !== this.lastText) {
      this.pushUndo({
        text: this.lastText,
        start: this.lastStart,
        end: this.lastEnd
      });
    } else {
      this.pushUndo(this.snapshot());
    }

    this.burst = false;
    this.lastAt = 0;
    this.lastStart = this.input.selectionStart || 0;
    this.lastEnd = this.input.selectionEnd || 0;
    this.lastText = current;

    /* 紧接着的 input 事件来自这次程序化修改，不要再记一次 */
    this.pendingBaseline = true;
  };

  TextHistory.prototype.apply = function (snapshot, focus) {
    this.applying = true;
    this.input.value = snapshot.text;
    this.input.scrollTop = snapshot.scrollTop || 0;
    this.input.scrollLeft = snapshot.scrollLeft || 0;

    if (focus !== false) {
      this.input.focus();
      try {
        this.input.setSelectionRange(snapshot.start, snapshot.end);
      } catch (err) {
        /* number 输入框不支持 setSelectionRange */
      }
    }

    /* 撤销 / 重做产生的 input 事件不能再被记录成新的撤销点 */
    this.pendingBaseline = true;
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    this.applying = false;

    this.burst = false;
    this.lastAt = 0;
    this.lastText = snapshot.text;
    this.lastStart = snapshot.start;
    this.lastEnd = snapshot.end;
    this.notify();
  };

  TextHistory.prototype.undo = function () {
    /* 把还没记录的击键先并入撤销队列 */
    this.capture();

    var snapshot = this.undoStack.pop();
    if (!snapshot) return false;

    this.chars -= snapshot.text.length;
    this.redoStack.push(this.snapshot());
    this.apply(snapshot);
    return true;
  };

  TextHistory.prototype.redo = function () {
    var snapshot = this.redoStack.pop();
    if (!snapshot) return false;

    this.undoStack.push(this.snapshot());
    this.chars += this.input.value.length;
    this.apply(snapshot);
    return true;
  };

  TextHistory.prototype.canUndo = function () {
    return this.undoStack.length > 0 || this.input.value !== (this.lastText || '');
  };

  TextHistory.prototype.canRedo = function () {
    return this.redoStack.length > 0;
  };

  TextHistory.prototype.notify = function () {
    if (this.onChange) this.onChange(this);
  };

  TextHistory.prototype.destroy = function () {
    this.input.__history = null;
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  };

  /* ---------------- 全局快捷键 ---------------- */

  function targetOf(event) {
    var node = event.target;

    /* 查找条、补全弹层、对话框里的输入框走浏览器自己的撤销 */
    if (inFloatingLayer(node)) return null;

    if (isEditable(node)) return node;

    var host = closest(node, '[data-history-target]');
    if (host) {
      var input = document.getElementById(host.getAttribute('data-history-target'));
      if (input) return input;
    }

    if (root.Toolbox && typeof root.Toolbox.historyTarget === 'function') {
      var fallback = root.Toolbox.historyTarget();
      if (fallback) return fallback;
    }

    return null;
  }

  function onKeydown(event) {
    if (event.isComposing) return;
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.altKey) return;

    var key = String(event.key || '').toLowerCase();
    var isUndo = key === 'z' && !event.shiftKey;
    var isRedo = key === 'y' || (key === 'z' && event.shiftKey);

    if (!isUndo && !isRedo) return;

    var input = targetOf(event);
    if (!input || !input.__history) return;

    event.preventDefault();

    if (isUndo) input.__history.undo();
    else input.__history.redo();
  }

  if (root.document) {
    root.document.addEventListener('keydown', onKeydown, true);
  }

  /* ---------------- 对外接口 ---------------- */

  function attach(input, options) {
    if (!input) return null;
    if (input.__history) return input.__history;

    var history = new TextHistory(input, options);
    if (input.value) history.lastText = input.value;
    return history;
  }

  function of(input) {
    return input && input.__history ? input.__history : null;
  }

  root.TextHistory = {
    attach: attach,
    of: of,
    isEditable: isEditable
  };
})(window);
