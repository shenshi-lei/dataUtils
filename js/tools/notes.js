/* =========================================================
 * 工具：便签 / 记事本
 * 多文档、行号、语法着色、查找高亮、撤销重做、全库搜索、行操作、锁定、
 * 自动保存到 localStorage，单条 / 整体导入导出。
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;
  var Syntax = window.Syntax;

  var STORE_KEY = 'notes';
  var MAX_DOCS = 30;
  /* 全库搜索：结果总上限 80 条，单个便签最多取 80 条，每个便签最多扫 500 处 */
  var HIT_LIMIT = 80;
  var HITS_PER_DOC = 80;
  var SCAN_PER_DOC = 500;
  /* 阅读时间估算 */
  var WORDS_PER_MINUTE = 400;
  var SORTS = ['updated', 'name', 'length'];

  /* ---------------- 通用小工具 ---------------- */

  function uid() {
    return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function pad2(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function timeLabel(ms) {
    if (!ms) return '—';
    var date = new Date(ms);
    return pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) + ' ' +
      pad2(date.getHours()) + ':' + pad2(date.getMinutes());
  }

  function stampLabel(date) {
    return date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate()) + '-' +
      pad2(date.getHours()) + pad2(date.getMinutes());
  }

  function defaultDoc(name, content, language) {
    return {
      id: uid(),
      name: name || '未命名',
      content: content || '',
      language: language || 'text',
      updatedAt: Date.now(),
      locked: false
    };
  }

  function readTimeLabel(chars) {
    var count = Math.max(0, Number(chars) || 0);
    if (!count) return '0 分钟';
    var minutes = count / WORDS_PER_MINUTE;
    if (minutes < 1) return '< 1 分钟';
    return Math.round(minutes) + ' 分钟';
  }

  /* 0 基行号 —— 这些函数只服务于行操作与光标定位 */
  function lineStartOf(text, index) {
    var pos = 0;
    for (var i = 0; i < index; i++) {
      var next = text.indexOf('\n', pos);
      if (next < 0) return text.length;
      pos = next + 1;
    }
    return pos;
  }

  function lineEndOf(text, index) {
    var start = lineStartOf(text, index);
    var next = text.indexOf('\n', start);
    return next < 0 ? text.length : next;
  }

  function lineIndexOf(text, offset) {
    var value = String(text || '');
    var end = Math.max(0, Math.min(offset, value.length));
    var line = 0;
    for (var i = 0; i < end; i++) {
      if (value.charCodeAt(i) === 10) line++;
    }
    return line;
  }

  /* 选区覆盖到的整行范围（终止行落在下一行行首时不算下一行） */
  function lineRangeOf(value, start, end) {
    var from = Math.max(0, Math.min(start, end));
    var to = Math.max(from, Math.max(start, end));
    var fromOffset = value.lastIndexOf('\n', from - 1) + 1;
    var scan = (to > from && value.charAt(to - 1) === '\n') ? to - 1 : to;
    var toOffset = value.indexOf('\n', scan);
    if (toOffset < 0) toOffset = value.length;
    return { from: fromOffset, to: toOffset };
  }

  function leadingSpaceLength(line) {
    var i = 0;
    while (i < line.length && (line.charAt(i) === ' ' || line.charAt(i) === '\t')) i++;
    return i;
  }

  /* 注释符号按语言切换 */
  function commentStyleOf(language) {
    switch (language) {
      case 'sql':
        return { open: '--', close: '' };
      case 'python':
      case 'shell':
      case 'properties':
        return { open: '#', close: '' };
      case 'xml':
      case 'markdown':
        return { open: '<!--', close: '-->' };
      case 'json':
      case 'javascript':
      case 'java':
      case 'css':
        return { open: '//', close: '' };
      default:
        return { open: '#', close: '' };
    }
  }

  /* 导出扩展名：markdown→.md、sql→.sql、json→.json，其它→.txt */
  function extensionOf(language) {
    if (language === 'markdown') return 'md';
    if (language === 'sql') return 'sql';
    if (language === 'json') return 'json';
    return 'txt';
  }

  function mimeOf(extension) {
    if (extension === 'json') return 'application/json;charset=utf-8';
    return 'text/plain;charset=utf-8';
  }

  function createInstance() {
    var saved = ui.storageGet(STORE_KEY, null);

    var docs = [];
    if (saved && saved.docs && saved.docs.length) {
      docs = saved.docs.map(function (item) {
        return {
          id: item.id || uid(),
          name: item.name || '未命名',
          content: item.content || '',
          language: item.language || 'text',
          updatedAt: item.updatedAt || Date.now(),
          locked: !!item.locked
        };
      });
    }

    if (!docs.length) {
      docs.push(defaultDoc('便签 1',
        '// 便签：带行号 + 语法着色，内容只存在本机浏览器\n' +
        'function remember(idea) {\n' +
        '  var note = "# " + idea;\n' +
        '  return note + " 已记下";   // 行号与配色随输入实时更新\n' +
        '}\n' +
        '\n' +
        'const API = "https://example.com/api";\n' +
        'let count = 0;\n' +
        'count += 1;\n' +
        '\n' +
        '/* 换上面的「语法」下拉，可以切成 SQL / JSON / Java / Python / Markdown 等 */\n' +
        '/* Ctrl+F 查找高亮 · Ctrl+H 替换 · Ctrl+Z 撤销 · Ctrl+S 保存 · 侧栏可全库搜索 */\n',
        'javascript'));
    }

    var activeId = saved && saved.activeId && docs.some(function (item) { return item.id === saved.activeId; })
      ? saved.activeId
      : docs[0].id;

    var state = {
      activeId: activeId,
      wrap: !!(saved && saved.wrap),
      lineNumbers: !(saved && saved.lineNumbers === false),
      sort: saved && SORTS.indexOf(saved.sort) >= 0 ? saved.sort : 'updated',
      query: '',
      hits: [],
      hitTotal: 0,
      dirty: false
    };

    var root = ui.el('section', 't-page');
    root.appendChild(ui.head({
      icon: 'i-file',
      title: '便签',
      desc: '类似记事本的多文档便签：行号与语法着色、查找高亮、撤销重做、全库搜索、行操作与锁定；内容自动保存在本机浏览器，不上传。',
      search: true
    }));

    /* ---------------- 工具栏 ---------------- */

    var toolbar = ui.el('div', 't-toolbar is-split');
    var options = ui.el('div', 't-options');

    var langSelect = ui.el('select', 't-select');
    langSelect.setAttribute('aria-label', '语法着色语言');
    Syntax.LANGUAGES.forEach(function (item) {
      var option = ui.el('option', '', item.label);
      option.value = item.id;
      langSelect.appendChild(option);
    });

    var wrapBox = ui.checkbox('自动换行', { checked: state.wrap });
    var lineBox = ui.checkbox('显示行号', { checked: state.lineNumbers });

    options.appendChild(ui.field('语法', langSelect));
    options.appendChild(wrapBox.label);
    options.appendChild(lineBox.label);
    toolbar.appendChild(options);

    var actions = ui.el('div', 't-actions');

    var searchBtn = ui.miniButton('查找', {
      icon: 'i-search',
      title: '在当前便签中查找高亮 (Ctrl+F)',
      onClick: function () { TB.find(); }
    });

    var replaceBtn = ui.miniButton('替换', {
      icon: 'i-replace',
      title: '在当前便签中查找并替换 (Ctrl+H)',
      onClick: function () { TB.find({ replace: true }); }
    });

    var pasteBtn = ui.miniButton('粘贴', {
      icon: 'i-upload',
      title: '从剪贴板读取并替换当前内容',
      onClick: function () {
        if (!requireUnlocked('粘贴')) return;
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          ui.toast('当前浏览器不允许读取剪贴板，请手动粘贴');
          return;
        }
        navigator.clipboard.readText().then(function (text) {
          applyEdit(text, text.length, text.length);
          ui.toast('已粘贴 ' + text.length + ' 字符');
        }, function () { ui.toast('读取剪贴板失败'); });
      }
    });

    var importBtn = ui.miniButton('导入', {
      icon: 'i-file',
      title: '导入本地文本文件为新便签',
      onClick: function () { fileInput.click(); }
    });

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.md,.json,.sql,.java,.js,.py,.xml,.html,.css,.yml,.yaml,.properties,.log,text/*';
    fileInput.hidden = true;
    fileInput.setAttribute('aria-hidden', 'true');
    /* 挂在视图里（隐藏），这样浏览器与自动化都能拿到它 */
    root.appendChild(fileInput);

    var exportBtn = ui.miniButton('导出', {
      icon: 'i-download',
      title: '导出当前便签（按语法选择扩展名）',
      onClick: function () { exportActive(); }
    });

    var clearBtn = ui.miniButton('清空', {
      icon: 'i-trash',
      danger: true,
      title: '清空当前便签内容',
      onClick: function () {
        if (!requireUnlocked('清空')) return;
        var empty = '';
        applyEdit(empty, 0, 0);
        ui.toast('已清空当前便签');
      }
    });

    actions.appendChild(searchBtn);
    actions.appendChild(replaceBtn);
    actions.appendChild(pasteBtn);
    actions.appendChild(importBtn);
    actions.appendChild(exportBtn);
    actions.appendChild(clearBtn);
    toolbar.appendChild(actions);
    root.appendChild(toolbar);

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function () {
        var text = String(reader.result || '');

        /* 只有结构明确是便签备份（带 docs 数组）时才按备份合并；
         * 普通 .json 文本仍然当一条便签导入。 */
        var backup = parseBackup(text, true);

        if (backup && backup.length) {
          importDocs(backup, file.name);
          return;
        }

        var guessed = Syntax.detect(text);
        newDoc(file.name.replace(/\.[^.]+$/, ''), text, guessed);
        ui.toast('已导入 ' + file.name);
      };
      reader.onerror = function () { ui.toast('读取文件失败'); };
      reader.readAsText(file);
      fileInput.value = '';
    });

    var backupInput = document.createElement('input');
    backupInput.type = 'file';
    backupInput.accept = '.json,application/json';
    backupInput.hidden = true;
    backupInput.setAttribute('aria-hidden', 'true');
    root.appendChild(backupInput);

    backupInput.addEventListener('change', function () {
      var file = backupInput.files && backupInput.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function () {
        var backup = parseBackup(String(reader.result || ''));
        if (!backup) {
          ui.toast('这不是有效的便签备份文件');
          return;
        }
        importDocs(backup, file.name);
      };
      reader.onerror = function () { ui.toast('读取备份失败'); };
      reader.readAsText(file);
      backupInput.value = '';
    });

    /* ---------------- 主体 ---------------- */

    var np = ui.el('div', 'np');

    var main = ui.el('div', 'np-main');

    /* 标签栏 */
    var head = ui.el('div', 'np-head');
    var tabs = ui.el('div', 'np-tabs');
    head.appendChild(tabs);

    var lockBadge = ui.el('span', 'np-lock');
    lockBadge.appendChild(ui.icon('i-lock'));
    lockBadge.appendChild(ui.el('span', '', '已锁定'));
    lockBadge.hidden = true;
    head.appendChild(lockBadge);

    /* 顶部保存状态点：沿用底部 saveLabel 的文案，避免出现两套状态 */
    var headDot = ui.el('span', 'np-dot');
    headDot.title = '已保存到本机';
    head.appendChild(headDot);

    var headActions = ui.el('div', 'np-actions');

    var lockBtn = ui.miniButton('', {
      icon: 'i-lock',
      title: '锁定当前便签（只读防误改）',
      onClick: function () { toggleLock(); }
    });
    lockBtn.setAttribute('aria-pressed', 'false');

    var newBtn = ui.miniButton('新建', {
      icon: 'i-sparkles',
      title: '新建便签 (Ctrl+Shift+N)',
      onClick: function () { newDoc(); }
    });

    var renameBtn = ui.miniButton('', {
      icon: 'i-type',
      title: '重命名当前便签',
      onClick: function () { renameActive(); }
    });

    var dupBtn = ui.miniButton('', {
      icon: 'i-copy',
      title: '复制当前便签',
      onClick: function () { duplicateActive(); }
    });

    var delBtn = ui.miniButton('', {
      icon: 'i-trash',
      danger: true,
      title: '删除当前便签',
      onClick: function () { deleteActive(); }
    });

    headActions.appendChild(lockBtn);
    headActions.appendChild(newBtn);
    headActions.appendChild(renameBtn);
    headActions.appendChild(dupBtn);
    headActions.appendChild(delBtn);
    head.appendChild(headActions);
    main.appendChild(head);

    /* 行操作条 */
    var lineBar = ui.el('div', 'np-linebar');
    lineBar.appendChild(ui.el('span', 'np-linebar-label', '行操作'));

    var lineButtons = [];

    [
      { action: 'up', label: '上移行', title: '把当前行（或选中行）上移一行 (Alt+↑)' },
      { action: 'down', label: '下移行', title: '把当前行（或选中行）下移一行 (Alt+↓)' },
      { action: 'duplicate', label: '复制行', title: '在下方复制当前行（或选中行）(Ctrl+D)' },
      { action: 'delete', label: '删除行', title: '删除当前行（或选中行）(Ctrl+Shift+K)' },
      { action: 'comment', label: '注释', title: '注释 / 取消注释当前行或选中行 (Ctrl+/)' }
    ].forEach(function (item) {
      var button = ui.el('button', 'np-tool', item.label);
      button.type = 'button';
      button.title = item.title;
      button.addEventListener('click', function () { lineAction(item.action); });
      lineButtons.push(button);
      lineBar.appendChild(button);
    });

    var lineHint = ui.el('span', 'np-linebar-hint', '作用于当前行或选中行');
    lineBar.appendChild(lineHint);
    main.appendChild(lineBar);

    /* 编辑器 */
    var editor = ui.codeEditor({
      language: 'text',
      label: '便签内容',
      placeholder: '直接开始输入…内容会自动保存在本机浏览器',
      onInput: function (text) { onEditorInput(text); },
      onCursor: function (info) { updateCursor(info); }
    });
    main.appendChild(editor.root);

    /* 底部状态 */
    var foot = ui.el('div', 'np-foot');
    var footMeta = ui.el('div', 'np-foot-meta');

    var posLabel = ui.el('span', '', '行 1，列 1');
    var countLabel = ui.el('span', '', '0 字符');
    var lineLabel = ui.el('span', '', '1 行');
    var selLabel = ui.el('span', '', '未选中');

    footMeta.appendChild(posLabel);
    footMeta.appendChild(countLabel);
    footMeta.appendChild(lineLabel);
    footMeta.appendChild(selLabel);

    var saveLabel = ui.el('span', 'np-saved', '已保存');
    foot.appendChild(footMeta);
    foot.appendChild(saveLabel);
    main.appendChild(foot);

    np.appendChild(main);

    /* 侧栏 */
    var side = ui.el('div', 'np-side');

    var listCol = ui.el('div', 'np-side-col');
    var listHead = ui.colHead('便签列表', {
      badge: String(docs.length),
      actions: [
        ui.miniButton('', {
          icon: 'i-download',
          title: '导出全部便签为 JSON 备份',
          onClick: function () { exportAll(); }
        }),
        ui.miniButton('', {
          icon: 'i-upload',
          title: '从 JSON 备份导入便签（同名或同 id 会另存为副本）',
          onClick: function () { backupInput.click(); }
        }),
        ui.miniButton('', {
          icon: 'i-sparkles',
          title: '新建便签',
          onClick: function () { newDoc(); }
        })
      ]
    });
    listCol.appendChild(listHead);
    var listBadge = listHead.querySelector('.badge');

    /* 全库搜索 + 排序 */
    var sideTools = ui.el('div', 'np-side-tools');

    var globalSearch = ui.el('input', 'np-search-input');
    globalSearch.type = 'search';
    globalSearch.placeholder = '搜索全部便签…';
    globalSearch.setAttribute('aria-label', '在所有便签中搜索');
    globalSearch.autocomplete = 'off';
    globalSearch.spellcheck = false;

    var sortSelect = ui.el('select', 'np-sort');
    sortSelect.setAttribute('aria-label', '便签排序方式');
    [
      ['updated', '按更新时间'],
      ['name', '按名称'],
      ['length', '按长度']
    ].forEach(function (item) {
      var option = ui.el('option', '', item[1]);
      option.value = item[0];
      sortSelect.appendChild(option);
    });
    sortSelect.value = state.sort;

    sideTools.appendChild(globalSearch);
    sideTools.appendChild(sortSelect);
    listCol.appendChild(sideTools);

    var hitsMeta = ui.el('div', 'np-hits-meta');
    hitsMeta.hidden = true;
    listCol.appendChild(hitsMeta);

    var docList = ui.el('div', 'np-doc-list');
    listCol.appendChild(docList);

    var hitList = ui.el('div', 'np-hits');
    hitList.hidden = true;
    listCol.appendChild(hitList);

    side.appendChild(listCol);

    var statCol = ui.el('div', 'np-side-col');
    statCol.appendChild(ui.colHead('统计', { badge: null }));
    var statBody = ui.el('div', '');
    statBody.style.padding = '4px 0 2px';
    statCol.appendChild(statBody);

    function statRow(label) {
      var row = ui.el('div', 'np-stat');
      row.appendChild(ui.el('span', '', label));
      var value = ui.el('b', '', '0');
      row.appendChild(value);
      statBody.appendChild(row);
      return value;
    }

    var statCharsVal = statRow('字符');
    var statWordsVal = statRow('词');
    var statLinesVal = statRow('行');
    var statBytesVal = statRow('字节');
    var statSelVal = statRow('选中');
    var statReadVal = statRow('阅读时间');

    side.appendChild(statCol);

    np.appendChild(side);
    root.appendChild(np);

    /* ---------------- 撤销 / 重做 ---------------- */

    var history = null;
    var historyButtons = null;

    function initHistory() {
      if (window.TextHistory && window.TextHistory.attach) {
        history = window.TextHistory.attach(editor.input, {
          onChange: function () { onHistoryChange(); }
        });
      }

      if (ui.historyButtons) {
        historyButtons = ui.historyButtons(editor.input);
      }

      /* historyButtons 会覆盖 onChange，这里把两边都接上：
       * 按钮状态跟着历史栈走，统计与状态点跟着输入事件走。 */
      if (history) {
        history.onChange = function () { onHistoryChange(); };
      }

      if (historyButtons && historyButtons.node) {
        actions.insertBefore(historyButtons.node, actions.firstChild);
      }

      if (TB.setHistoryTarget) TB.setHistoryTarget('notes', editor.input);

      if (history) history.reset();
      syncHistoryButtons();
    }

    function onHistoryChange() {
      syncHistoryButtons();
      updateSelection();
    }

    function syncHistoryButtons() {
      if (historyButtons && historyButtons.sync) historyButtons.sync();
      /* 顶部主操作栏的撤销 / 重做也要跟着变灰 */
      if (TB.syncHistory) TB.syncHistory();
    }

    function resetHistory() {
      if (history && history.reset) history.reset();
      syncHistoryButtons();
    }

    /* ---------------- 查找 ---------------- */

    var finder = null;

    function ensureFinder() {
      if (finder) return finder;
      if (!window.Finder || !window.Finder.attach) return null;

      /* 用 TextTarget 包一层：锁定状态下替换会被挡下 */
      var targets = [editor.input];
      if (window.Finder.TextTarget) {
        var target = new window.Finder.TextTarget(editor.input, { highlight: true });
        var baseSet = target.setValue;
        target.setValue = function (value) {
          if (!requireUnlocked('替换')) return;
          baseSet.call(this, value);
        };
        targets = [target];
      }

      finder = window.Finder.attach(root, {
        label: '便签查找',
        scope: '',
        targets: targets,
        onClose: function () {}
      });

      /* 上 / 下一个匹配后把命中的行滚进视野：编辑器内部不滚动，交给外层容器 */
      if (finder && typeof finder.step === 'function') {
        var baseStep = finder.step;
        finder.step = function () {
          var result = baseStep.apply(this, arguments);
          if (this.matches && this.matches.length) revealOffset(editor.input.selectionStart);
          return result;
        };
      }

      /* 替换全部：数量大于 1 时先确认（Finder 自己会 toast 更换数） */
      if (finder && finder.bar) {
        finder.bar.addEventListener('click', function (event) {
          var node = event.target;
          var hit = node && node.closest ? node.closest('.app-find-replace-all') : null;
          if (!hit || hit.disabled) return;

          if (!requireUnlocked('替换')) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }

          var count = finder.matches ? finder.matches.length : 0;
          if (count <= 1) return;

          var message = '把「' + finder.query + '」全部替换为「' + finder.replacement + '」？共 ' + count + ' 处。';
          if (!window.confirm(message)) {
            event.preventDefault();
            event.stopPropagation();
            if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          }
        }, true);
      }

      syncFinderScope();
      return finder;
    }

    function syncFinderScope() {
      if (!finder || !finder.bar) return;
      var scope = finder.bar.querySelector('.app-find-scope');
      var doc = activeDoc();
      if (scope) scope.textContent = doc ? '当前便签：' + doc.name : '';
    }

    function openFinder(query, replace) {
      var instance = ensureFinder();
      if (!instance) return false;

      if (typeof query !== 'string' || !query) return instance.show(replace);

      instance.show(false);
      instance.query = query;

      var field = instance.bar ? instance.bar.querySelector('.app-find-input') : null;
      if (field) field.value = query;

      instance.execute(false);
      if (instance.refreshControls) instance.refreshControls();

      if (replace) {
        var replaceField = instance.bar ? instance.bar.querySelector('.app-find-replace') : null;
        if (replaceField) replaceField.focus();
      }

      return true;
    }

    /* ---------------- 数据 ---------------- */

    function activeDoc() {
      for (var i = 0; i < docs.length; i++) {
        if (docs[i].id === state.activeId) return docs[i];
      }
      return null;
    }

    function findDoc(id) {
      for (var i = 0; i < docs.length; i++) {
        if (docs[i].id === id) return docs[i];
      }
      return null;
    }

    function safeName(name) {
      return String(name || '便签').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
    }

    function snapshotDoc(doc) {
      return {
        id: doc.id,
        name: doc.name,
        content: doc.content || '',
        language: doc.language || 'text',
        updatedAt: doc.updatedAt || Date.now(),
        locked: !!doc.locked
      };
    }

    function persist() {
      ui.storageSet(STORE_KEY, {
        docs: docs.map(snapshotDoc),
        activeId: state.activeId,
        wrap: state.wrap,
        lineNumbers: state.lineNumbers,
        sort: state.sort
      });
    }

    var persistLater = ui.debounce(function () {
      persist();
      setSavedLabel('已保存 ' + timeLabel(Date.now()).slice(-5));
    }, 600);

    function setSavedLabel(text) {
      if (!saveLabel) return;
      saveLabel.textContent = text;
      saveLabel.classList.remove('is-dirty');
      if (headDot) {
        headDot.classList.remove('is-dirty');
        headDot.title = '已保存到本机';
      }
    }

    function setDirtyLabel() {
      if (!saveLabel) return;
      saveLabel.textContent = '未保存';
      saveLabel.classList.add('is-dirty');
      if (headDot) {
        headDot.classList.add('is-dirty');
        headDot.title = '有改动尚未保存（Ctrl+S 立即保存）';
      }
    }

    function touch() {
      var doc = activeDoc();
      if (doc) doc.updatedAt = Date.now();
      state.dirty = true;
      setDirtyLabel();
      persistLater();

      /* 全库搜索开着时，内容变化后结果也要跟着更新 */
      if (state.query) refreshSearchLater();
    }

    function persistNow() {
      flush();
      persist();
      setSavedLabel('已保存 ' + timeLabel(Date.now()).slice(-5));
    }

    /* ---------------- 渲染 ---------------- */

    function renderTabs() {
      tabs.textContent = '';

      docs.forEach(function (doc) {
        var tab = ui.el('button', 'np-tab');
        tab.type = 'button';
        tab.title = doc.name + ' · ' + timeLabel(doc.updatedAt) + (doc.locked ? ' · 已锁定' : '');

        if (doc.id === state.activeId) {
          tab.classList.add('is-active');
          tab.setAttribute('aria-current', 'true');
        }

        tab.appendChild(ui.el('span', 'np-tab-label', doc.name));

        if (doc.locked) tab.appendChild(ui.icon('i-lock', 'np-tab-lock'));

        var close = ui.el('button', 'np-tab-x', '×');
        close.type = 'button';
        close.title = '关闭便签';
        close.addEventListener('click', function (event) {
          event.stopPropagation();
          removeDoc(doc.id);
        });
        tab.appendChild(close);

        tab.addEventListener('click', function () { switchTo(doc.id); });
        tab.addEventListener('dblclick', function () { renameActive(); });

        /* 标签内部的关闭按钮不能再被拖进 tab 点击 */
        close.addEventListener('dblclick', function (event) {
          event.stopPropagation();
        });

        tabs.appendChild(tab);
      });

      /* 活跃标签滚进视野 */
      var active = tabs.querySelector('.np-tab.is-active');
      if (active && active.scrollIntoView) {
        active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }

    function sortedDocs() {
      var list = docs.slice();

      if (state.sort === 'name') {
        list.sort(function (a, b) {
          return String(a.name).localeCompare(String(b.name), 'zh-Hans-CN');
        });
      } else if (state.sort === 'length') {
        list.sort(function (a, b) {
          return (b.content ? b.content.length : 0) - (a.content ? a.content.length : 0);
        });
      } else {
        list.sort(function (a, b) {
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
      }

      return list;
    }

    function renderList() {
      docList.textContent = '';

      sortedDocs().forEach(function (doc) {
        var item = ui.el('button', 'np-doc');
        item.type = 'button';
        item.title = doc.name + ' · ' + timeLabel(doc.updatedAt) + (doc.locked ? ' · 已锁定' : '');

        if (doc.id === state.activeId) item.classList.add('is-active');

        item.appendChild(ui.el('span', 'np-doc-name', doc.name));

        if (doc.locked) item.appendChild(ui.icon('i-lock', 'np-doc-lock'));

        item.appendChild(ui.el('span', 'np-doc-size', (doc.content ? doc.content.length : 0) + ''));

        item.addEventListener('click', function () { switchTo(doc.id); });
        docList.appendChild(item);
      });

      if (listBadge) listBadge.textContent = String(docs.length);
    }

    function updateCursor(info) {
      /* editor 创建时就会回调一次，此时底部标签还没建好 */
      if (!posLabel) return;
      var cursor = info || editor.cursor();
      posLabel.textContent = '行 ' + cursor.line + '，列 ' + cursor.column;
    }

    function updateSelection() {
      if (!statSelVal) return;

      var input = editor.input;
      var selected = Math.max(0, (input.selectionEnd || 0) - (input.selectionStart || 0));

      statSelVal.textContent = String(selected);
      if (selLabel) selLabel.textContent = selected ? '选中 ' + selected + ' 字符' : '未选中';
    }

    function updateStats(text) {
      var value = String(text === null || text === undefined ? '' : text);
      var lines = value ? value.split('\n').length : 1;
      var words = value.split(/\s+/).filter(function (item) { return item.length > 0; }).length;

      countLabel.textContent = value.length + ' 字符';
      lineLabel.textContent = lines + ' 行';

      statCharsVal.textContent = String(value.length);
      statWordsVal.textContent = String(words);
      statLinesVal.textContent = String(lines);
      statBytesVal.textContent = String(window.Bytes ? window.Bytes.utf8Encode(value).length : value.length);
      statReadVal.textContent = readTimeLabel(value.length);

      updateSelection();
    }

    function applyLanguage(language) {
      langSelect.value = language;
      editor.setLanguage(language);
      var doc = activeDoc();
      if (doc) doc.language = language;
      touch();
    }

    function applyLanguageSilent(language) {
      langSelect.value = language;
      editor.setLanguage(language);
    }

    function onEditorInput(text) {
      var doc = activeDoc();
      if (doc) doc.content = text;
      updateStats(text);
      updateCursor();
      renderTabs();
      renderList();
      touch();
    }

    /* ---------------- 锁定 ---------------- */

    function requireUnlocked(action) {
      var doc = activeDoc();
      if (doc && doc.locked) {
        ui.toast('便签「' + doc.name + '」已锁定，先点锁图标解锁再' + (action || '修改'));
        return false;
      }
      return true;
    }

    function isLocked() {
      var doc = activeDoc();
      return !!(doc && doc.locked);
    }

    function applyLockUi() {
      var locked = isLocked();

      editor.input.readOnly = locked;

      if (lockBtn) {
        lockBtn.classList.toggle('is-on', locked);
        lockBtn.setAttribute('aria-pressed', locked ? 'true' : 'false');
        lockBtn.title = locked ? '已锁定，点击解锁' : '锁定当前便签（只读防误改）';
      }

      if (lockBadge) lockBadge.hidden = !locked;

      np.classList.toggle('np-locked', locked);

      lineButtons.forEach(function (button) { button.disabled = locked; });
      pasteBtn.disabled = locked;
      clearBtn.disabled = locked;
      if (lineHint) lineHint.textContent = locked ? '已锁定，行操作用不了' : '作用于当前行或选中行';
    }

    function toggleLock() {
      var doc = activeDoc();
      if (!doc) return;

      doc.locked = !doc.locked;
      applyLockUi();
      renderTabs();
      renderList();
      persist();

      ui.toast(doc.locked ? '已锁定「' + doc.name + '」，内容只读' : '已解锁，可以继续编辑');
    }

    /* ---------------- 光标 / 选区 ---------------- */

    function lineHeightOf(input) {
      var height = parseFloat(getComputedStyle(input).lineHeight);
      return isNaN(height) || !height ? 20 : height;
    }

    function paddingTopOf(input) {
      var top = parseFloat(getComputedStyle(input).paddingTop);
      return isNaN(top) ? 0 : top;
    }

    /* 把某个偏移所在的行滚进外层容器视野 */
    function revealOffset(offset) {
      var scroller = editor.scroll;
      var input = editor.input;
      if (!scroller || !input) return;

      var value = input.value;
      var at = Math.max(0, Math.min(offset || 0, value.length));
      var lineHeight = lineHeightOf(input);
      var top = paddingTopOf(input) + lineIndexOf(value, at) * lineHeight;
      var height = scroller.clientHeight;

      if (!height) return;

      if (top - lineHeight < scroller.scrollTop) {
        scroller.scrollTop = Math.max(0, top - lineHeight * 2);
      } else if (top + lineHeight * 3 > scroller.scrollTop + height) {
        scroller.scrollTop = Math.max(0, top - height + lineHeight * 4);
      }
    }

    function selectRange(start, end) {
      var input = editor.input;
      var length = input.value.length;
      var from = Math.max(0, Math.min(start === undefined ? 0 : start, length));
      var to = Math.max(from, Math.min(end === undefined ? from : end, length));

      input.focus();

      try {
        input.setSelectionRange(from, to);
      } catch (err) {
        /* 某些输入类型不支持 setSelectionRange */
      }

      revealOffset(from);
      updateCursor();
      updateSelection();

      /* 让 CodeView 重画当前行高亮 */
      input.dispatchEvent(new Event('select', { bubbles: true }));
    }

    function selectLine(index) {
      var value = editor.input.value;
      selectRange(lineStartOf(value, index), lineEndOf(value, index));
    }

    /* ---------------- 程序化编辑 ---------------- */

    function applyEdit(next, selectionStart, selectionEnd) {
      var input = editor.input;

      if (history && !history.applying && history.record) history.record();

      input.value = next;

      try {
        input.setSelectionRange(selectionStart, selectionEnd);
      } catch (err) {
        /* 忽略 */
      }

      /* 复用 CodeView 的 input 流程：重画着色层、更新行号、回写文档 */
      input.dispatchEvent(new Event('input', { bubbles: true }));

      revealOffset(selectionStart);
      updateSelection();
    }

    /* ---------------- 行操作 ---------------- */

    function lineAction(action) {
      var doc = activeDoc();
      if (!doc) return;
      if (!requireUnlocked('做行操作')) return;

      var input = editor.input;
      var value = input.value;
      var range = lineRangeOf(value, input.selectionStart, input.selectionEnd);
      var block = value.slice(range.from, range.to);
      var caret = input.selectionStart;
      var result = null;

      if (action === 'up') {
        if (range.from === 0) {
          ui.toast('已经是第一行');
          return;
        }

        var prevFrom = value.lastIndexOf('\n', range.from - 2) + 1;
        var prevLine = value.slice(prevFrom, range.from - 1);
        var text = value.slice(0, prevFrom) + block + '\n' + prevLine + value.slice(range.to);

        result = { text: text, start: prevFrom, end: prevFrom + block.length };
      } else if (action === 'down') {
        if (range.to >= value.length) {
          ui.toast('已经是最后一行');
          return;
        }

        var nextFrom = range.to + 1;
        var nextTo = value.indexOf('\n', nextFrom);
        if (nextTo < 0) nextTo = value.length;

        var nextLine = value.slice(nextFrom, nextTo);
        var moved = value.slice(0, range.from) + nextLine + '\n' + block + value.slice(nextTo);
        var start = range.from + nextLine.length + 1;

        result = { text: moved, start: start, end: start + block.length };
      } else if (action === 'duplicate') {
        var copy = value.slice(0, range.to) + '\n' + block + value.slice(range.to);
        result = { text: copy, start: range.to + 1, end: range.to + 1 + block.length };
      } else if (action === 'delete') {
        var deleted;

        if (range.to < value.length) deleted = value.slice(0, range.from) + value.slice(range.to + 1);
        else if (range.from > 0) deleted = value.slice(0, range.from - 1);
        else deleted = '';

        result = { text: deleted, start: Math.min(range.from, deleted.length), end: Math.min(range.from, deleted.length) };
      } else if (action === 'comment') {
        result = toggleComment(value, range, caret, doc.language);
      }

      if (!result) return;

      applyEdit(result.text, result.start, result.end);

      if (action === 'comment') {
        ui.toast(result.message);
      }
    }

    function toggleComment(value, range, caret, language) {
      var style = commentStyleOf(language);
      var block = value.slice(range.from, range.to);
      var lines = block.split('\n');

      var allCommented = lines.every(function (line) {
        if (!line.trim()) return true;

        var indent = leadingSpaceLength(line);
        var body = line.slice(indent);

        if (style.close) {
          return body.length >= style.open.length + style.close.length &&
            body.indexOf(style.open) === 0 &&
            body.lastIndexOf(style.close) === body.length - style.close.length;
        }

        return body.indexOf(style.open) === 0;
      });

      var nextLines = lines.map(function (line) {
        if (!line.trim()) return line;

        var indent = leadingSpaceLength(line);
        var body = line.slice(indent);

        if (allCommented) {
          if (style.close) {
            var inner = body.slice(style.open.length, body.length - style.close.length);
            inner = inner.replace(/^ /, '').replace(/ $/, '');
            return line.slice(0, indent) + inner;
          }

          var rest = body.slice(style.open.length);
          if (rest.charAt(0) === ' ') rest = rest.slice(1);
          return line.slice(0, indent) + rest;
        }

        if (style.close) return line.slice(0, indent) + style.open + ' ' + body + ' ' + style.close;
        return line.slice(0, indent) + style.open + ' ' + body;
      });

      var nextBlock = nextLines.join('\n');
      var text = value.slice(0, range.from) + nextBlock + value.slice(range.to);

      var start = range.from;
      var end = range.from + nextBlock.length;

      /* 光标模式：尽量保持原来的列位置 */
      if (caret === range.from && lines.length === 1) {
        var delta = nextLines[0].length - lines[0].length;
        var moved = Math.max(range.from, Math.min(caret + delta, end));
        start = moved;
        end = moved;
      }

      return {
        text: text,
        start: start,
        end: end,
        message: allCommented ? '已取消注释' : '已注释'
      };
    }

    /* ---------------- 全库搜索 ---------------- */

    function lineTextAt(content, at) {
      var start = content.lastIndexOf('\n', at - 1) + 1;
      var end = content.indexOf('\n', at);
      if (end < 0) end = content.length;
      return { text: content.slice(start, end), offset: at - start };
    }

    function makeMarker(text, at, length) {
      var max = 88;
      var start = 0;
      var end = text.length;

      if (text.length > max) {
        start = Math.max(0, Math.min(at - 28, text.length - max));
        end = Math.min(text.length, start + max);
      }

      var piece = text.slice(start, end);
      var lead = leadingSpaceLength(piece);
      piece = piece.slice(lead);

      var from = Math.max(0, at - start - lead);
      var size = Math.max(0, Math.min(length, piece.length - from));

      return {
        prefix: start > 0 ? '…' : '',
        text: piece,
        suffix: end < text.length ? '…' : '',
        from: from,
        length: size
      };
    }

    function searchAll(rawQuery) {
      var query = String(rawQuery === null || rawQuery === undefined ? '' : rawQuery).trim();
      state.query = query;

      if (!query) {
        state.hits = [];
        state.hitTotal = 0;
        hitList.textContent = '';
        hitList.hidden = true;
        hitsMeta.hidden = true;
        hitsMeta.textContent = '';
        docList.hidden = false;
        return;
      }

      var lower = query.toLowerCase();
      var hits = [];
      var total = 0;

      docs.forEach(function (doc) {
        var count = 0;
        var name = String(doc.name || '');
        var nameAt = name.toLowerCase().indexOf(lower);

        if (nameAt >= 0) {
          total++;
          if (hits.length < HIT_LIMIT && count < HITS_PER_DOC) {
            count++;
            hits.push({
              docId: doc.id,
              kind: 'name',
              line: 1,
              offset: 0,
              end: 0,
              marker: makeMarker(name, nameAt, lower.length)
            });
          }
        }

        var content = String(doc.content || '');
        if (!content) return;

        var haystack = content.toLowerCase();
        var from = 0;
        var scanned = 0;

        while (scanned < SCAN_PER_DOC) {
          var at = haystack.indexOf(lower, from);
          if (at < 0) break;

          scanned++;
          total++;

          if (hits.length < HIT_LIMIT && count < HITS_PER_DOC) {
            count++;
            var info = lineTextAt(content, at);
            hits.push({
              docId: doc.id,
              kind: 'content',
              line: lineIndexOf(content, at) + 1,
              offset: at,
              end: at + lower.length,
              marker: makeMarker(info.text, info.offset, lower.length)
            });
          }

          from = at + Math.max(1, lower.length);
        }
      });

      state.hits = hits;
      state.hitTotal = total;
      renderHits();
    }

    var refreshSearchLater = ui.debounce(function () {
      if (state.query) searchAll(state.query);
    }, 300);

    function renderHits() {
      hitList.textContent = '';

      if (!state.query) {
        hitList.hidden = true;
        hitsMeta.hidden = true;
        docList.hidden = false;
        return;
      }

      hitList.hidden = false;
      docList.hidden = true;
      hitsMeta.hidden = false;

      if (!state.hits.length) {
        hitsMeta.textContent = '没有匹配';
        hitList.appendChild(ui.el('div', 'np-hits-empty', '没有便签包含「' + state.query + '」'));
        return;
      }

      var hidden = state.hitTotal - state.hits.length;
      hitsMeta.textContent = state.hits.length + ' / ' + state.hitTotal + ' 条结果' + (hidden > 0 ? '（还有 ' + hidden + ' 条）' : '');

      state.hits.forEach(function (hit) {
        var doc = findDoc(hit.docId);
        var row = ui.el('button', 'np-hit');
        row.type = 'button';
        row.title = (doc ? doc.name : '便签') + ' · ' + (hit.kind === 'name' ? '名称匹配' : '第 ' + hit.line + ' 行');

        var head = ui.el('span', 'np-hit-head');
        head.appendChild(ui.el('span', 'np-hit-name', doc ? doc.name : '已删除'));
        head.appendChild(ui.el('span', 'np-hit-line', hit.kind === 'name' ? '名称匹配' : '第 ' + hit.line + ' 行'));
        row.appendChild(head);

        var snippet = ui.el('span', 'np-hit-snippet');
        var marker = hit.marker;

        if (marker) {
          if (marker.prefix) snippet.appendChild(document.createTextNode(marker.prefix));
          if (marker.from > 0) snippet.appendChild(document.createTextNode(marker.text.slice(0, marker.from)));

          var mark = ui.el('mark', '', marker.text.substr(marker.from, marker.length));
          snippet.appendChild(mark);

          if (marker.from + marker.length < marker.text.length) {
            snippet.appendChild(document.createTextNode(marker.text.slice(marker.from + marker.length)));
          }
          if (marker.suffix) snippet.appendChild(document.createTextNode(marker.suffix));
        }

        row.appendChild(snippet);
        row.addEventListener('click', function () { openHit(hit); });
        hitList.appendChild(row);
      });

      if (hidden > 0) {
        hitList.appendChild(ui.el('div', 'np-hit-more', '还有 ' + hidden + ' 条未显示，换个更具体的关键字试试'));
      }
    }

    function openHit(hit) {
      if (!hit) return;

      if (hit.docId !== state.activeId) switchTo(hit.docId);

      var doc = activeDoc();
      if (!doc) return;

      var start = hit.kind === 'name' ? 0 : hit.offset;
      var end = hit.kind === 'name' ? 0 : hit.end;

      selectRange(start, end);
      openFinder(state.query, false);
    }

    /* ---------------- 切换 / 增删 ---------------- */

    function switchTo(id) {
      if (id === state.activeId) return;

      flush();
      var doc = null;
      for (var i = 0; i < docs.length; i++) {
        if (docs[i].id === id) doc = docs[i];
      }
      if (!doc) return;

      state.activeId = id;
      editor.setValue(doc.content, true);
      /* 每个便签独立的历史：切过去之后不回退到上一个便签的内容 */
      resetHistory();
      applyLanguageSilent(doc.language);
      updateStats(doc.content);
      updateCursor();
      updateSelection();
      applyLockUi();
      renderTabs();
      renderList();
      persist();
      setSavedLabel('已保存');

      if (finder && finder.open) {
        syncFinderScope();
        finder.execute(false);
      }
    }

    /* 便签切换前确保编辑器的即时内容写回文档 */
    function flush() {
      var doc = activeDoc();
      if (doc) {
        doc.content = editor.getValue();
        doc.updatedAt = Date.now();
      }
    }

    function newDoc(name, content, language) {
      flush();

      if (docs.length >= MAX_DOCS) {
        ui.toast('最多 ' + MAX_DOCS + ' 个便签，请先删除一些');
        return null;
      }

      var doc = defaultDoc(
        name || ('便签 ' + (docs.length + 1)),
        content === undefined ? '' : content,
        language || 'text'
      );

      docs.unshift(doc);
      state.activeId = doc.id;
      editor.setValue(doc.content, true);
      resetHistory();
      applyLanguageSilent(doc.language);
      updateStats(doc.content);
      updateCursor();
      updateSelection();
      applyLockUi();
      renderTabs();
      renderList();
      persist();
      setSavedLabel('已保存');
      editor.focus();

      if (finder && finder.open) {
        syncFinderScope();
        finder.execute(false);
      }

      return doc;
    }

    function duplicateActive() {
      var doc = activeDoc();
      if (!doc) return;
      newDoc(uniqueName(doc.name + ' 副本'), doc.content, doc.language);
      ui.toast('已复制便签');
    }

    function uniqueName(base) {
      var taken = {};
      docs.forEach(function (doc) { taken[String(doc.name).toLowerCase()] = true; });

      var name = base;
      var index = 2;
      while (taken[name.toLowerCase()]) {
        name = base + ' ' + index;
        index++;
      }
      return name;
    }

    function renameActive() {
      var doc = activeDoc();
      if (!doc) return;

      var next = window.prompt('便签名称', doc.name);
      if (next === null) return;

      var name = String(next).trim();
      if (!name) return;

      doc.name = name.slice(0, 60);
      doc.updatedAt = Date.now();
      renderTabs();
      renderList();
      syncFinderScope();
      persist();
    }

    function removeDoc(id) {
      var index = -1;
      for (var i = 0; i < docs.length; i++) {
        if (docs[i].id === id) index = i;
      }
      if (index < 0) return;

      var doc = docs[index];
      var isEmpty = !doc.content || !doc.content.trim();

      if (!isEmpty && !window.confirm('删除便签「' + doc.name + '」？此操作不可撤销。')) return;

      docs.splice(index, 1);

      if (!docs.length) {
        docs.push(defaultDoc('便签 1', '', 'text'));
      }

      if (state.activeId === id) {
        var next = docs[Math.max(0, index - 1)] || docs[0];
        state.activeId = next.id;
        editor.setValue(next.content, true);
        resetHistory();
        applyLanguageSilent(next.language);
        updateStats(next.content);
        updateCursor();
        updateSelection();
        applyLockUi();
      }

      renderTabs();
      renderList();
      persist();
      setSavedLabel('已保存');
      ui.toast('已删除便签');

      if (state.query) searchAll(state.query);
    }

    function deleteActive() {
      removeDoc(state.activeId);
    }

    /* ---------------- 导入 / 导出 ---------------- */

    function exportActive() {
      var doc = activeDoc();
      if (!doc) return;

      flush();
      var extension = extensionOf(doc.language);
      var ok = ui.downloadText(safeName(doc.name) + '.' + extension, doc.content, mimeOf(extension));
      ui.toast(ok ? '已导出 .' + extension : '导出失败');
    }

    function exportAll() {
      flush();

      var payload = {
        docs: docs.map(snapshotDoc),
        exportedAt: new Date().toISOString(),
        app: 'dataUtils.notes',
        version: 1
      };

      var ok = ui.downloadText(
        '便签备份-' + stampLabel(new Date()) + '.json',
        JSON.stringify(payload, null, 2),
        'application/json;charset=utf-8'
      );

      ui.toast(ok ? '已导出 ' + docs.length + ' 个便签' : '导出失败');
    }

    /**
     * 识别便签备份：`{docs:[...], exportedAt}`、裸数组，或者单条便签对象。
     * @param {string} text 待解析的文本
     * @param {boolean} strict 只认带 docs 数组的整份备份
     * @returns {Array|null} 待合并的便签数组
     */
    function parseBackup(text, strict) {
      if (typeof text !== 'string' || !text.trim()) return null;

      var payload;
      try {
        payload = JSON.parse(text);
      } catch (err) {
        return null;
      }

      if (!payload || typeof payload !== 'object') return null;

      if (Object.prototype.toString.call(payload) === '[object Array]') {
        return strict ? null : payload;
      }

      if (Object.prototype.toString.call(payload.docs) === '[object Array]') {
        return payload.docs;
      }

      /* strict 模式下不接受单条便签 */
      return strict ? null : [payload];
    }

    function normalizeIncoming(item) {
      if (!item || typeof item !== 'object') return null;

      var name = typeof item.name === 'string' ? item.name.trim() : '';
      var content = item.content === null || item.content === undefined ? '' : String(item.content);

      if (!name && !content) return null;

      var language = 'text';
      if (typeof item.language === 'string') {
        for (var i = 0; i < Syntax.LANGUAGES.length; i++) {
          if (Syntax.LANGUAGES[i].id === item.language) {
            language = item.language;
            break;
          }
        }
      }

      return {
        id: typeof item.id === 'string' && item.id ? item.id : '',
        name: (name || '未命名').slice(0, 60),
        content: content,
        language: language,
        updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
        locked: !!item.locked
      };
    }

    function importDocs(list, sourceLabel) {
      var incoming = [];
      (list || []).forEach(function (item) {
        var doc = normalizeIncoming(item);
        if (doc) incoming.push(doc);
      });

      if (!incoming.length) {
        ui.toast('备份里没有可导入的便签');
        return;
      }

      var idSet = {};
      var nameSet = {};
      docs.forEach(function (doc) {
        idSet[doc.id] = true;
        nameSet[String(doc.name).toLowerCase()] = true;
      });

      var duplicates = 0;
      incoming.forEach(function (doc) {
        if ((doc.id && idSet[doc.id]) || nameSet[String(doc.name).toLowerCase()]) duplicates++;
      });

      var message = '导入 ' + incoming.length + ' 个便签' + (sourceLabel ? '（' + sourceLabel + '）' : '') + '？';
      if (duplicates) message += '\n其中 ' + duplicates + ' 个与现有便签同 id 或同名，将另存为副本。';
      message += '\n当前共 ' + docs.length + ' 个便签。';

      if (!window.confirm(message)) return;

      var room = MAX_DOCS - docs.length;
      var accepted = incoming.length > room ? incoming.slice(0, Math.max(0, room)) : incoming;

      if (!accepted.length) {
        ui.toast('最多 ' + MAX_DOCS + ' 个便签，请先删除一些');
        return;
      }

      var copies = 0;

      var added = accepted.map(function (doc) {
        var conflict = (doc.id && idSet[doc.id]) || nameSet[String(doc.name).toLowerCase()];
        var next = {
          id: (conflict || !doc.id) ? uid() : doc.id,
          name: conflict ? uniqueName(doc.name + ' 副本') : doc.name,
          content: doc.content,
          language: doc.language,
          updatedAt: doc.updatedAt || Date.now(),
          locked: doc.locked
        };

        if (conflict) copies++;

        idSet[next.id] = true;
        nameSet[String(next.name).toLowerCase()] = true;
        return next;
      });

      Array.prototype.unshift.apply(docs, added);

      state.activeId = added[0].id;
      editor.setValue(added[0].content, true);
      resetHistory();
      applyLanguageSilent(added[0].language);
      updateStats(added[0].content);
      updateCursor();
      updateSelection();
      applyLockUi();
      renderTabs();
      renderList();
      persist();
      setSavedLabel('已保存');

      if (state.query) searchAll(state.query);

      var skipped = incoming.length - accepted.length;
      ui.toast('已导入 ' + accepted.length + ' 个便签' +
        (copies ? '，' + copies + ' 个为副本' : '') +
        (skipped ? '，' + skipped + ' 个超出上限未导入' : ''));
    }

    /* ---------------- 事件 ---------------- */

    initHistory();

    if (editor.gutter) {
      editor.gutter.addEventListener('click', function (event) {
        var node = event.target;
        if (!node || node.parentNode !== editor.gutter) return;

        var index = -1;
        for (var i = 0; i < editor.gutter.children.length; i++) {
          if (editor.gutter.children[i] === node) {
            index = i;
            break;
          }
        }

        if (index < 0) return;
        selectLine(index);
      });
    }

    ['select', 'keyup', 'mouseup', 'click'].forEach(function (type) {
      editor.input.addEventListener(type, function () {
        updateSelection();
      });
    });

    /* Finder 用 setSelectionRange 选中命中后，编辑器自己不会滚动，这里补一次 */
    editor.input.addEventListener('select', function () {
      revealOffset(editor.input.selectionStart);
    });

    editor.input.addEventListener('keydown', function (event) {
      if (event.isComposing) return;

      var mod = event.ctrlKey || event.metaKey;
      var key = String(event.key || '').toLowerCase();

      if (event.altKey && !mod && (key === 'arrowup' || key === 'arrowdown')) {
        event.preventDefault();
        lineAction(key === 'arrowup' ? 'up' : 'down');
        return;
      }

      if (mod && !event.altKey && key === '/') {
        event.preventDefault();
        lineAction('comment');
        return;
      }

      if (mod && !event.shiftKey && key === 'd') {
        event.preventDefault();
        lineAction('duplicate');
        return;
      }

      if (mod && event.shiftKey && key === 'k') {
        event.preventDefault();
        lineAction('delete');
      }
    });

    langSelect.addEventListener('change', function () {
      if (!requireUnlocked('切换语法')) {
        langSelect.value = (activeDoc() || {}).language || 'text';
        return;
      }
      applyLanguage(langSelect.value);
    });

    wrapBox.input.addEventListener('change', function () {
      state.wrap = wrapBox.input.checked;
      editor.setWrap(state.wrap);
      persist();
    });

    lineBox.input.addEventListener('change', function () {
      state.lineNumbers = lineBox.input.checked;
      editor.setLineNumbers(state.lineNumbers);
      persist();
    });

    sortSelect.addEventListener('change', function () {
      state.sort = SORTS.indexOf(sortSelect.value) >= 0 ? sortSelect.value : 'updated';
      persist();
      renderList();
    });

    globalSearch.addEventListener('input', ui.debounce(function () {
      searchAll(globalSearch.value);
    }, 200));

    globalSearch.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (state.hits.length) openHit(state.hits[0]);
      } else if (event.key === 'Escape') {
        globalSearch.value = '';
        searchAll('');
        editor.focus();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (!TB.isActive('notes')) return;
      if (!(event.ctrlKey || event.metaKey)) return;

      if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        persistNow();
        ui.toast('已保存到本机');
        return;
      }

      if (event.shiftKey && (event.key === 'n' || event.key === 'N')) {
        event.preventDefault();
        newDoc();
        return;
      }

      if (event.shiftKey && (event.key === 'f' || event.key === 'F')) {
        event.preventDefault();
        globalSearch.focus();
        globalSearch.select();
      }
    });

    window.addEventListener('beforeunload', function () {
      flush();
      persist();
    });

    /* ---------------- 首屏 ---------------- */

    var initial = activeDoc() || docs[0];
    editor.setValue(initial.content, true);
    applyLanguageSilent(initial.language);
    editor.setWrap(state.wrap);
    editor.setLineNumbers(state.lineNumbers);
    wrapBox.input.checked = state.wrap;
    lineBox.input.checked = state.lineNumbers;
    updateStats(initial.content);
    updateCursor();
    updateSelection();
    applyLockUi();
    renderTabs();
    renderList();
    resetHistory();
    persist();
    setSavedLabel('已保存');

    return {
      root: root,
      find: function (options) {
        var instance = ensureFinder();
        if (!instance) return false;
        return instance.show(options && options.replace);
      },
      flush: flush,
      destroy: function () {
        flush();
        persist();
        if (historyButtons && historyButtons.node && historyButtons.node.__stopSync) {
          historyButtons.node.__stopSync();
        }
        if (TB.setHistoryTarget) TB.setHistoryTarget('notes', null);
      }
    };
  }

  var instance = null;

  TB.register({
    id: 'notes',
    group: '文本',
    title: '便签',
    desc: '多文档便签：行号与语法着色、查找高亮、撤销重做、全库搜索、行操作与锁定，内容只存本机',
    icon: 'i-file',
    keywords: ['notes', 'notepad', '便签', '记事本', '草稿', 'scratch', '行号', '查找', '撤销'],
    shortcuts: [
      { keys: ['Ctrl', 'F'], label: '查找高亮' },
      { keys: ['Ctrl', 'H'], label: '替换' },
      { keys: ['Ctrl', 'S'], label: '保存' },
      { keys: ['Ctrl', 'Z'], label: '撤销' },
      { keys: ['Ctrl', 'Shift', 'N'], label: '新建便签' },
      { keys: ['Alt', '↑/↓'], label: '移动行' },
      { keys: ['Ctrl', '/'], label: '注释行' }
    ],
    find: function (options) {
      if (instance) return instance.find(options);
      return false;
    },
    mount: function (host) {
      instance = createInstance();
      host.appendChild(instance.root);
    },
    hide: function () {
      if (instance && instance.flush) instance.flush();
    },
    destroy: function () {
      if (instance && instance.destroy) instance.destroy();
    }
  });
})();
