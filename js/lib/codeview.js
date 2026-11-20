/* =========================================================
 * 开发工具箱 — 带行号与语法着色的代码视图
 * 只用一层原生滚动容器：行号栏 position:sticky 固定在左侧，
 * 横向 / 纵向滚动都不需要 JS 同步，渲染再长也不会错位。
 *   createReadonly —— 只读展示（SQL 结果等）
 *   createEditor   —— 可编辑（便签），textarea 叠在着色层上
 * ========================================================= */
(function (root) {
  'use strict';

  var Syntax = root.Syntax;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function countLines(text) {
    if (!text) return 1;
    var lines = 1;
    for (var i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) === 10) lines++;
    }
    return lines;
  }

  function fillGutter(box, count) {
    var frag = document.createDocumentFragment();
    for (var i = 1; i <= count; i++) frag.appendChild(el('div', '', String(i)));
    box.textContent = '';
    box.appendChild(frag);
  }

  function debounce(fn, wait) {
    var timer = 0;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(context, args); }, wait);
    };
  }

  /* ---------------- 只读视图 ---------------- */

  function createReadonly(options) {
    options = options || {};

    var rootNode = el('div', 'code-view');
    var scroll = el('div', 'code-view-scroll');
    var inner = el('div', 'code-view-inner');
    var gutter = el('div', 'code-view-gutter');
    var gutterInner = el('div', 'code-view-gutter-inner');
    var pre = el('pre', 'code-view-pre');
    var code = el('code');

    gutter.appendChild(gutterInner);
    pre.appendChild(code);
    inner.appendChild(gutter);
    inner.appendChild(pre);
    scroll.appendChild(inner);
    rootNode.appendChild(scroll);

    var state = {
      language: options.language || 'text',
      dialect: options.dialect || '',
      text: ''
    };

    function render() {
      var text = state.text;
      var lines = countLines(text);

      fillGutter(gutterInner, Math.min(lines, 20000));

      if (!text) {
        code.textContent = '';
        code.classList.add('is-empty');
        if (options.placeholder) code.textContent = options.placeholder;
        return;
      }

      code.classList.remove('is-empty');

      if (Syntax && state.language !== 'text' && text.length <= Syntax.MAX_LENGTH) {
        code.innerHTML = Syntax.highlight(state.language, text, { dialect: state.dialect });
      } else {
        code.textContent = text;
      }
    }

    function setValue(text) {
      state.text = String(text === null || text === undefined ? '' : text);
      render();
      /* 重置滚动，避免换内容后停在旧位置 */
      scroll.scrollTop = 0;
      scroll.scrollLeft = 0;
    }

    setValue(options.value || '');

    return {
      root: rootNode,
      pre: pre,
      code: code,
      scroll: scroll,
      setValue: setValue,
      getValue: function () { return state.text; },
      setLanguage: function (language) {
        state.language = language || 'text';
        render();
      },
      getLanguage: function () { return state.language; },
      setDialect: function (dialect) {
        state.dialect = dialect || '';
        render();
      },
      getDialect: function () { return state.dialect; },
      setWrap: function (wrap) {
        rootNode.classList.toggle('is-wrap', !!wrap);
      },
      repaint: render
    };
  }

  /* ---------------- 可编辑视图 ---------------- */

  function createEditor(options) {
    options = options || {};

    var rootNode = el('div', 'code-view code-view-edit');
    var scroll = el('div', 'code-view-scroll');
    var inner = el('div', 'code-view-inner');
    var gutter = el('div', 'code-view-gutter');
    var gutterInner = el('div', 'code-view-gutter-inner');

    var pane = el('div', 'code-view-pane');
    var layer = el('pre', 'code-view-pre code-view-layer');
    var code = el('code');
    var input = el('textarea', 'code-view-input');

    input.spellcheck = false;
    input.autocomplete = 'off';
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('wrap', 'off');
    if (options.placeholder) input.placeholder = options.placeholder;
    input.setAttribute('aria-label', options.label || '文本编辑');

    layer.appendChild(code);
    pane.appendChild(layer);
    pane.appendChild(input);

    gutter.appendChild(gutterInner);
    inner.appendChild(gutter);
    inner.appendChild(pane);
    scroll.appendChild(inner);
    rootNode.appendChild(scroll);

    var state = {
      language: options.language || 'text',
      dialect: options.dialect || '',
      lastLines: -1
    };

    function paint() {
      var text = input.value;
      var lines = countLines(text);

      if (lines !== state.lastLines) {
        state.lastLines = lines;
        fillGutter(gutterInner, Math.min(lines, 50000));
      }

      if (Syntax && state.language !== 'text' && text.length <= Syntax.MAX_LENGTH) {
        code.innerHTML = Syntax.highlight(state.language, text, { dialect: state.dialect });
      } else {
        code.textContent = text;
      }

      /* 补一个换行，保证最后一行高度与 textarea 一致 */
      if (text.slice(-1) === '\n' || !text) code.appendChild(document.createTextNode('\n'));

      markCurrentLine();
    }

    function markCurrentLine() {
      var line = cursorInfo().line;
      var previous = gutterInner.querySelector('.is-current');
      if (previous) previous.classList.remove('is-current');
      var node = gutterInner.children[line - 1];
      if (node) node.classList.add('is-current');
    }

    function cursorInfo() {
      var start = input.selectionStart;
      var before = input.value.slice(0, start);
      var line = before.split('\n').length;
      return { line: line, column: start - input.value.lastIndexOf('\n', start - 1), offset: start };
    }

    /* textarea 高度等于内容高度，内部不滚动；外包容器负责滚动 */
    function revealCaret() {
      var info = cursorInfo();
      var lineHeight = 21;
      var padding = 12;
      var top = padding + (info.line - 1) * lineHeight;
      var visibleTop = scroll.scrollTop;
      var visibleBottom = visibleTop + scroll.clientHeight;

      if (top < visibleTop + lineHeight) {
        scroll.scrollTop = Math.max(0, top - lineHeight * 2);
      } else if (top + lineHeight * 2 > visibleBottom) {
        scroll.scrollTop = top - scroll.clientHeight + lineHeight * 3;
      }

      input.scrollTop = 0;
      input.scrollLeft = 0;
    }

    function reportCursor() {
      if (typeof options.onCursor === 'function') options.onCursor(cursorInfo());
    }

    function handleChange() {
      paint();
      revealCaret();
      reportCursor();
      if (typeof options.onInput === 'function') options.onInput(input.value);
    }

    var repaint = debounce(paint, 90);

    input.addEventListener('input', handleChange);

    ['keyup', 'click', 'select', 'focus'].forEach(function (type) {
      input.addEventListener(type, function () {
        markCurrentLine();
        reportCursor();
      });
    });

    input.addEventListener('scroll', function () {
      /* 任何内部滚动都归零，交给外层容器 */
      if (input.scrollTop !== 0) input.scrollTop = 0;
      if (input.scrollLeft !== 0) input.scrollLeft = 0;
    });

    /* Tab 插入两个空格；Shift+Tab 反缩进；有选区时整块缩进 */
    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();

      var start = input.selectionStart;
      var end = input.selectionEnd;
      var value = input.value;

      if (event.shiftKey) {
        var lineStart = value.lastIndexOf('\n', start - 1) + 1;
        var block = value.slice(lineStart, end);
        var dedented = block.replace(/^( {1,2}|\t)/gm, '');
        input.value = value.slice(0, lineStart) + dedented + value.slice(end);
        input.setSelectionRange(lineStart, lineStart + dedented.length);
      } else if (start === end) {
        input.value = value.slice(0, start) + '  ' + value.slice(end);
        input.setSelectionRange(start + 2, start + 2);
      } else {
        var from = value.lastIndexOf('\n', start - 1) + 1;
        var chunk = value.slice(from, end);
        var indented = chunk.replace(/^/gm, '  ');
        input.value = value.slice(0, from) + indented + value.slice(end);
        input.setSelectionRange(from, from + indented.length);
      }

      handleChange();
    });

    /* 粘贴 / 撤销后需要重画 */
    input.addEventListener('paste', function () {
      setTimeout(handleChange, 0);
    });

    input.addEventListener('scroll', revealCaret);

    function setValue(text, silent) {
      input.value = String(text === null || text === undefined ? '' : text);
      state.lastLines = -1;
      paint();
      scroll.scrollTop = 0;
      scroll.scrollLeft = 0;
      reportCursor();
      if (!silent && typeof options.onInput === 'function') options.onInput(input.value);
    }

    setValue(options.value || '', true);

    /* 可编辑视图自带撤销 / 重做：工具不用再各接一遍 */
    if (root.TextHistory) {
      root.TextHistory.attach(input, {
        onChange: function () {
          if (typeof options.onHistory === 'function') options.onHistory();
        }
      });
    }

    /* 行号栏点击不能把光标移出编辑器 */
    gutter.addEventListener('mousedown', function (event) {
      event.preventDefault();
    });

    return {
      root: rootNode,
      input: input,
      layer: layer,
      code: code,
      scroll: scroll,
      gutter: gutterInner,
      gutterEl: gutter,
      getValue: function () { return input.value; },
      setValue: setValue,
      repaint: function () { paint(); revealCaret(); },
      setLanguage: function (language) {
        state.language = language || 'text';
        paint();
        if (typeof options.onInput === 'function') options.onInput(input.value);
      },
      getLanguage: function () { return state.language; },
      setDialect: function (dialect) {
        state.dialect = dialect || '';
        paint();
      },
      getDialect: function () { return state.dialect; },
      setWrap: function (wrap) {
        rootNode.classList.toggle('is-wrap', !!wrap);
        revealCaret();
      },
      setLineNumbers: function (visible) {
        gutter.style.display = visible ? '' : 'none';
        revealCaret();
      },
      focus: function () { input.focus(); },
      cursor: cursorInfo,
      insert: function (text) {
        var start = input.selectionStart;
        var end = input.selectionEnd;
        input.value = input.value.slice(0, start) + text + input.value.slice(end);
        input.setSelectionRange(start + text.length, start + text.length);
        handleChange();
        input.focus();
      }
    };
  }

  root.CodeView = {
    createReadonly: createReadonly,
    createEditor: createEditor,
    countLines: countLines
  };
})(window);
