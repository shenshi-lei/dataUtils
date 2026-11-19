/* =========================================================
 * JSON 格式化 — 页面交互
 * ========================================================= */
(function () {
  'use strict';

  var TOOLS = window.JSONTools;
  var STORE_PREFIX = 'jsonfmt:';
  var TREE_LIMIT = 8000;
  var MAX_HIGHLIGHT = 1500000;
  var MAX_FIND_MATCHES = 3000;
  var MAX_FIND_HIGHLIGHT_TEXT = 1500000;
  var MAX_FOLD_LINES = 5000;
  /* 超过这个行数只做「按行着色」，不再逐 token 上色：span 数量是卡顿的主因 */
  var MAX_RICH_LINES = 4000;
  /* 超大文档先渲染这么多行，其余滚动到底或跳转时再续渲染 */
  var MAX_RENDER_LINES = 8000;
  var RENDER_CHUNK = 8000;

  var $ = function (id) {
    return document.getElementById(id);
  };

  var SAMPLE = JSON.stringify(
    {
      project: 'jsonana',
      title: 'JSON 格式化工具',
      version: '1.0.0',
      description: '纯前端实现，数据不会离开浏览器。',
      features: ['格式化与压缩', '语法校验', '树形浏览', '键名排序', '转义工具'],
      author: {
        name: 'DSH',
        email: 'hello@example.com',
        homepage: 'https://example.com'
      },
      settings: {
        indent: 2,
        theme: 'auto',
        preserveNumbers: true,
        maxDepth: 1000
      },
      releasedAt: '2026-11-19T08:00:00+08:00',
      stable: true,
      downloads: 12800,
      rating: 4.9,
      tags: null
    },
    null,
    2
  );

  var els = {
    input: $('input'),
    inputMeta: $('inputMeta'),
    inputGutter: $('inputGutter'),
    cursorPos: $('cursorPos'),
    dropZone: $('dropZone'),
    fileInput: $('fileInput'),
    findToggle: $('findToggle'),
    findBar: $('findBar'),
    findInput: $('findInput'),
    findCount: $('findCount'),
    findPrev: $('findPrev'),
    findNext: $('findNext'),
    findCase: $('findCase'),
    findRegex: $('findRegex'),
    findClose: $('findClose'),
    findLayer: $('findLayer'),
    findLayerInner: $('findLayerInner'),
    replaceInput: $('replaceInput'),
    replaceBtn: $('replaceBtn'),
    replaceAllBtn: $('replaceAllBtn'),
    findToggleRight: $('findToggleRight'),
    findBarRight: $('findBarRight'),
    findInputRight: $('findInputRight'),
    findCountRight: $('findCountRight'),
    findPrevRight: $('findPrevRight'),
    findNextRight: $('findNextRight'),
    findCaseRight: $('findCaseRight'),
    findRegexRight: $('findRegexRight'),
    findCloseRight: $('findCloseRight'),
    replaceInputRight: $('replaceInputRight'),
    replaceBtnRight: $('replaceBtnRight'),
    replaceAllBtnRight: $('replaceAllBtnRight'),
    outputFindLayer: $('outputFindLayer'),
    outputFindLayerInner: $('outputFindLayerInner'),
    outputContent: $('outputContent'),
    undoBtn: $('undoBtn'),
    formatBtn: $('formatBtn'),
    minifyBtn: $('minifyBtn'),
    validateBtn: $('validateBtn'),
    escapeBtn: $('escapeBtn'),
    unescapeBtn: $('unescapeBtn'),
    sampleBtn: $('sampleBtn'),
    uploadBtn: $('uploadBtn'),
    pasteBtn: $('pasteBtn'),
    clearBtn: $('clearBtn'),
    indentSelect: $('indentSelect'),
    sortKeys: $('sortKeys'),
    autoFormat: $('autoFormat'),
    themeToggle: $('themeToggle'),
    outputBody: $('outputBody'),
    outputScroll: $('outputScroll'),
    output: $('output'),
    outputGutterWrap: $('outputGutterWrap'),
    outputGutter: $('outputGutter'),
    treeView: $('treeView'),
    renderMore: $('renderMore'),
    renderMoreText: $('renderMoreText'),
    renderMoreBtn: $('renderMoreBtn'),
    emptyState: $('emptyState'),
    errorState: $('errorState'),
    errorMessage: $('errorMessage'),
    errorLoc: $('errorLoc'),
    errorSnippet: $('errorSnippet'),
    gotoErrorBtn: $('gotoErrorBtn'),
    status: $('status'),
    statusText: $('statusText'),
    outputMeta: $('outputMeta'),
    textTab: $('textTab'),
    treeTab: $('treeTab'),
    expandBtn: $('expandBtn'),
    collapseBtn: $('collapseBtn'),
    copyBtn: $('copyBtn'),
    downloadBtn: $('downloadBtn'),
    splitter: $('splitter'),
    workspace: $('workspace'),
    toast: $('toast'),
    toastText: $('toastText')
  };

  var state = {
    node: null,
    output: '',
    stats: null,
    mode: 'pretty',
    view: 'text',
    error: null,
    errorLine: null,
    stale: false,
    treeDirty: true,
    fileName: 'data.json',
    lastGutterLines: -1,
    lastGutterError: null,
    renderedLines: 0,
    totalLines: 0,
    gutterRows: 0,
    htmlLines: null,
    lineDepths: null,
    lineMode: 'plain',
    indentUnit: 2,
    appending: false
  };

  var timers = {
    validation: 0,
    draft: 0,
    searchSync: 0
  };

  var findState = {
    openLeft: false,
    openRight: false,
    open: false,
    query: '',
    replacement: '',
    leftMatches: [],
    rightMatches: [],
    leftTruncated: false,
    rightTruncated: false,
    current: -1,
    error: '',
    leftHighlighted: false,
    rightHighlighted: false,
    caseSensitive: false,
    regex: false,
    timer: 0,
    rightSyncError: false
  };

  var findBars = {
    left: {
      toggle: els.findToggle,
      bar: els.findBar,
      input: els.findInput,
      count: els.findCount,
      prev: els.findPrev,
      next: els.findNext,
      caseBtn: els.findCase,
      regexBtn: els.findRegex,
      close: els.findClose,
      replaceInput: els.replaceInput,
      replaceBtn: els.replaceBtn,
      replaceAllBtn: els.replaceAllBtn,
      layer: els.findLayer,
      layerInner: els.findLayerInner
    },
    right: {
      toggle: els.findToggleRight,
      bar: els.findBarRight,
      input: els.findInputRight,
      count: els.findCountRight,
      prev: els.findPrevRight,
      next: els.findNextRight,
      caseBtn: els.findCaseRight,
      regexBtn: els.findRegexRight,
      close: els.findCloseRight,
      replaceInput: els.replaceInputRight,
      replaceBtn: els.replaceBtnRight,
      replaceAllBtn: els.replaceAllBtnRight,
      layer: els.outputFindLayer,
      layerInner: els.outputFindLayerInner
    }
  };

  var bracketFocus = {
    active: false,
    openIndex: -1,
    closeIndex: -1,
    depth: 0
  };

  var foldState = {
    lines: [],
    lineStarts: [],
    lineCount: 0,
    folds: [],
    byKey: Object.create(null),
    byLine: Object.create(null),
    hidden: [],
    applied: [],
    collapsed: Object.create(null),
    text: ''
  };

  var undoStack = [];
  var undoChars = 0;
  var UNDO_LIMIT = 60;
  var UNDO_CHAR_LIMIT = 8000000;
  var historyLastText = '';
  var historyLastStart = 0;
  var historyLastEnd = 0;
  var historyLastAt = 0;
  var historyBurst = false;
  var historyIgnoreNext = false;

  var toastTimer = 0;
  var syncFlashTimer = 0;
  var linkFlashTimer = 0;
  var splitRatio = 0.5;
  var isResizing = false;

  /* ---------------- 本地存储 ---------------- */

  function storageGet(key, fallback) {
    try {
      var raw = localStorage.getItem(STORE_PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value));
    } catch (err) {
      /* 隐私模式或容量溢出时静默忽略 */
    }
  }

  /* ---------------- 通用工具 ---------------- */

  function escapeHtml(text) {
    return String(text).replace(/[&<>]/g, function (ch) {
      if (ch === '&') return '&amp;';
      if (ch === '<') return '&lt;';
      return '&gt;';
    });
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function byteLength(text) {
    try {
      if (window.TextEncoder) return new TextEncoder().encode(text).length;
      return unescape(encodeURIComponent(text)).length;
    } catch (err) {
      return text.length;
    }
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) {
      var kb = bytes / 1024;
      return (kb >= 10 ? kb.toFixed(0) : kb.toFixed(1)) + ' KB';
    }
    var mb = bytes / (1024 * 1024);
    return (mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)) + ' MB';
  }

  function formatMs(ms) {
    if (!isFinite(ms) || ms < 0) return '0 ms';
    if (ms < 0.1) return '< 0.1 ms';
    if (ms < 1) return ms.toFixed(2) + ' ms';
    if (ms < 100) return ms.toFixed(1) + ' ms';
    return Math.round(ms) + ' ms';
  }

  function now() {
    return window.performance && window.performance.now ? window.performance.now() : Date.now();
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toastText.textContent = message;
    els.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(function () {
      els.toast.classList.remove('is-visible');
    }, 2200);
  }

  function setStatus(kind, text) {
    els.status.className = 'status status-' + kind;
    els.statusText.textContent = text;
    els.status.title = text;
  }

  function getIndent() {
    var value = els.indentSelect.value;
    return value === 'tab' ? '\t' : Number(value) || 2;
  }

  function validStatusText(stats) {
    var text = 'JSON 有效 · ' + stats.nodes + ' 个节点 · 深度 ' + stats.maxDepth;
    if (stats.duplicates) text += ' · ' + stats.duplicates + ' 个重复键';
    return text;
  }

  /* ---------------- 输入区渲染 ---------------- */

  function updateInputMeta() {
    var count = els.input.value.length;
    els.inputMeta.textContent = count.toLocaleString('zh-CN') + ' 字符';
  }

  function updateGutter(force) {
    var lines = els.input.value.split('\n').length;

    if (!force && lines === state.lastGutterLines && state.errorLine === state.lastGutterError) {
      return;
    }

    state.lastGutterLines = lines;
    state.lastGutterError = state.errorLine;

    var gutter = els.inputGutter.parentNode;

    if (lines > 5000) {
      els.inputGutter.innerHTML = '';
      gutter.style.display = '';
      return;
    }

    gutter.style.display = '';

    var html = '';
    for (var i = 1; i <= lines; i++) {
      html += i === state.errorLine ? '<div class="is-error">' + i + '</div>' : '<div>' + i + '</div>';
    }
    els.inputGutter.innerHTML = html;
    syncInputGutter();
  }

  function syncInputGutter() {
    els.inputGutter.style.transform = 'translateY(' + -els.input.scrollTop + 'px)';
    if (!findBars.left.layer.hidden) syncFindLayer();
  }

  function syncOutputGutter() {
    els.outputGutter.style.transform = 'translateY(' + -els.outputScroll.scrollTop + 'px)';

    /* 滚到接近底部时把剩下的行续渲染出来 */
    if (state.appending) return;
    if (!state.totalLines) return;
    if (state.renderedLines >= state.totalLines) return;

    var box = els.outputScroll;
    if (!box.clientHeight) return;
    if (box.scrollTop + box.clientHeight < box.scrollHeight - 240) return;

    state.appending = true;

    try {
      appendRenderRange(state.renderedLines, state.renderedLines + RENDER_CHUNK);
    } finally {
      state.appending = false;
    }
  }

  function updateCursor() {
    var position = els.input.selectionStart || 0;
    var before = els.input.value.slice(0, position);
    var line = before.split('\n').length;
    var lastBreak = before.lastIndexOf('\n');
    var column = position - lastBreak;
    els.cursorPos.textContent = '行 ' + line + '，列 ' + column;
  }

  /* ---------------- 查找 / 替换（左右双侧） ---------------- */

  function findIsOpen() {
    return findState.openLeft || findState.openRight;
  }

  function refreshFindOpenFlag() {
    findState.open = findState.openLeft || findState.openRight;
  }

  function findSideText(side) {
    return side === 'left' ? els.input.value : state.output || '';
  }

  function findSideMatches(side) {
    return side === 'left' ? findState.leftMatches : findState.rightMatches;
  }

  function findSideTruncated(side) {
    return side === 'left' ? findState.leftTruncated : findState.rightTruncated;
  }

  function findSideHighlighted(side) {
    return side === 'left' ? findState.leftHighlighted : findState.rightHighlighted;
  }

  function setSideHighlighted(side, value) {
    if (side === 'left') {
      findState.leftHighlighted = value;
    } else {
      findState.rightHighlighted = value;
    }
  }

  function findTotal() {
    return Math.max(findState.leftMatches.length, findState.rightMatches.length);
  }

  function currentMatch(side) {
    return findSideMatches(side)[findState.current] || null;
  }

  function setFindCount(side, text, title, isError, isEmpty) {
    var count = findBars[side].count;
    count.hidden = !text;
    count.textContent = text || '';
    count.title = title || '';
    count.classList.toggle('is-error', !!isError);
    count.classList.toggle('is-empty', !!isEmpty);
  }

  function setFindInvalid(isInvalid) {
    ['left', 'right'].forEach(function (side) {
      var input = findBars[side].input;
      input.classList.toggle('is-invalid', !!isInvalid);
      if (isInvalid) {
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.removeAttribute('aria-invalid');
      }
    });
  }

  function syncFindFieldsFromState() {
    ['left', 'right'].forEach(function (side) {
      var bar = findBars[side];
      if (bar.input.value !== findState.query) bar.input.value = findState.query;
      if (bar.replaceInput.value !== findState.replacement) {
        bar.replaceInput.value = findState.replacement;
      }
    });
  }

  function mirrorFindQuery(originSide) {
    ['left', 'right'].forEach(function (side) {
      if (side !== originSide) findBars[side].input.value = findState.query;
    });
  }

  function mirrorFindReplacement(originSide) {
    ['left', 'right'].forEach(function (side) {
      if (side !== originSide) findBars[side].replaceInput.value = findState.replacement;
    });
  }

  function updateFindOptionUI() {
    ['left', 'right'].forEach(function (side) {
      var bar = findBars[side];
      bar.caseBtn.classList.toggle('is-active', findState.caseSensitive);
      bar.caseBtn.setAttribute('aria-pressed', String(findState.caseSensitive));
      bar.regexBtn.classList.toggle('is-active', findState.regex);
      bar.regexBtn.setAttribute('aria-pressed', String(findState.regex));
    });
  }

  function updateFindButtons() {
    var total = findTotal();
    var hasMatches = !findState.error && total > 0;

    ['left', 'right'].forEach(function (side) {
      var bar = findBars[side];
      var resolved = resolveSourceMatch(side);
      bar.prev.disabled = !hasMatches;
      bar.next.disabled = !hasMatches;
      bar.replaceBtn.disabled = !resolved;
      bar.replaceAllBtn.disabled = findState.error || findState.leftMatches.length === 0;

      if (!resolved && side === 'right' && findState.rightMatches[findState.current]) {
        if (state.stale) {
          bar.replaceBtn.title = '右侧结果已过期，请先格式化后再替换';
        } else if (state.mode !== 'pretty' && state.mode !== 'minify') {
          bar.replaceBtn.title = '当前结果不是输入的格式化版本，请在左侧替换';
        } else {
          bar.replaceBtn.title = '该匹配只存在于格式化结果中，请在左侧替换';
        }
      } else {
        bar.replaceBtn.title = '替换当前匹配 (Enter)';
      }
    });
  }

  function buildFindRegex() {
    var source = findState.regex ? findState.query : escapeRegExp(findState.query);
    return new RegExp(source, 'g' + (findState.caseSensitive ? '' : 'i'));
  }

  function collectMatchesWithRegex(text, regex) {
    var matches = [];
    var truncated = false;
    var match;

    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match[0].length === 0) {
        regex.lastIndex++;
        continue;
      }

      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        m: match
      });

      if (matches.length >= MAX_FIND_MATCHES) {
        truncated = true;
        break;
      }
    }

    return { matches: matches, truncated: truncated };
  }

  function findMatchIndex(matches, anchor) {
    for (var i = 0; i < matches.length; i++) {
      if (matches[i].end > anchor) return i;
    }
    return 0;
  }

  function matchIndexAtOffset(matches, offset) {
    for (var i = 0; i < matches.length; i++) {
      if (offset >= matches[i].start && offset < matches[i].end) return i;
    }
    return -1;
  }

  function matchIndexNearOffset(matches, text, offset) {
    var exact = matchIndexAtOffset(matches, offset);
    if (exact >= 0) return exact;

    var lineStart = text.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
    var lineEnd = text.indexOf('\n', offset);
    if (lineEnd === -1) lineEnd = text.length;

    var best = -1;
    var bestDistance = Infinity;

    for (var i = 0; i < matches.length; i++) {
      var item = matches[i];
      if (item.end <= lineStart || item.start >= lineEnd) continue;

      var distance = offset < item.start
        ? item.start - offset
        : offset > item.end
          ? offset - item.end
          : 0;

      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }

    return best;
  }

  function resolveSourceMatch(side) {
    if (findState.error || findState.current < 0) return null;

    var left = findState.leftMatches[findState.current];
    var right = findState.rightMatches[findState.current];

    if (side === 'left') {
      return left ? { match: left, index: findState.current } : null;
    }

    if (findState.rightSyncError || state.stale || !right) return null;
    if (state.mode !== 'pretty' && state.mode !== 'minify') return null;
    if (left && left.text === right.text) {
      return { match: left, index: findState.current };
    }

    var best = null;
    var bestDistance = Infinity;

    for (var i = 0; i < findState.leftMatches.length; i++) {
      var candidate = findState.leftMatches[i];
      if (candidate.text !== right.text) continue;

      var distance = Math.abs(i - findState.current);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { match: candidate, index: i };
      }
    }

    return best;
  }

  function clearFindOverlay(side) {
    var bar = findBars[side];
    bar.layer.hidden = true;
    bar.layerInner.innerHTML = '';
    setSideHighlighted(side, false);
  }

  function clearAllFindOverlays() {
    clearFindOverlay('left');
    clearFindOverlay('right');
  }

  function syncFindLayer() {
    if (findBars.left.layer.hidden) return;
    findBars.left.layerInner.style.transform =
      'translate(' + -els.input.scrollLeft + 'px,' + -els.input.scrollTop + 'px)';
  }

  function buildMarkupForRange(text, matches, from, to) {
    var parts = [];
    var cursor = from;

    for (var i = 0; i < matches.length; i++) {
      var item = matches[i];
      if (item.end <= from) continue;
      if (item.start >= to) break;

      var start = Math.max(item.start, from);
      var end = Math.min(item.end, to);

      if (start > cursor) {
        parts.push('<span class="find-ghost">' + escapeHtml(text.slice(cursor, start)) + '</span>');
      }

      parts.push(
        '<mark class="find-mark" data-find-index="' + i + '">' +
          '<span class="find-ghost">' + escapeHtml(text.slice(start, end)) + '</span>' +
        '</mark>'
      );
      cursor = end;
    }

    if (cursor < to) {
      parts.push('<span class="find-ghost">' + escapeHtml(text.slice(cursor, to)) + '</span>');
    }

    return parts.join('');
  }

  function buildOverlayLine(index, text, matches, starts) {
    var from = starts[index];
    var to = index + 1 < starts.length ? starts[index + 1] - 1 : text.length;
    var hidden = foldState.hidden.length === starts.length && foldState.hidden[index];

    return '<div class="ol' + (hidden ? ' is-folded' : '') +
      '" data-line="' + index + '">' +
      buildMarkupForRange(text, matches, from, to) + '</div>';
  }

  function appendOverlayRange(from, to) {
    if (findBars.right.layer.hidden) return;
    if (!foldState.lineStarts.length) return;

    var text = state.output || '';
    var html = '';

    for (var i = from; i < to; i++) {
      html += buildOverlayLine(i, text, findState.rightMatches, foldState.lineStarts);
    }

    els.outputFindLayerInner.insertAdjacentHTML('beforeend', html);
    paintCurrentMark('right');
  }

  function renderFindOverlay(side) {
    var text = findSideText(side);
    var matches = findSideMatches(side);
    var bar = findBars[side];

    if (!matches.length || !text || text.length > MAX_FIND_HIGHLIGHT_TEXT) {
      clearFindOverlay(side);
      return;
    }

    var html;

    if (side === 'right') {
      /* 右侧是逐行 DOM，高亮层必须用同样的行结构，否则折叠后错位 */
      var starts = foldState.lineStarts;
      var total = starts.length;
      var upto = Math.min(total, state.renderedLines);
      var chunks = [];

      for (var lineIndex = 0; lineIndex < upto; lineIndex++) {
        chunks.push(buildOverlayLine(lineIndex, text, matches, starts));
      }

      html = chunks.join('');
    } else {
      html = buildMarkupForRange(text, matches, 0, text.length);
    }

    bar.layerInner.innerHTML = html || '<span class="find-ghost"> </span>';
    bar.layer.hidden = false;
    setSideHighlighted(side, true);

    if (side === 'left') syncFindLayer();
  }

  function paintCurrentMark(side) {
    var bar = findBars[side];
    var currentMarks = bar.layerInner.querySelectorAll('.find-mark.is-current');

    for (var i = 0; i < currentMarks.length; i++) {
      currentMarks[i].classList.remove('is-current');
    }

    if (!findSideHighlighted(side) || findState.current < 0) return;

    var marks = bar.layerInner.querySelectorAll(
      '.find-mark[data-find-index="' + findState.current + '"]'
    );

    for (var i = 0; i < marks.length; i++) {
      marks[i].classList.add('is-current');
    }
  }

  function updateFindCount() {
    if (!findIsOpen()) return;

    if (!findState.query) {
      setFindCount('left', '');
      setFindCount('right', '');
      return;
    }

    if (findState.error) {
      ['left', 'right'].forEach(function (side) {
        setFindCount(side, '正则有误', findState.error, true);
      });
      return;
    }

    var countsDiffer = findState.leftMatches.length !== findState.rightMatches.length;

    ['left', 'right'].forEach(function (side) {
      var matches = findSideMatches(side);
      var label = side === 'left' ? '左侧' : '右侧';

      if (side === 'right' && findState.rightSyncError) {
        setFindCount(side, '待同步', '修改后 JSON 无效，右侧结果暂未同步', true, true);
        return;
      }

      if (!matches.length) {
        setFindCount(side, '无结果', label + '没有匹配项', false, true);
        return;
      }

      var truncated = findSideTruncated(side);
      var totalLabel = truncated ? matches.length + '+' : String(matches.length);
      var exists = !!matches[findState.current];
      var prefix = exists ? String(findState.current + 1) : '–';
      var title = label + '共 ' + totalLabel + ' 处匹配';

      if (countsDiffer) title += '；两侧数量不同，跳转按顺序对齐';
      if (side === 'right' && state.stale) title += '；右侧结果已过期，请先格式化';
      if (truncated) title += '；仅标记前 ' + MAX_FIND_MATCHES + ' 处';
      if (!findSideHighlighted(side)) title += '；已省略高亮';
      title += '；点击命中行可联动两侧';

      setFindCount(side, prefix + ' / ' + totalLabel, title);
    });
  }

  function renderFindResults() {
    renderFindOverlay('left');
    renderFindOverlay('right');
    paintCurrentMark('left');
    paintCurrentMark('right');
    updateFindCount();
    updateFindButtons();
  }

  function runFind(options) {
    options = options || {};

    if (!findIsOpen()) return;

    window.clearTimeout(findState.timer);
    findState.timer = 0;

    var anchorSide = options.anchorSide === 'right' ? 'right' : 'left';
    var previous = currentMatch(anchorSide);
    var anchor;

    if (typeof options.anchor === 'number') {
      anchor = options.anchor;
    } else if (options.preserve && previous) {
      anchor = previous.start;
    } else if (anchorSide === 'left') {
      anchor = els.input.selectionStart || 0;
    } else {
      anchor = 0;
    }

    findState.error = '';
    setFindInvalid(false);

    if (!findState.query) {
      findState.leftMatches = [];
      findState.rightMatches = [];
      findState.leftTruncated = false;
      findState.rightTruncated = false;
      findState.current = -1;
      clearAllFindOverlays();
      setFindCount('left', '');
      setFindCount('right', '');
      updateFindButtons();
      return;
    }

    var regex;

    try {
      regex = buildFindRegex();
    } catch (err) {
      findState.error = (err && err.message) || '正则表达式无效';
      findState.leftMatches = [];
      findState.rightMatches = [];
      findState.leftTruncated = false;
      findState.rightTruncated = false;
      findState.current = -1;
      clearAllFindOverlays();
      setFindInvalid(true);
      updateFindCount();
      updateFindButtons();
      return;
    }

    var leftResult = collectMatchesWithRegex(els.input.value, regex);
    var rightResult = findState.rightSyncError || !state.output
      ? { matches: [], truncated: false }
      : collectMatchesWithRegex(state.output, regex);

    findState.leftMatches = leftResult.matches;
    findState.rightMatches = rightResult.matches;
    findState.leftTruncated = leftResult.truncated;
    findState.rightTruncated = rightResult.truncated;

    if (!findState.leftMatches.length && !findState.rightMatches.length) {
      findState.current = -1;
      clearAllFindOverlays();
      updateFindCount();
      updateFindButtons();
      return;
    }

    var anchorMatches = findSideMatches(anchorSide);
    if (!anchorMatches.length) {
      anchorSide = anchorSide === 'left' ? 'right' : 'left';
      anchorMatches = findSideMatches(anchorSide);
    }

    anchor = Math.max(0, Math.min(anchor, findSideText(anchorSide).length));
    findState.current = findMatchIndex(anchorMatches, anchor);

    renderFindResults();

    if (!options.noScroll) {
      revealCurrentMatch({
        selectLeft: options.selectLeft !== false,
        scrollLeft: options.scrollLeft !== false,
        scrollRight: options.scrollRight !== false
      });
    }
  }

  function scheduleFindUpdate(options) {
    if (!findIsOpen()) return;

    window.clearTimeout(findState.timer);
    findState.timer = window.setTimeout(function () {
      findState.timer = 0;
      runFind(options || {});
    }, 90);
  }

  function flushFindUpdate(side) {
    if (!findState.timer) return;
    window.clearTimeout(findState.timer);
    findState.timer = 0;
    runFind({
      anchorSide: side === 'right' ? 'right' : 'left',
      preserve: true,
      noScroll: true
    });
  }

  function revealLeftMatch(item, select) {
    if (!item) return;

    if (select) {
      els.input.setSelectionRange(item.start, item.end);
    }

    var mark = findBars.left.layerInner.querySelector(
      '.find-mark[data-find-index="' + findState.current + '"]'
    );
    var lineHeight = 22;
    var desiredTop;
    var desiredLeft;

    if (mark && findState.leftHighlighted) {
      var innerRect = findBars.left.layerInner.getBoundingClientRect();
      var markRect = mark.getBoundingClientRect();
      desiredTop = (markRect.top - innerRect.top) - (els.input.clientHeight - lineHeight) / 2;
      desiredLeft =
        (markRect.left - innerRect.left) -
        els.input.clientWidth / 2 +
        Math.min(markRect.width, 140) / 2;
    } else {
      var before = els.input.value.slice(0, item.start);
      var line = before.split('\n').length;
      var column = item.start - before.lastIndexOf('\n');
      desiredTop = (line - 1) * lineHeight - (els.input.clientHeight - lineHeight) / 2;
      desiredLeft = (column - 1) * 7.8 - els.input.clientWidth / 2;
    }

    var maxTop = Math.max(0, els.input.scrollHeight - els.input.clientHeight);
    var maxLeft = Math.max(0, els.input.scrollWidth - els.input.clientWidth);

    els.input.scrollTop = Math.max(0, Math.min(desiredTop, maxTop));
    els.input.scrollLeft = Math.max(0, Math.min(desiredLeft, maxLeft));

    syncInputGutter();
    if (select) updateCursor();
  }

  function revealRightMatch(item) {
    if (!item) return;

    if (state.view !== 'text') setView('text');

    var targetLine = lineIndexAtOffset(item.start);
    if (targetLine >= 0) {
      ensureRendered(targetLine);
      ensureLinesVisible([targetLine]);
    }

    var mark = findBars.right.layerInner.querySelector(
      '.find-mark[data-find-index="' + findState.current + '"]'
    );
    var scrollBox = els.outputScroll.getBoundingClientRect();
    var lineHeight = 22;
    var desiredTop;
    var desiredLeft;

    if (mark && findState.rightHighlighted) {
      var markRect = mark.getBoundingClientRect();
      desiredTop =
        els.outputScroll.scrollTop +
        (markRect.top - scrollBox.top) -
        (scrollBox.height - lineHeight) / 2;
      desiredLeft =
        els.outputScroll.scrollLeft +
        (markRect.left - scrollBox.left) -
        (scrollBox.width - Math.min(markRect.width, 140)) / 2;
    } else {
      var before = (state.output || '').slice(0, item.start);
      var line = before.split('\n').length;
      var column = item.start - before.lastIndexOf('\n');
      desiredTop = visibleRowTop(line - 1) - scrollBox.height / 2;
      desiredLeft = (column - 1) * 7.8 - scrollBox.width / 2;
    }

    els.outputScroll.scrollTop = Math.max(0, desiredTop);
    els.outputScroll.scrollLeft = Math.max(0, desiredLeft);
  }

  function revealCurrentMatch(options) {
    options = options || {};

    var left = findState.leftMatches[findState.current];
    var right = findState.rightMatches[findState.current];

    if (left && options.scrollLeft !== false) {
      revealLeftMatch(left, options.selectLeft !== false);
    }

    if (right && options.scrollRight !== false) {
      revealRightMatch(right);
    }
  }

  function goToMatch(delta) {
    flushFindUpdate();

    var total = findTotal();
    if (!total) return;

    if (findState.current < 0) {
      findState.current = 0;
    } else {
      findState.current = (findState.current + delta + total) % total;
    }

    paintCurrentMark('left');
    paintCurrentMark('right');
    updateFindCount();
    updateFindButtons();
    revealCurrentMatch({ selectLeft: true, scrollLeft: true, scrollRight: true });
  }

  function flashLinkedPanel(side) {
    var bar = findBars[side];
    var panel = bar && bar.bar.closest ? bar.bar.closest('.panel') : null;
    if (!panel) return;

    panel.classList.remove('is-linked');
    void panel.offsetWidth;
    panel.classList.add('is-linked');

    window.clearTimeout(linkFlashTimer);
    linkFlashTimer = window.setTimeout(function () {
      panel.classList.remove('is-linked');
    }, 800);
  }

  function revealTargetPanel(side) {
    if (window.innerWidth > 1000) return;
    var panel = side === 'left'
      ? findBars.left.bar.closest('.panel')
      : findBars.right.bar.closest('.panel');
    if (!panel) return;

    var box = panel.getBoundingClientRect();
    if (box.top < 0 || box.bottom > window.innerHeight) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function setFindIndex(index, fromSide) {
    var total = findTotal();
    if (!total) return;

    findState.current = Math.max(0, Math.min(index, total - 1));
    paintCurrentMark('left');
    paintCurrentMark('right');
    updateFindCount();
    updateFindButtons();
    revealCurrentMatch({
      selectLeft: fromSide !== 'left',
      scrollLeft: fromSide !== 'left',
      scrollRight: fromSide !== 'right'
    });

    if (fromSide === 'left') {
      flashLinkedPanel('right');
      revealTargetPanel('right');
    } else if (fromSide === 'right') {
      flashLinkedPanel('left');
      revealTargetPanel('left');
    }
  }

  function openFind(side, focusReplace) {
    side = side === 'right' ? 'right' : 'left';
    var bar = findBars[side];
    var wasOpen = side === 'left' ? findState.openLeft : findState.openRight;

    if (!wasOpen) {
      if (side === 'left') {
        findState.openLeft = true;
      } else {
        findState.openRight = true;
      }
      refreshFindOpenFlag();
      bar.bar.hidden = false;
      bar.toggle.setAttribute('aria-expanded', 'true');

      if (state.stale && els.input.value.trim()) {
        syncOutputAfterReplace();
      }

      if (side === 'right' && state.output) setView('text');

      if (!findState.query) {
        var selected = els.input.value.slice(els.input.selectionStart, els.input.selectionEnd);
        if (selected && selected.length <= 120 && selected.indexOf('\n') === -1) {
          findState.query = selected;
        }
      }
    }

    syncFindFieldsFromState();

    var target = focusReplace ? bar.replaceInput : bar.input;

    if (wasOpen) {
      window.setTimeout(function () {
        target.focus();
        target.select();
      }, 0);
      return;
    }

    runFind({ anchorSide: side, noScroll: false });

    window.setTimeout(function () {
      target.focus();
      target.select();
    }, 0);
  }

  function closeFind(side, returnFocus) {
    side = side === 'right' ? 'right' : 'left';

    if (side === 'left') {
      findState.openLeft = false;
    } else {
      findState.openRight = false;
    }

    refreshFindOpenFlag();
    findBars[side].bar.hidden = true;
    findBars[side].toggle.setAttribute('aria-expanded', 'false');

    if (!findState.open) {
      window.clearTimeout(findState.timer);
      findState.timer = 0;
      findState.leftMatches = [];
      findState.rightMatches = [];
      findState.leftTruncated = false;
      findState.rightTruncated = false;
      findState.current = -1;
      findState.error = '';
      setFindInvalid(false);
      clearAllFindOverlays();
      setFindCount('left', '');
      setFindCount('right', '');
      updateFindButtons();
    } else {
      updateFindCount();
    }

    if (returnFocus) els.input.focus();
  }

  function closeAllFind(returnFocus) {
    if (findState.openLeft) closeFind('left', false);
    if (findState.openRight) closeFind('right', false);
    if (returnFocus) els.input.focus();
  }

  function lineElementOf(node, offset) {
    var el = node && node.nodeType === 1 ? node : (node ? node.parentNode : null);

    while (el && el !== els.output) {
      if (el.classList && el.classList.contains('ol')) return el;
      el = el.parentNode;
    }

    if (el !== els.output) return null;

    var childCount = el.childNodes.length;
    if (!childCount) return null;

    var index = Math.min(Math.max(0, offset), childCount - 1);
    var child = el.childNodes[index];

    if (child && child.nodeType === 1 && child.classList.contains('ol')) return child;

    if (child && child.nextElementSibling &&
        child.nextElementSibling.classList.contains('ol')) {
      return child.nextElementSibling;
    }

    if (child && child.previousElementSibling &&
        child.previousElementSibling.classList.contains('ol')) {
      return child.previousElementSibling;
    }

    return null;
  }

  /** 把鼠标坐标换算成 state.output 里的字符偏移（逐行 DOM，按行起始偏移还原）。 */
  function textOffsetAtPoint(container, x, y) {
    var range = null;

    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y);
    } else if (document.caretPositionFromPoint) {
      var position = document.caretPositionFromPoint(x, y);
      if (position) {
        range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.collapse(true);
      }
    }

    if (!range || !container.contains(range.startContainer)) return null;

    var lineEl = lineElementOf(range.startContainer, range.startOffset);
    if (!lineEl) return null;

    var lineStart = parseInt(lineEl.getAttribute('data-start'), 10);
    if (!isFinite(lineStart)) return null;

    if (!lineEl.contains(range.startContainer)) return lineStart;

    var probe = document.createRange();

    try {
      probe.setStart(lineEl, 0);
      probe.setEnd(range.startContainer, range.startOffset);
    } catch (err) {
      return lineStart;
    }

    return lineStart + probe.toString().length;
  }

  function handleInputFindClick() {
    if (els.input.selectionStart !== els.input.selectionEnd) return;

    if (handleBracketClickFromInput()) return;
    clearBracketFocus();

    if (!findIsOpen() || findState.error || state.stale) return;

    var index = matchIndexNearOffset(
      findState.leftMatches,
      els.input.value,
      els.input.selectionStart
    );
    if (index >= 0) setFindIndex(index, 'left');
  }

  function handleOutputFindClick(event) {
    if (els.outputScroll.hidden) return;

    var chip = event.target && event.target.closest
      ? event.target.closest('[data-fold-chip]')
      : null;

    if (chip) {
      event.preventDefault();
      toggleFold(chip.getAttribute('data-fold-chip'));
      return;
    }

    var selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;

    if (handleBracketClickFromOutput(event)) return;
    clearBracketFocus();

    if (!findIsOpen() || findState.error || state.stale) return;

    var offset = textOffsetAtPoint(els.output, event.clientX, event.clientY);
    if (offset === null) return;

    var index = matchIndexNearOffset(findState.rightMatches, state.output, offset);
    if (index >= 0) setFindIndex(index, 'right');
  }

  function expandReplacement(template, match, source) {
    return template.replace(/\$(\$|&|`|'|<[^>]+>|\d{1,2})/g, function (token, body) {
      if (body === '$') return '$';
      if (body === '&') return match[0];
      if (body === '`') return source.slice(0, match.index);
      if (body === "'") return source.slice(match.index + match[0].length);

      if (body.charAt(0) === '<') {
        var name = body.slice(1, -1);
        if (match.groups && Object.prototype.hasOwnProperty.call(match.groups, name)) {
          return match.groups[name] === undefined ? '' : match.groups[name];
        }
        return token;
      }

      var index = parseInt(body, 10);
      if (index >= 1 && index < match.length) {
        return match[index] === undefined ? '' : match[index];
      }
      return token;
    });
  }

  function regexReplaceAll(text, template) {
    var regex;

    try {
      regex = buildFindRegex();
    } catch (err) {
      return null;
    }

    var count = 0;
    var output = text.replace(regex, function () {
      var args = Array.prototype.slice.call(arguments);
      var groups;

      if (args.length && args[args.length - 1] && typeof args[args.length - 1] === 'object') {
        groups = args.pop();
      }

      var source = args.pop();
      var offset = args.pop();

      if (!args[0]) return '';

      var match = args;
      match.index = offset;
      match.input = source;
      match.groups = groups;
      count++;
      return expandReplacement(template, match, source);
    });

    return { output: output, count: count };
  }

  function syncOutputAfterReplace() {
    var text = els.input.value;
    window.clearTimeout(timers.searchSync);
    timers.searchSync = 0;
    findState.rightSyncError = false;
    if (!text.trim()) {
      resetResultState();
      setStatus('neutral', '等待输入');
      return true;
    }

    try {
      var node = TOOLS.parse(text);
      var stats = TOOLS.analyze(node);
      var mode = state.mode === 'minify' ? 'minify' : 'pretty';
      var output = TOOLS.serialize(node, {
        indent: mode === 'minify' ? 0 : getIndent(),
        sortKeys: els.sortKeys.checked
      });

      applyResult(node, output, { mode: mode, stats: stats });
      setStatus('valid', '已同步 · ' + formatBytes(byteLength(output)) + ' · ' + stats.nodes + ' 个节点');

      if (findState.openRight) setView('text');
      return true;
    } catch (err) {
      findState.rightSyncError = true;
      state.stale = true;
      updateOutputMeta();

      if (err instanceof TOOLS.JSONParseError) {
        setStatus(
          'invalid',
          '修改后 JSON 无效 · 第 ' + err.line + ' 行第 ' + err.column + ' 列'
        );
      } else {
        setStatus('invalid', '修改后 JSON 无效');
      }

      return false;
    }
  }

  function flashOutputSync() {
    var panel = els.outputBody.closest ? els.outputBody.closest('.panel') : null;
    if (!panel) return;

    panel.classList.remove('is-synced');
    void panel.offsetWidth;
    panel.classList.add('is-synced');

    window.clearTimeout(syncFlashTimer);
    syncFlashTimer = window.setTimeout(function () {
      panel.classList.remove('is-synced');
    }, 900);
  }

  function replaceCurrentMatch(side) {
    side = side === 'right' ? 'right' : 'left';
    flushFindUpdate(side);

    var resolved = resolveSourceMatch(side);

    if (!resolved) {
      showToast(side === 'right' ? '该匹配包含格式化空白，请在左侧替换' : '没有可替换的匹配');
      return;
    }

    var item = resolved.match;
    var text = els.input.value;
    var template = findState.replacement;
    var insertion = findState.regex
      ? expandReplacement(template, item.m, text)
      : template;
    var nextText = text.slice(0, item.start) + insertion + text.slice(item.end);
    var caret = item.start + insertion.length;

    recordProgrammaticChange();
    els.input.value = nextText;
    els.input.setSelectionRange(caret, caret);
    els.input.dispatchEvent(new Event('input', { bubbles: true }));

    var synced = syncOutputAfterReplace();
    runFind({ anchor: caret, anchorSide: 'left' });
    if (synced) flashOutputSync();

    showToast(synced ? '已替换 1 处 · 两侧已同步' : '已替换 1 处 · 右侧未同步');
    els.input.focus();
  }

  function replaceAllMatches(side) {
    side = side === 'right' ? 'right' : 'left';
    flushFindUpdate(side);

    if (findState.error || !findState.leftMatches.length) {
      showToast('没有可替换的匹配');
      return;
    }

    var text = els.input.value;
    var template = findState.replacement;
    var result;

    if (findState.regex) {
      result = regexReplaceAll(text, template);
    } else {
      var regex = new RegExp(
        escapeRegExp(findState.query),
        findState.caseSensitive ? 'g' : 'gi'
      );
      var count = 0;
      var output = text.replace(regex, function () {
        count++;
        return template;
      });
      result = { output: output, count: count };
    }

    if (!result || !result.count) {
      showToast('没有可替换的匹配');
      return;
    }

    if (result.count > 1 && !window.confirm(
      '确定替换两侧全部 ' + result.count + ' 处匹配吗？此操作会直接修改输入内容。'
    )) {
      return;
    }

    recordProgrammaticChange();
    els.input.value = result.output;
    els.input.setSelectionRange(0, 0);
    els.input.dispatchEvent(new Event('input', { bubbles: true }));

    var synced = syncOutputAfterReplace();
    runFind({ anchor: 0, anchorSide: 'left' });
    if (synced) flashOutputSync();

    showToast('已替换 ' + result.count + ' 处' + (synced ? ' · 两侧已同步' : ' · 右侧未同步'));
    els.input.focus();
  }

  function refreshFindAfterChange(anchor, noScroll) {
    if (!findIsOpen()) return;
    runFind({
      anchor: typeof anchor === 'number' ? anchor : 0,
      anchorSide: 'left',
      noScroll: !!noScroll
    });
  }

  function refreshFindAfterOutputChange() {
    if (!findIsOpen() || !findState.query) return;
    runFind({ anchorSide: 'left', preserve: true, noScroll: true });
  }

  function computeLineDepths(text) {
    var lines = text.split('\n');
    var depths = [];
    var depth = 0;
    var inString = false;
    var escaped = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.replace(/^\s+/, '');
      var lineDepth = depth;

      if (trimmed.charAt(0) === '}' || trimmed.charAt(0) === ']') {
        lineDepth = Math.max(0, depth - 1);
      }

      depths.push(lineDepth);

      for (var j = 0; j < line.length; j++) {
        var ch = line.charAt(j);

        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (ch === '\\') {
            escaped = true;
          } else if (ch === '"') {
            inString = false;
          }
        } else if (ch === '"') {
          inString = true;
        } else if (ch === '{' || ch === '[') {
          depth++;
        } else if (ch === '}' || ch === ']') {
          depth = Math.max(0, depth - 1);
        }
      }

      inString = false;
      escaped = false;
    }

    return depths;
  }

  function renderOutputGutter(text, withDepth, depths, limit) {
    var lineCount = foldState.lineCount || text.split('\n').length;

    if (lineCount > MAX_FOLD_LINES) {
      els.outputGutterWrap.style.display = 'none';
      els.outputGutter.innerHTML = '';
      return;
    }

    els.outputGutterWrap.style.display = '';

    if (withDepth && !depths) depths = computeLineDepths(text);
    if (!withDepth) depths = null;

    var upto = typeof limit === 'number' ? Math.min(limit, lineCount) : lineCount;

    els.outputGutter.innerHTML = buildGutterHtml(0, upto, depths);
  }

  function buildGutterHtml(from, to, depths) {
    var foldable = foldEnabled();
    var html = '';

    for (var i = from; i < to; i++) {
      var classes = 'gutter-row';
      if (depths) classes += ' depth-' + (depths[i] % 8);

      var fold = foldable ? foldState.byLine[i] : null;
      var collapsed = !!(fold && foldState.collapsed[fold.key]);

      if (foldable && foldState.hidden[i]) classes += ' is-folded';

      var button = fold
        ? '<span class="fold-btn" role="button" tabindex="-1" data-fold-key="' +
            fold.key + '" data-collapsed="' + (collapsed ? '1' : '0') +
            '" aria-expanded="' + (!collapsed) +
            '" title="' + (collapsed ? '展开这一层' : '折叠这一层') + '"></span>'
        : '';

      html += '<div class="' + classes + '" data-line="' + i + '">' +
        button + '<span class="gutter-num">' + (i + 1) + '</span>' +
      '</div>';
    }

    return html;
  }

  /* ---------------- 语法高亮 ---------------- */

  function depthClassOf(depth) {
    return ' depth-' + (depth % 8);
  }

  function highlightJSON(text, depths) {
    var pattern = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+\-]?\d+)?)|([{}\[\],])/g;
    var html = '';
    var last = 0;
    var match;
    var depth = 0;
    var bracketOrdinal = 0;

    while ((match = pattern.exec(text))) {
      html += escapeHtml(text.slice(last, match.index));

      var tokenDepth = depth;
      var tokenStartAttr = ' data-token-start="' + match.index + '"';
      var bracketAttrs = '';

      if (match[5]) {
        if (match[5] === '{' || match[5] === '[') {
          tokenDepth = depth;
          depth++;
        } else if (match[5] === '}' || match[5] === ']') {
          depth = Math.max(0, depth - 1);
          tokenDepth = depth;
        }

        if (match[5] === '{' || match[5] === '}' || match[5] === '[' || match[5] === ']') {
          bracketAttrs =
            ' data-char-start="' + match.index + '"' +
            ' data-bracket-index="' + bracketOrdinal + '"';
          bracketOrdinal++;
        }
      }

      var depthClass = depthClassOf(tokenDepth);

      if (match[1]) {
        var isKey = !!match[2];
        html += '<span class="tok-' + (isKey ? 'key' : 'string') + depthClass + '"' + tokenStartAttr + '>' + escapeHtml(match[1]) + '</span>';
        if (match[2]) {
          html += '<span class="tok-punct' + depthClass + '" data-token-start="' +
            (match.index + match[1].length) + '">' + escapeHtml(match[2]) + '</span>';
        }
      } else if (match[3]) {
        html += '<span class="tok-' + (match[3] === 'null' ? 'null' : 'boolean') + depthClass + '"' + tokenStartAttr + '>' + match[3] + '</span>';
      } else if (match[4]) {
        html += '<span class="tok-number' + depthClass + '"' + tokenStartAttr + '>' + match[4] + '</span>';
      } else if (match[5]) {
        var isBrace = match[5] === '{' || match[5] === '}' || match[5] === '[' || match[5] === ']';
        html += '<span class="tok-' + (isBrace ? 'brace' : 'punct') + depthClass + '"' +
          tokenStartAttr + bracketAttrs + '>' + match[5] + '</span>';
      }

      last = pattern.lastIndex;
    }

    html += escapeHtml(text.slice(last));

    var htmlLines = html.split('\n');
    var lineDepths = depths || computeLineDepths(text);

    for (var lineIndex = 0; lineIndex < htmlLines.length; lineIndex++) {
      var lineDepth = lineDepths[lineIndex] || 0;
      htmlLines[lineIndex] = htmlLines[lineIndex].replace(/^[ \t]+/, function (spaces) {
        return '<span class="indent-guide depth-' + (lineDepth % 8) + '">' +
          spaces +
        '</span>';
      });
    }

    return htmlLines;
  }

  function highlightJSONCoarse(text, depths) {
    var lines = text.split('\n');
    var lineDepths = depths || computeLineDepths(text);
    var parts = [];

    for (var i = 0; i < lines.length; i++) {
      parts.push(
        '<span class="coarse-line depth-' + (lineDepths[i] % 8) + '">' +
          escapeHtml(lines[i]) +
        '</span>'
      );
    }

    return parts;
  }

  /* ---------------- 层级折叠 ---------------- */

  /**
   * 把文本切成逐行数组，并记录每行在原文中的起始偏移。
   * 行偏移是右侧「点击联动 / 括号聚焦 / 查找跳转」的映射基准。
   */
  function prepareFoldLines(text) {
    var lines = text.split('\n');
    var starts = new Array(lines.length);
    var acc = 0;

    for (var i = 0; i < lines.length; i++) {
      starts[i] = acc;
      acc += lines[i].length + 1;
    }

    foldState.lines = lines;
    foldState.lineStarts = starts;
    foldState.lineCount = lines.length;

    return lines;
  }

  function resetFoldState() {
    foldState.folds = [];
    foldState.byKey = Object.create(null);
    foldState.byLine = Object.create(null);
    foldState.hidden = [];
    foldState.applied = [];
    foldState.collapsed = Object.create(null);
    foldState.text = '';
  }

  function lineIndexAtOffset(offset) {
    var starts = foldState.lineStarts;

    if (!starts.length) return -1;

    var lo = 0;
    var hi = starts.length - 1;

    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }

    return lo;
  }

  /** 折叠后第 lineIndex 行在可视区里的纵向位置（按 22px 行高累计可见行）。 */
  function visibleRowTop(lineIndex) {
    var hidden = foldState.hidden;
    var lineHeight = 22;

    if (!hidden.length || lineIndex <= 0) return Math.max(0, lineIndex) * lineHeight;

    var row = 0;
    var limit = Math.min(lineIndex, hidden.length);

    for (var i = 0; i < limit; i++) {
      if (!hidden[i]) row++;
    }

    return row * lineHeight;
  }

  /**
   * 单次扫描出所有「跨行容器」：
   * - key    开括号的字符偏移（同时作为折叠状态的稳定标识）
   * - 子项数量、是否带尾随逗号，用于折叠后的摘要
   */
  function analyzeFolds(text) {
    var starts = foldState.lineStarts;
    var folds = [];
    var stack = [];
    var inString = false;
    var escaped = false;

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        if (stack.length) stack[stack.length - 1].hasContent = true;
        continue;
      }

      if (ch === '{' || ch === '[') {
        if (stack.length) stack[stack.length - 1].hasContent = true;
        stack.push({
          start: i,
          line: lineIndexAtOffset(i),
          brace: ch,
          children: 0,
          hasContent: false
        });
        continue;
      }

      if (ch === '}' || ch === ']') {
        var open = stack.pop();
        if (!open) continue;

        var closeLine = lineIndexAtOffset(i);
        if (closeLine <= open.line) continue;

        folds.push({
          key: open.start,
          start: open.start,
          end: i,
          brace: open.brace,
          closeBrace: ch,
          openLine: open.line,
          closeLine: closeLine,
          children: open.children + (open.hasContent ? 1 : 0),
          trailingComma: text.charAt(i + 1) === ','
        });
        continue;
      }

      if (ch === ',') {
        if (stack.length) stack[stack.length - 1].children++;
        continue;
      }

      if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') continue;

      if (stack.length) stack[stack.length - 1].hasContent = true;
    }

    return folds;
  }

  function bindFoldState(text) {
    if (foldState.text !== text) {
      foldState.collapsed = Object.create(null);
    }

    foldState.text = text;
    foldState.folds = analyzeFolds(text);
    foldState.byKey = Object.create(null);
    foldState.byLine = Object.create(null);

    for (var i = 0; i < foldState.folds.length; i++) {
      var fold = foldState.folds[i];
      foldState.byKey[fold.key] = fold;
      foldState.byLine[fold.openLine] = fold;
    }

    var keys = Object.keys(foldState.collapsed);
    for (var k = 0; k < keys.length; k++) {
      if (!foldState.byKey[keys[k]]) delete foldState.collapsed[keys[k]];
    }

    computeFoldHidden();
  }

  /**
   * 用差分数组算「哪些行被折叠隐藏」，复杂度 O(行数 + 折叠数)，
   * 避免折叠全部时按范围逐行写（嵌套时是 O(行数²)）。
   */
  function computeFoldHidden() {
    var lineCount = foldState.lineCount;
    var diff = new Int32Array(lineCount + 1);
    var keys = Object.keys(foldState.collapsed);

    for (var k = 0; k < keys.length; k++) {
      var fold = foldState.byKey[keys[k]];
      if (!fold) continue;

      diff[fold.openLine + 1] += 1;
      if (fold.closeLine + 1 <= lineCount) diff[fold.closeLine + 1] -= 1;
    }

    var hidden = new Array(lineCount);
    var running = 0;

    for (var i = 0; i < lineCount; i++) {
      running += diff[i];
      hidden[i] = running > 0;
    }

    foldState.hidden = hidden;
  }

  function foldEnabled() {
    return state.mode === 'pretty' &&
      !!state.output &&
      state.output.length <= MAX_HIGHLIGHT &&
      foldState.lineCount > 0 &&
      foldState.lineCount <= MAX_FOLD_LINES &&
      foldState.folds.length > 0;
  }

  function foldSummaryText(fold) {
    var label = fold.brace === '{'
      ? fold.children + ' 个键'
      : fold.children + ' 项';

    return '… ' + label + ' ' + fold.closeBrace + (fold.trailingComma ? ',' : '');
  }

  function applyFoldState() {
    var enabled = foldEnabled();

    els.outputBody.classList.toggle('has-folds', enabled);

    var lineCount = state.renderedLines;
    var next = new Array(lineCount);
    var i;

    for (i = 0; i < lineCount; i++) {
      next[i] = enabled ? !!foldState.hidden[i] : false;
    }

    /* 只改动状态发生翻转的行，避免每次折叠都遍历整篇文档 */
    var prev = foldState.applied;
    var lines = els.output.children;
    var rows = els.outputGutter.children;
    var overlays = els.outputFindLayerInner.children;
    var full = !prev || prev.length !== lineCount;

    for (i = 0; i < lineCount; i++) {
      if (!full && prev[i] === next[i]) continue;

      if (lines[i]) lines[i].classList.toggle('is-folded', next[i]);
      if (rows[i]) rows[i].classList.toggle('is-folded', next[i]);
      if (overlays[i]) overlays[i].classList.toggle('is-folded', next[i]);
    }

    foldState.applied = next;

    var chips = els.output.querySelectorAll('[data-fold-chip]');
    for (i = 0; i < chips.length; i++) {
      var chipKey = chips[i].getAttribute('data-fold-chip');
      chips[i].classList.toggle('is-visible', enabled && !!foldState.collapsed[chipKey]);
    }

    var buttons = els.outputGutter.querySelectorAll('.fold-btn');
    for (i = 0; i < buttons.length; i++) {
      var buttonKey = buttons[i].getAttribute('data-fold-key');
      var collapsed = enabled && !!foldState.collapsed[buttonKey];

      buttons[i].setAttribute('data-collapsed', collapsed ? '1' : '0');
      buttons[i].setAttribute('aria-expanded', String(!collapsed));
      buttons[i].title = collapsed ? '展开这一层' : '折叠这一层';
    }

    updateFoldButtons();
    syncOutputGutter();
  }

  function updateFoldButtons() {
    var isTree = state.view === 'tree';
    var hasOutput = !!state.output;

    if (isTree) {
      els.expandBtn.hidden = !hasOutput;
      els.collapseBtn.hidden = !hasOutput;
      els.expandBtn.disabled = false;
      els.collapseBtn.disabled = false;
      return;
    }

    var enabled = foldEnabled();

    els.expandBtn.hidden = !enabled;
    els.collapseBtn.hidden = !enabled;

    if (!enabled) {
      els.expandBtn.disabled = true;
      els.collapseBtn.disabled = true;
      return;
    }

    var anyCollapsed = false;
    for (var i = 0; i < foldState.folds.length; i++) {
      if (foldState.collapsed[foldState.folds[i].key]) {
        anyCollapsed = true;
        break;
      }
    }

    els.expandBtn.disabled = !anyCollapsed;
    els.collapseBtn.disabled = false;
  }

  function setFoldCollapsed(key, collapsed) {
    if (!foldState.byKey[key]) return;

    if (collapsed) {
      foldState.collapsed[key] = true;
    } else {
      delete foldState.collapsed[key];
    }

    computeFoldHidden();
    applyFoldState();
  }

  function toggleFold(key) {
    setFoldCollapsed(key, !foldState.collapsed[key]);
  }

  function foldAll() {
    if (!foldEnabled()) return;

    for (var i = 0; i < foldState.folds.length; i++) {
      foldState.collapsed[foldState.folds[i].key] = true;
    }

    computeFoldHidden();
    applyFoldState();
  }

  function unfoldAll() {
    if (!foldEnabled()) return;

    foldState.collapsed = Object.create(null);
    computeFoldHidden();
    applyFoldState();
  }

  /** 跳转到某一行之前，先把包含它的折叠逐层展开。 */
  function ensureLinesVisible(linesToShow) {
    if (!foldEnabled()) return false;

    var changed = false;

    for (var i = 0; i < linesToShow.length; i++) {
      var target = linesToShow[i];
      if (target < 0 || !foldState.hidden[target]) continue;

      for (var f = 0; f < foldState.folds.length; f++) {
        var fold = foldState.folds[f];
        if (target > fold.openLine && target <= fold.closeLine && foldState.collapsed[fold.key]) {
          delete foldState.collapsed[fold.key];
          changed = true;
        }
      }
    }

    if (changed) {
      computeFoldHidden();
      applyFoldState();
    }

    return changed;
  }

  /* ---------------- 括号层级聚焦 ---------------- */

  function scanBrackets(text) {
    var brackets = [];
    var stack = [];
    var inString = false;
    var escaped = false;

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === '{' || ch === '[') {
        var open = {
          index: brackets.length,
          char: ch,
          start: i,
          open: true,
          depth: stack.length,
          pair: -1
        };
        brackets.push(open);
        stack.push(open.index);
      } else if (ch === '}' || ch === ']') {
        var openIndex = stack.pop();

        if (typeof openIndex === 'number') {
          var openBracket = brackets[openIndex];
          var close = {
            index: brackets.length,
            char: ch,
            start: i,
            open: false,
            depth: openBracket.depth,
            pair: openIndex
          };
          openBracket.pair = close.index;
          brackets.push(close);
        } else {
          brackets.push({
            index: brackets.length,
            char: ch,
            start: i,
            open: false,
            depth: 0,
            pair: -1
          });
        }
      }
    }

    return { brackets: brackets, text: text };
  }

  function bracketNearOffset(scan, offset) {
    var best = null;
    var bestDistance = Infinity;

    for (var i = 0; i < scan.brackets.length; i++) {
      var bracket = scan.brackets[i];
      var distance;

      if (offset < bracket.start) {
        distance = bracket.start - offset;
      } else if (offset > bracket.start + 1) {
        distance = offset - (bracket.start + 1);
      } else {
        distance = 0;
      }

      if (distance < bestDistance) {
        bestDistance = distance;
        best = bracket;
      }
    }

    return bestDistance <= 4 ? best : null;
  }

  function lineNumberAt(text, position) {
    var line = 1;
    var end = Math.min(position, text.length);
    for (var i = 0; i < end; i++) {
      if (text.charCodeAt(i) === 10) line++;
    }
    return line;
  }

  function clearBracketFocus() {
    if (!bracketFocus.active) return;

    var marked = els.output.querySelectorAll('.bracket-match');
    for (var i = 0; i < marked.length; i++) {
      marked[i].classList.remove('bracket-match');
    }

    var scoped = els.output.querySelectorAll('.bracket-scope-token');
    for (var j = 0; j < scoped.length; j++) {
      scoped[j].classList.remove('bracket-scope-token');
    }

    els.output.style.removeProperty('--active-bracket-color');
    bracketFocus.active = false;
    bracketFocus.openIndex = -1;
    bracketFocus.closeIndex = -1;
    bracketFocus.depth = 0;
  }

  function scrollOutputToBracket(element) {
    if (!element) return;

    if (state.view !== 'text') setView('text');

    var scrollBox = els.outputScroll.getBoundingClientRect();
    var box = element.getBoundingClientRect();
    var lineHeight = 22;

    els.outputScroll.scrollTop +=
      (box.top - scrollBox.top) -
      (scrollBox.height - lineHeight) / 2;
    els.outputScroll.scrollLeft +=
      (box.left - scrollBox.left) -
      (scrollBox.width - Math.min(box.width, 120)) / 2;
  }

  function activateBracketPair(scan, openIndex, shouldScroll) {
    var open = scan.brackets[openIndex];
    if (!open || open.pair < 0) return false;

    var close = scan.brackets[open.pair];

    /* 括号可能在折叠区域或未渲染区，先展开/补齐再定位 */
    var openLineIndex = lineIndexAtOffset(open.start);
    var closeLineIndex = lineIndexAtOffset(close.start);
    if (openLineIndex >= 0) {
      ensureRendered(openLineIndex);
      ensureRendered(closeLineIndex);
      ensureLinesVisible([openLineIndex, closeLineIndex]);
    }

    var openEl = els.output.querySelector(
      '[data-bracket-index="' + open.index + '"]'
    );
    var closeEl = els.output.querySelector(
      '[data-bracket-index="' + close.index + '"]'
    );

    if (!openEl || !closeEl) return false;

    clearBracketFocus();

    var depth = open.depth % 8;
    els.output.style.setProperty('--active-bracket-color', 'var(--depth-' + depth + ')');

    openEl.classList.add('bracket-match');
    closeEl.classList.add('bracket-match');

    var tokens = els.output.querySelectorAll('[data-token-start]');
    for (var i = 0; i < tokens.length; i++) {
      var start = parseInt(tokens[i].getAttribute('data-token-start'), 10);
      if (start > open.start && start < close.start) {
        tokens[i].classList.add('bracket-scope-token');
      }
    }

    bracketFocus.active = true;
    bracketFocus.openIndex = open.index;
    bracketFocus.closeIndex = close.index;
    bracketFocus.depth = depth;

    if (shouldScroll) scrollOutputToBracket(openEl);

    var openLine = lineNumberAt(scan.text, open.start);
    var closeLine = lineNumberAt(scan.text, close.start);
    showToast(
      '已聚焦 ' + open.char + ' … ' + close.char +
      ' · 第 ' + openLine + (closeLine !== openLine ? '–' + closeLine : '') + ' 行'
    );

    return true;
  }

  function handleBracketClickFromOutput(event) {
    if (els.outputScroll.hidden || !state.output) return false;

    var offset = textOffsetAtPoint(els.output, event.clientX, event.clientY);
    if (offset === null) return false;

    var scan = scanBrackets(state.output);
    var bracket = bracketNearOffset(scan, offset);
    if (!bracket) return false;

    var openIndex = bracket.open ? bracket.index : bracket.pair;
    if (openIndex < 0) return false;

    if (bracketFocus.active && bracketFocus.openIndex === openIndex) {
      clearBracketFocus();
      showToast('已取消括号聚焦');
      return true;
    }

    var activated = activateBracketPair(scan, openIndex, false);
    if (!activated && state.output.length > MAX_HIGHLIGHT) {
      showToast('内容较大，括号聚焦仅在完整彩色模式下可用');
    }
    return activated;
  }

  function handleBracketClickFromInput() {
    if (!state.output) return false;
    if (state.stale) {
      if (!els.input.value.trim() || !syncOutputAfterReplace()) return false;
    }
    if (state.mode !== 'pretty' && state.mode !== 'minify') return false;

    var rawText = els.input.value;
    var rawScan = scanBrackets(rawText);
    var bracket = bracketNearOffset(rawScan, els.input.selectionStart || 0);
    if (!bracket) return false;

    var outputScan = scanBrackets(state.output);
    var mapped = outputScan.brackets[bracket.index];
    if (!mapped || mapped.char !== bracket.char) return false;

    var openIndex = mapped.open ? mapped.index : mapped.pair;
    if (openIndex < 0) return false;

    if (bracketFocus.active && bracketFocus.openIndex === openIndex) {
      clearBracketFocus();
      showToast('已取消括号聚焦');
      return true;
    }

    var activated = activateBracketPair(outputScan, openIndex, true);
    if (!activated && state.output.length > MAX_HIGHLIGHT) {
      showToast('内容较大，括号聚焦仅在完整彩色模式下可用');
    }
    return activated;
  }

  function renderOutput(text, highlight) {
    clearBracketFocus();

    els.outputScroll.scrollTop = 0;
    els.outputScroll.scrollLeft = 0;

    prepareFoldLines(text);

    var indent = getIndent();
    state.indentUnit = indent === '\t' ? 0 : indent;

    /* 行数过多时只按行着色：逐 token 的 span 会让大文档的构建和布局成倍变慢 */
    var tooManyLines = foldState.lineCount > MAX_RICH_LINES;
    var rich = highlight && !tooManyLines && text.length <= MAX_HIGHLIGHT;
    var coarse = highlight && !rich;

    var foldable = state.mode === 'pretty' &&
      text.length <= MAX_HIGHLIGHT &&
      foldState.lineCount <= MAX_FOLD_LINES;

    if (foldable) {
      bindFoldState(text);
    } else {
      resetFoldState();
    }

    var totalLines = foldState.lines.length;
    var lazy = totalLines > MAX_RENDER_LINES;

    var depths = ((rich || coarse) && !lazy) ? computeLineDepths(text) : null;
    var lines = null;

    if (rich) {
      lines = highlightJSON(text, depths);
    } else if (coarse && !lazy) {
      lines = highlightJSONCoarse(text, depths);
    } else if (!coarse && !lazy) {
      lines = foldState.lines.map(function (line) {
        return escapeHtml(line);
      });
    }

    var hasFolds = foldable && foldState.folds.length > 0;

    foldState.hasFolds = hasFolds;
    state.htmlLines = lines;
    state.lineDepths = depths;
    state.totalLines = totalLines;
    state.lineMode = rich ? 'rich' : (coarse ? 'coarse' : 'plain');

    /* 超大文档先只渲染前一段，滚动到底或跳转时再续渲染，避免一次插入几十万行 */
    var initial = Math.min(totalLines, MAX_RENDER_LINES);

    els.output.innerHTML = buildLinesHtml(0, initial, hasFolds);
    els.outputBody.classList.toggle('has-folds', hasFolds);

    state.renderedLines = initial;
    foldState.applied = new Array(initial);
    extendApplied(0, initial, hasFolds);

    renderOutputGutter(text, rich || coarse, depths, initial);
    state.gutterRows = els.outputGutter.children.length;

    updateRenderMoreBar();
    updateFoldButtons();
    syncOutputGutter();
  }

  /** 取第 index 行的高亮 HTML：小文档用预生成结果，超大文档按行现算。 */
  function lineContentAt(index) {
    if (state.htmlLines) return state.htmlLines[index];

    var line = foldState.lines[index] || '';

    if (state.lineMode === 'coarse') {
      var spaces = /^[ \t]*/.exec(line)[0];
      var depth = 0;

      if (spaces.indexOf('\t') >= 0) {
        depth = spaces.length;
      } else {
        var unit = state.indentUnit > 0 ? state.indentUnit : 2;
        depth = Math.floor(spaces.length / unit);
      }

      return '<span class="coarse-line depth-' + (depth % 8) + '">' +
        escapeHtml(line) + '</span>';
    }

    return escapeHtml(line);
  }

  function buildLineHtml(index, hasFolds) {
    var fold = hasFolds ? foldState.byLine[index] : null;
    var collapsed = !!(fold && foldState.collapsed[fold.key]);
    var hiddenLine = hasFolds && !!foldState.hidden[index];
    var chip = '';

    if (fold) {
      chip = '<span class="fold-chip' + (collapsed ? ' is-visible' : '') +
        '" data-fold-chip="' + fold.key +
        '" data-summary="' + escapeHtml(foldSummaryText(fold)) + '"></span>';
    }

    return '<div class="ol' + (hiddenLine ? ' is-folded' : '') +
      '" data-line="' + index + '" data-start="' + (foldState.lineStarts[index] || 0) + '">' +
      lineContentAt(index) + chip + '</div>';
  }

  function buildLinesHtml(from, to, hasFolds) {
    var html = '';

    for (var i = from; i < to; i++) html += buildLineHtml(i, hasFolds);

    return html;
  }

  function extendApplied(from, to, hasFolds) {
    for (var i = from; i < to; i++) {
      foldState.applied[i] = hasFolds && !!foldState.hidden[i];
    }
  }

  /** 把 [from, to) 行的 HTML 追加到结果区（分段渲染与跳转按需扩展共用）。 */
  function appendRenderRange(from, to) {
    var total = state.totalLines;
    if (!total) return;

    to = Math.min(to, total);
    if (from >= to) return;

    els.output.insertAdjacentHTML('beforeend',
      buildLinesHtml(from, to, foldState.hasFolds));

    if (state.gutterRows > 0) {
      els.outputGutter.insertAdjacentHTML('beforeend',
        buildGutterHtml(from, to, state.lineDepths));
      state.gutterRows += (to - from);
    }

    extendApplied(from, to, foldState.hasFolds);

    if (!findBars.right.layer.hidden) appendOverlayRange(from, to);

    state.renderedLines = to;

    updateRenderMoreBar();
    syncOutputGutter();
  }

  /** 跳转/查找落到未渲染的行时，先把结果扩展到那一行。 */
  function ensureRendered(lineIndex) {
    if (!state.totalLines || lineIndex < state.renderedLines) return false;

    var target = Math.min(state.totalLines, lineIndex + 1);
    var chunkEnd = Math.min(
      state.totalLines,
      Math.max(target, state.renderedLines + RENDER_CHUNK)
    );

    appendRenderRange(state.renderedLines, chunkEnd);
    return true;
  }

  function updateRenderMoreBar() {
    var total = state.totalLines;
    var shown = state.renderedLines;

    if (!els.renderMore) return;

    if (state.view === 'tree' || total <= shown) {
      els.renderMore.hidden = true;
      return;
    }

    els.renderMore.hidden = false;
    els.renderMoreText.textContent =
      '已渲染 ' + shown.toLocaleString('zh-CN') + ' / ' +
      total.toLocaleString('zh-CN') + ' 行';
  }

  function updateOutputMeta() {
    if (!state.output) {
      els.outputMeta.textContent = '';
      return;
    }

    var labels = {
      pretty: '已格式化',
      minify: '已压缩',
      escape: '已转义',
      unescape: '已去转义',
      plain: '结果'
    };

    var parts = [state.stale ? '输入已修改' : labels[state.mode] || '结果'];
    parts.push((foldState.lineCount || state.output.split('\n').length) + ' 行');
    parts.push(formatBytes(byteLength(state.output)));

    if ((state.mode === 'pretty' || state.mode === 'minify')) {
      if (state.output.length > MAX_HIGHLIGHT) {
        parts.push('层级纯色模式');
      } else if (foldState.lineCount > MAX_RICH_LINES) {
        parts.push('大内容模式 · 仅按行着色');
      }
    }

    els.outputMeta.textContent = parts.join(' · ');
  }

  /* ---------------- 树形视图 ---------------- */

  function treeSpan(className, text) {
    var span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
  }

  function renderTree(node) {
    var container = els.treeView;
    container.innerHTML = '';
    state.treeDirty = false;

    if (!node) {
      var notice = document.createElement('div');
      notice.className = 'tree-notice';
      notice.textContent = '当前结果不是有效 JSON，无法生成树形视图。';
      container.appendChild(notice);
      return;
    }

    var count = 0;
    var truncated = false;
    var sortKeys = els.sortKeys.checked;

    function build(value, keyRaw, level) {
      if (count >= TREE_LIMIT || level > 120) {
        truncated = true;
        return null;
      }
      count++;

      var isContainer = value.type === 'object' || value.type === 'array';

      if (!isContainer) {
        var leaf = document.createElement('div');
        leaf.className = 'tree-leaf depth-' + (level % 8);

        if (keyRaw !== null) {
          leaf.appendChild(treeSpan('t-key', keyRaw));
          leaf.appendChild(treeSpan('t-colon', ':'));
        }

        var raw = value.raw;
        var preview = raw.length > 260 ? raw.slice(0, 260) + ' …' : raw;
        var leafClass = 't-number';
        if (value.type === 'string') leafClass = 't-string';
        else if (value.type === 'literal') leafClass = raw === 'null' ? 't-null' : 't-boolean';

        var valueSpan = treeSpan(leafClass, preview);
        if (preview !== raw) valueSpan.title = raw;
        leaf.appendChild(valueSpan);
        return leaf;
      }

      var details = document.createElement('details');
      details.className = 'depth-' + (level % 8);
      if (level <= 1) details.open = true;

      var summary = document.createElement('summary');
      if (keyRaw !== null) {
        summary.appendChild(treeSpan('t-key', keyRaw));
        summary.appendChild(treeSpan('t-colon', ':'));
      }

      if (value.type === 'object') {
        summary.appendChild(treeSpan('t-brace', '{'));
        summary.appendChild(treeSpan('t-count', value.entries.length + ' 个键'));
        summary.appendChild(treeSpan('t-brace', '}'));
      } else {
        summary.appendChild(treeSpan('t-brace', '['));
        summary.appendChild(treeSpan('t-count', value.items.length + ' 项'));
        summary.appendChild(treeSpan('t-brace', ']'));
      }

      details.appendChild(summary);

      var children = document.createElement('div');
      children.className = 'tree-children';

      var list;
      if (value.type === 'object') {
        list = value.entries.map(function (entry) {
          return { key: entry.key, keyRaw: entry.keyRaw, value: entry.value };
        });
        if (sortKeys) {
          list.sort(function (a, b) {
            if (a.key === b.key) return 0;
            return a.key < b.key ? -1 : 1;
          });
        }
      } else {
        list = value.items.map(function (item) {
          return { key: null, keyRaw: null, value: item };
        });
      }

      for (var i = 0; i < list.length; i++) {
        var child = build(list[i].value, list[i].keyRaw, level + 1);
        if (!child) break;
        children.appendChild(child);
      }

      if (children.childNodes.length) details.appendChild(children);
      return details;
    }

    var root = build(node, null, 0);
    if (root) container.appendChild(root);

    if (truncated) {
      var truncatedNotice = document.createElement('div');
      truncatedNotice.className = 'tree-notice';
      truncatedNotice.textContent =
        '数据量较大，仅渲染前 ' + count + ' 个节点。可切换回「格式化」查看完整文本。';
      container.appendChild(truncatedNotice);
    }
  }

  function setView(view) {
    state.view = view;
    var isTree = view === 'tree';

    els.textTab.classList.toggle('is-active', !isTree);
    els.textTab.setAttribute('aria-selected', String(!isTree));
    els.treeTab.classList.toggle('is-active', isTree);
    els.treeTab.setAttribute('aria-selected', String(isTree));

    els.outputScroll.hidden = isTree;
    els.outputGutterWrap.hidden = isTree;
    els.treeView.hidden = !isTree;

    if (isTree && state.treeDirty) {
      renderTree(state.node);
    }

    updateFoldButtons();
    updateRenderMoreBar();

    if (!isTree) {
      window.requestAnimationFrame(syncOutputGutter);
    }
  }

  /* ---------------- 状态切换 ---------------- */

  function resetResultState() {
    state.node = null;
    state.output = '';
    state.stats = null;
    state.mode = 'pretty';
    state.view = 'text';
    state.stale = false;
    state.treeDirty = true;
    state.error = null;
    state.errorLine = null;
    els.outputBody.hidden = true;
    els.outputBody.scrollTop = 0;
    els.outputBody.classList.remove('has-folds');
    els.output.innerHTML = '';
    els.outputGutter.innerHTML = '';
    resetFoldState();

    state.renderedLines = 0;
    state.totalLines = 0;
    state.gutterRows = 0;
    state.htmlLines = null;
    state.lineDepths = null;

    if (els.renderMore) els.renderMore.hidden = true;
    els.emptyState.hidden = false;
    els.errorState.hidden = true;
    els.gotoErrorBtn.hidden = true;
    els.errorSnippet.textContent = '';
    els.outputMeta.textContent = '';
    findState.rightSyncError = false;
    setView('text');
    updateGutter(true);
  }

  function buildSnippet(source, line, column) {
    var lines = source.split('\n');
    var lineText = lines[line - 1] || '';
    lineText = lineText.replace(/\r$/, '');

    var colIndex = Math.max(0, column - 1);
    var start = Math.max(0, colIndex - 38);
    var end = Math.min(lineText.length, start + 104);
    if (end === lineText.length) start = Math.max(0, end - 104);

    var excerpt = lineText.slice(start, end).replace(/\t/g, '  ');
    var prefix = start > 0 ? '…' : '';
    var suffix = end < lineText.length ? '…' : '';
    var before = lineText.slice(start, colIndex).replace(/\t/g, '  ');
    var caretOffset = (start > 0 ? 1 : 0) + before.length;

    var label = String(line) + ' | ';
    var caretLine = new Array(label.length + 1).join(' ');
    return label + prefix + excerpt + suffix + '\n' + caretLine + new Array(caretOffset + 1).join(' ') + '^';
  }

  function showParseError(err) {
    state.error = err;
    state.errorLine = err.line;
    state.node = null;
    state.output = '';
    state.stats = null;
    state.stale = false;
    state.treeDirty = true;

    els.outputBody.hidden = true;
    els.emptyState.hidden = true;
    els.errorState.hidden = false;
    els.errorMessage.textContent = err.message;
    els.errorLoc.textContent = '第 ' + err.line + ' 行，第 ' + err.column + ' 列';
    els.errorSnippet.textContent = buildSnippet(err.source || els.input.value, err.line, err.column);
    els.gotoErrorBtn.hidden = !err.position && err.position !== 0;
    els.outputMeta.textContent = '';

    setStatus('invalid', '第 ' + err.line + ' 行第 ' + err.column + ' 列 · ' + err.message);
    els.status.title = err.message + '（第 ' + err.line + ' 行，第 ' + err.column + ' 列）';

    updateGutter(true);
    if (findIsOpen()) refreshFindAfterChange(0, true);
  }

  function showSimpleError(message) {
    state.error = { message: message };
    state.errorLine = null;
    state.node = null;
    state.output = '';
    state.stats = null;
    state.stale = false;
    state.treeDirty = true;

    els.outputBody.hidden = true;
    els.emptyState.hidden = true;
    els.errorState.hidden = false;
    els.errorMessage.textContent = message;
    els.errorLoc.textContent = '工具提示';
    els.errorSnippet.textContent = '';
    els.gotoErrorBtn.hidden = true;
    els.outputMeta.textContent = '';

    setStatus('invalid', message);
    updateGutter(true);
    if (findIsOpen()) refreshFindAfterChange(0, true);
  }

  function clearShownError() {
    if (!state.error) return;

    state.error = null;
    state.errorLine = null;
    els.errorState.hidden = true;
    els.gotoErrorBtn.hidden = true;
    els.errorSnippet.textContent = '';
    els.emptyState.hidden = !!state.output;
    els.outputBody.hidden = !state.output;

    if (state.output) {
      setView(state.view);
    }

    updateGutter(true);
    updateOutputMeta();
  }

  function applyResult(node, output, meta) {
    state.node = node;
    state.output = output;
    state.mode = meta.mode || 'pretty';
    state.stats = meta.stats || TOOLS.analyze(node);
    state.stale = false;
    state.treeDirty = true;
    state.error = null;
    state.errorLine = null;

    els.emptyState.hidden = true;
    els.errorState.hidden = true;
    els.gotoErrorBtn.hidden = true;
    els.outputBody.hidden = false;

    renderOutput(output, true);
    updateGutter(true);
    updateOutputMeta();

    if (state.view === 'tree') {
      renderTree(node);
    }

    setView(state.view);
  }

  function applyPlainResult(text, meta) {
    state.node = null;
    state.output = text;
    state.mode = meta.mode || 'plain';
    state.stats = null;
    state.stale = false;
    state.treeDirty = true;
    state.error = null;
    state.errorLine = null;

    els.emptyState.hidden = true;
    els.errorState.hidden = true;
    els.gotoErrorBtn.hidden = true;
    els.outputBody.hidden = false;

    renderOutput(text, false);
    updateGutter(true);
    updateOutputMeta();

    if (state.view === 'tree') {
      setView('text');
    } else {
      setView(state.view);
    }
  }

  /* ---------------- 核心操作 ---------------- */

  function doFormat(options) {
    options = options || {};
    var text = els.input.value;

    if (!text.trim()) {
      if (!options.silent) {
        showToast('请先输入 JSON 内容');
        els.input.focus();
      }
      setStatus('neutral', '等待输入');
      return false;
    }

    var started = now();

    try {
      var node = TOOLS.parse(text);
      var stats = TOOLS.analyze(node);
      var output = TOOLS.serialize(node, {
        indent: getIndent(),
        sortKeys: els.sortKeys.checked
      });
      var elapsed = now() - started;

      applyResult(node, output, { mode: 'pretty', stats: stats });
      findState.rightSyncError = false;
      refreshFindAfterOutputChange();
      setStatus('valid', '已格式化 · ' + formatMs(elapsed) + ' · ' + stats.nodes + ' 个节点');

      if (!options.silent) showToast('格式化完成');
      return true;
    } catch (err) {
      if (err instanceof TOOLS.JSONParseError) {
        if (options.background) {
          setStatus('invalid', '第 ' + err.line + ' 行第 ' + err.column + ' 列 · ' + err.message);
          return false;
        }
        showParseError(err);
        return false;
      }

      if (options.background) {
        setStatus('invalid', err && err.message ? err.message : '格式化失败');
        return false;
      }

      showSimpleError(err && err.message ? err.message : '格式化失败');
      return false;
    }
  }

  function doMinify() {
    var text = els.input.value;

    if (!text.trim()) {
      showToast('请先输入 JSON 内容');
      els.input.focus();
      return;
    }

    try {
      var result = TOOLS.minify(text, { sortKeys: els.sortKeys.checked });
      var before = byteLength(text);
      var after = byteLength(result.output);
      var saved = before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;

      applyResult(result.node, result.output, { mode: 'minify', stats: result.stats });
      setView('text');
      findState.rightSyncError = false;
      refreshFindAfterOutputChange();
      setStatus('valid', '已压缩 · ' + formatBytes(before) + ' → ' + formatBytes(after) + '（减少 ' + saved + '%）');
      showToast('已压缩，体积减少 ' + saved + '%');
    } catch (err) {
      if (err instanceof TOOLS.JSONParseError) {
        showParseError(err);
      } else {
        showSimpleError(err && err.message ? err.message : '压缩失败');
      }
    }
  }

  function validateOnly() {
    var text = els.input.value;

    if (!text.trim()) {
      setStatus('neutral', '等待输入');
      els.input.focus();
      return;
    }

    try {
      var node = TOOLS.parse(text);
      var stats = TOOLS.analyze(node);

      if (state.error) clearShownError();
      state.errorLine = null;
      updateGutter(true);

      setStatus('valid', validStatusText(stats));
      showToast(stats.duplicates ? 'JSON 语法正确（存在重复键）' : 'JSON 语法正确');
    } catch (err) {
      if (err instanceof TOOLS.JSONParseError) {
        showParseError(err);
      } else {
        showSimpleError(err && err.message ? err.message : '校验失败');
      }
    }
  }

  function getSelectedOrAll() {
    var start = els.input.selectionStart || 0;
    var end = els.input.selectionEnd || 0;
    return end > start ? els.input.value.slice(start, end) : els.input.value;
  }

  function doEscape() {
    var source = getSelectedOrAll();

    if (!source.trim()) {
      showToast('请先输入要转义的文本');
      els.input.focus();
      return;
    }

    try {
      var output = TOOLS.escapeString(source);
      var node = TOOLS.parse(output);
      applyResult(node, output, { mode: 'escape', stats: TOOLS.analyze(node) });
      setView('text');
      findState.rightSyncError = false;
      refreshFindAfterOutputChange();
      setStatus('info', '已转义为 JSON 字符串 · ' + source.length + ' 个字符');
      showToast('已转义，结果在右侧');
    } catch (err) {
      showSimpleError(err && err.message ? err.message : '转义失败');
    }
  }

  function doUnescape() {
    var source = getSelectedOrAll();

    if (!source.trim()) {
      showToast('请先输入带转义的文本');
      els.input.focus();
      return;
    }

    var result;

    try {
      result = TOOLS.unescapeString(source);
    } catch (err) {
      if (err instanceof TOOLS.JSONParseError) {
        showParseError(err);
      } else {
        showSimpleError(err && err.message ? err.message : '去转义失败');
      }
      return;
    }

    var node = null;

    try {
      node = TOOLS.parse(result);
    } catch (err) {
      node = null;
    }

    if (node) {
      applyResult(node, result.trim(), { mode: 'unescape', stats: TOOLS.analyze(node) });
      setStatus('info', '已去转义 · 结果为有效 JSON');
    } else {
      applyPlainResult(result, { mode: 'unescape' });
      setStatus('info', '已去转义 · 结果为纯文本');
    }

    setView('text');
    findState.rightSyncError = false;
    refreshFindAfterOutputChange();
    showToast('已去转义');
  }

  function ensureResult() {
    if (state.output && !state.stale) return true;

    if (!els.input.value.trim()) {
      showToast('请先输入 JSON 内容');
      els.input.focus();
      return false;
    }

    return doFormat({ silent: true });
  }

  function copyResult() {
    if (!ensureResult()) return;

    var text = state.output;

    function fallback() {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '-9999px';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();

      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (err) {
        ok = false;
      }

      document.body.removeChild(area);
      showToast(ok ? '已复制到剪贴板' : '复制失败，请手动选择复制');
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('已复制到剪贴板');
      }, fallback);
    } else {
      fallback();
    }
  }

  function downloadResult() {
    if (!ensureResult()) return;

    var base = String(state.fileName || 'data.json').replace(/\.(json|txt)$/i, '') || 'data';
    var isPlain = !state.node;
    var suffix = isPlain ? '.txt' : state.mode === 'minify' ? '.min.json' : '.formatted.json';
    var type = isPlain ? 'text/plain;charset=utf-8' : 'application/json;charset=utf-8';

    var blob = new Blob([state.output], { type: type });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = base + suffix;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);

    showToast('已开始下载 ' + link.download);
  }

  /* ---------------- 输入事件 ---------------- */

  function insertTextAtCursor(text) {
    recordProgrammaticChange();

    var value = els.input.value;
    var start = els.input.selectionStart || 0;
    var end = els.input.selectionEnd || 0;
    els.input.value = value.slice(0, start) + text + value.slice(end);
    var caret = start + text.length;
    els.input.setSelectionRange(caret, caret);
    els.input.focus();
  }

  function scheduleDraftSave() {
    window.clearTimeout(timers.draft);
    timers.draft = window.setTimeout(saveDraft, 500);
  }

  function saveDraft() {
    if (els.input.value.length > 1000000) return;
    storageSet('draft', els.input.value);
  }

  /* ---------------- 撤销历史 ---------------- */

  function updateUndoButton() {
    var hasHistory = undoStack.length > 0;
    els.undoBtn.disabled = !hasHistory;
    els.undoBtn.title = hasHistory
      ? '撤销上一次文本修改 (Ctrl+Z)'
      : '没有可撤销的文本修改';
  }

  function pushUndoSnapshot(text, start, end) {
    var snapshotText = typeof text === 'string' ? text : els.input.value;
    var top = undoStack[undoStack.length - 1];

    if (top && top.text === snapshotText) return;

    undoStack.push({
      text: snapshotText,
      start: typeof start === 'number' ? start : (els.input.selectionStart || 0),
      end: typeof end === 'number' ? end : (els.input.selectionEnd || 0)
    });

    undoChars += snapshotText.length;

    while (
      undoStack.length > 1 &&
      (undoStack.length > UNDO_LIMIT || undoChars > UNDO_CHAR_LIMIT)
    ) {
      undoChars -= undoStack.shift().text.length;
    }

    updateUndoButton();
  }

  function recordProgrammaticChange() {
    pushUndoSnapshot(
      els.input.value,
      els.input.selectionStart || 0,
      els.input.selectionEnd || 0
    );
    historyIgnoreNext = true;
  }

  function finishProgrammaticChange() {
    historyIgnoreNext = false;
    historyBurst = false;
    historyLastAt = 0;
    historyLastText = els.input.value;
    historyLastStart = els.input.selectionStart || 0;
    historyLastEnd = els.input.selectionEnd || 0;
  }

  function noteInputChange() {
    if (historyIgnoreNext) {
      historyIgnoreNext = false;
      historyBurst = false;
      historyLastAt = 0;
      historyLastText = els.input.value;
      historyLastStart = els.input.selectionStart || 0;
      historyLastEnd = els.input.selectionEnd || 0;
      return;
    }

    if (historyLastText === els.input.value) return;

    var now = Date.now();

    if (!historyBurst || now - historyLastAt > 700) {
      pushUndoSnapshot(historyLastText, historyLastStart, historyLastEnd);
      historyBurst = true;
    }

    historyLastAt = now;
    historyLastText = els.input.value;
    historyLastStart = els.input.selectionStart || 0;
    historyLastEnd = els.input.selectionEnd || 0;
  }

  function initHistory() {
    undoStack = [];
    undoChars = 0;
    historyIgnoreNext = false;
    historyBurst = false;
    historyLastAt = 0;
    historyLastText = els.input.value;
    historyLastStart = els.input.selectionStart || 0;
    historyLastEnd = els.input.selectionEnd || 0;
    updateUndoButton();
  }

  function undoLastChange() {
    if (!undoStack.length) {
      showToast('没有可撤销的操作');
      updateUndoButton();
      return;
    }

    var snapshot = undoStack.pop();
    undoChars -= snapshot.text.length;

    var length = snapshot.text.length;
    var start = Math.min(snapshot.start, length);
    var end = Math.min(snapshot.end, length);

    els.input.value = snapshot.text;
    els.input.setSelectionRange(start, end);

    historyIgnoreNext = true;
    historyBurst = false;
    historyLastAt = 0;
    historyLastText = snapshot.text;
    historyLastStart = start;
    historyLastEnd = end;

    els.input.dispatchEvent(new Event('input', { bubbles: true }));

    var synced = syncOutputAfterReplace();
    if (findIsOpen()) {
      runFind({ anchorSide: 'left', preserve: true, noScroll: true });
    }

    updateUndoButton();
    if (synced) flashOutputSync();
    showToast('已撤销上一步');
    els.input.focus();
  }

  function clearInputErrorOnEdit() {
    if (!state.error) return;

    state.error = null;
    state.errorLine = null;
    els.errorState.hidden = true;
    els.gotoErrorBtn.hidden = true;
    els.errorSnippet.textContent = '';

    if (state.output) {
      els.emptyState.hidden = true;
      els.outputBody.hidden = false;
      setView(state.view);
    } else {
      els.emptyState.hidden = false;
      els.outputBody.hidden = true;
    }

    updateGutter(true);
  }

  function scheduleValidation() {
    window.clearTimeout(timers.validation);
    timers.validation = window.setTimeout(runValidation, 360);
  }

  function runValidation() {
    var text = els.input.value;

    if (!text.trim()) {
      setStatus('neutral', '等待输入');
      return;
    }

    if (text.length > 2000000) {
      setStatus('neutral', '内容较大 · 按 Ctrl+Enter 格式化');
      return;
    }

    var stats;

    try {
      stats = TOOLS.analyze(TOOLS.parse(text));
    } catch (err) {
      if (err instanceof TOOLS.JSONParseError) {
        setStatus('invalid', 'JSON 无效 · 第 ' + err.line + ' 行第 ' + err.column + ' 列');
        els.status.title = err.message;
      } else {
        setStatus('invalid', err && err.message ? err.message : 'JSON 无效');
      }
      return;
    }

    setStatus('valid', validStatusText(stats));

    if (els.autoFormat.checked) {
      if (text.length > 500000) {
        setStatus('neutral', '内容较大 · 自动格式化已暂停');
        return;
      }
      doFormat({ silent: true, background: true });
    }
  }

  function onInput() {
    noteInputChange();
    clearBracketFocus();

    updateInputMeta();
    updateGutter();
    updateCursor();
    scheduleDraftSave();
    clearInputErrorOnEdit();

    if (state.output) {
      state.stale = true;
      updateOutputMeta();
    }

    scheduleValidation();

    if (findIsOpen()) {
      scheduleFindUpdate({ anchorSide: 'left', preserve: true, noScroll: true });
      scheduleSearchOutputSync();
    }
  }

  function scheduleSearchOutputSync() {
    window.clearTimeout(timers.searchSync);

    if (!findIsOpen() || els.autoFormat.checked) return;
    if (els.input.value.length > 500000) return;

    timers.searchSync = window.setTimeout(function () {
      timers.searchSync = 0;

      if (!findIsOpen()) return;
      if (!els.input.value.trim()) return;

      syncOutputAfterReplace();
      runFind({
        anchorSide: 'left',
        preserve: true,
        selectLeft: false,
        scrollLeft: false,
        scrollRight: state.view === 'text'
      });
    }, 480);
  }

  /* ---------------- 文件 / 剪贴板 ---------------- */

  function afterProgrammaticInput() {
    els.input.scrollTop = 0;
    updateInputMeta();
    updateGutter(true);
    updateCursor();
    syncInputGutter();
    saveDraft();

    if (state.error) {
      state.error = null;
      state.errorLine = null;
      els.errorState.hidden = true;
      els.gotoErrorBtn.hidden = true;
    }

    if (findIsOpen()) refreshFindAfterChange(0, true);
  }

  function readFile(file) {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast('文件超过 20 MB，暂不支持');
      return;
    }

    var reader = new FileReader();

    reader.onload = function () {
      var text = typeof reader.result === 'string' ? reader.result : '';
      recordProgrammaticChange();
      els.input.value = text;
      state.fileName = file.name || 'data.json';
      afterProgrammaticInput();

      var ok = doFormat({ silent: true });
      finishProgrammaticChange();
      if (ok) showToast('已导入 ' + state.fileName);
    };

    reader.onerror = function () {
      showToast('文件读取失败');
    };

    reader.readAsText(file, 'utf-8');
  }

  function pasteFromClipboard() {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      showToast('浏览器不支持读取剪贴板，请使用 Ctrl+V');
      return;
    }

    navigator.clipboard.readText().then(function (text) {
      if (!text) {
        showToast('剪贴板为空');
        return;
      }
      insertTextAtCursor(text);
      onInput();
    }, function () {
      showToast('读取剪贴板被拒绝，请使用 Ctrl+V');
    });
  }

  /* ---------------- 清空 / 示例 ---------------- */

  function clearAll() {
    if ((els.input.value.length > 200 || state.output) && !window.confirm('确定清空当前输入和结果吗？')) {
      return;
    }

    recordProgrammaticChange();
    els.input.value = '';
    state.fileName = 'data.json';
    resetResultState();
    setStatus('neutral', '等待输入');
    updateInputMeta();
    updateCursor();
    updateGutter(true);
    els.input.scrollTop = 0;
    syncInputGutter();
    saveDraft();
    if (findIsOpen()) refreshFindAfterChange(0, true);
    finishProgrammaticChange();
    els.input.focus();
  }

  function loadSample() {
    recordProgrammaticChange();
    els.input.value = SAMPLE;
    state.fileName = 'sample.json';
    afterProgrammaticInput();
    doFormat({ silent: true });
    finishProgrammaticChange();
    showToast('已载入示例 JSON');
  }

  /* ---------------- 主题 ---------------- */

  function updateThemeLabel(theme) {
    var next = theme === 'dark' ? '浅色' : '深色';
    els.themeToggle.title = '切换到' + next + '主题';
    els.themeToggle.setAttribute('aria-label', '切换到' + next + '主题');
  }

  function initTheme() {
    var theme = document.documentElement.getAttribute('data-theme');
    if (theme !== 'dark' && theme !== 'light') theme = 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeLabel(theme);
  }

  function toggleTheme() {
    var theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    storageSet('theme', theme);
    updateThemeLabel(theme);
  }

  /* ---------------- 分隔条 ---------------- */

  function applySplit(ratio) {
    if (window.innerWidth <= 1000) return;

    var rect = els.workspace.getBoundingClientRect();
    var divider = 16;
    var available = rect.width - divider;
    if (available <= 0) return;

    var min = Math.min(420, Math.max(280, available * 0.25));
    var left = Math.round(ratio * available);
    left = Math.max(min, Math.min(available - min, left));

    els.workspace.style.gridTemplateColumns = left + 'px ' + divider + 'px minmax(0, 1fr)';
    els.splitter.setAttribute('aria-valuenow', String(Math.round((left / available) * 100)));

    if (findIsOpen()) {
      window.requestAnimationFrame(syncFindLayer);
    }
  }

  function deckResize() {
    window.requestAnimationFrame(function () {
      applySplit(splitRatio);
    });
  }

  function setupSplitter() {
    var stored = Number(storageGet('split', 0.5));
    if (isFinite(stored) && stored > 0 && stored < 1) splitRatio = stored;

    els.splitter.addEventListener('pointerdown', function (event) {
      if (window.innerWidth <= 1000) return;
      isResizing = true;
      document.body.classList.add('is-resizing');
      if (els.splitter.setPointerCapture) els.splitter.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    els.splitter.addEventListener('pointermove', function (event) {
      if (!isResizing) return;

      var rect = els.workspace.getBoundingClientRect();
      var divider = 16;
      var available = rect.width - divider;
      if (available <= 0) return;

      var min = Math.min(420, Math.max(280, available * 0.25));
      var left = event.clientX - rect.left - 8;
      left = Math.max(min, Math.min(available - min, left));
      splitRatio = left / available;

      applySplit(splitRatio);
    });

    function stopResize() {
      if (!isResizing) return;
      isResizing = false;
      document.body.classList.remove('is-resizing');
      storageSet('split', splitRatio);
    }

    els.splitter.addEventListener('pointerup', stopResize);
    els.splitter.addEventListener('pointercancel', stopResize);

    els.splitter.addEventListener('keydown', function (event) {
      if (window.innerWidth <= 1000) return;

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        splitRatio += event.key === 'ArrowLeft' ? -0.02 : 0.02;
        splitRatio = Math.max(0.22, Math.min(0.78, splitRatio));
        applySplit(splitRatio);
        storageSet('split', splitRatio);
      } else if (event.key === 'Home') {
        event.preventDefault();
        splitRatio = 0.5;
        applySplit(splitRatio);
        storageSet('split', splitRatio);
      }
    });

    window.addEventListener('resize', deckResize);

    /* 视图隐藏期间容器宽度为 0，切回 JSON 时重新计算左右分栏 */
    document.addEventListener('toolbox:viewchange', function (event) {
      if (event.detail && event.detail.view === 'json') deckResize();
    });

    deckResize();
  }

  /* ---------------- 事件绑定 ---------------- */

  function setupPreferences() {
    var indent = String(storageGet('indent', '2'));
    if (indent === '2' || indent === '4' || indent === 'tab') {
      els.indentSelect.value = indent;
    }

    els.sortKeys.checked = !!storageGet('sortKeys', false);
    els.autoFormat.checked = !!storageGet('autoFormat', false);
    findState.caseSensitive = !!storageGet('findCase', false);
    findState.regex = !!storageGet('findRegex', false);
    updateFindOptionUI();
  }

  function bindEvents() {
    els.formatBtn.addEventListener('click', function () {
      doFormat();
    });

    els.undoBtn.addEventListener('click', undoLastChange);

    els.minifyBtn.addEventListener('click', doMinify);
    els.validateBtn.addEventListener('click', validateOnly);
    els.escapeBtn.addEventListener('click', doEscape);
    els.unescapeBtn.addEventListener('click', doUnescape);

    els.sampleBtn.addEventListener('click', loadSample);
    els.clearBtn.addEventListener('click', clearAll);
    els.copyBtn.addEventListener('click', copyResult);
    els.downloadBtn.addEventListener('click', downloadResult);

    els.uploadBtn.addEventListener('click', function () {
      els.fileInput.click();
    });

    els.fileInput.addEventListener('change', function () {
      var file = els.fileInput.files && els.fileInput.files[0];
      if (file) readFile(file);
      els.fileInput.value = '';
    });

    els.pasteBtn.addEventListener('click', pasteFromClipboard);

    function bindFindBar(side) {
      var bar = findBars[side];

      bar.toggle.addEventListener('click', function () {
        var isOpen = side === 'left' ? findState.openLeft : findState.openRight;
        if (!isOpen) {
          openFind(side, false);
        } else {
          bar.input.focus();
          bar.input.select();
        }
      });

      bar.input.addEventListener('input', function () {
        findState.query = bar.input.value;
        mirrorFindQuery(side);
        scheduleFindUpdate({ anchorSide: side, noScroll: true });
      });

      bar.input.addEventListener('keydown', function (event) {
        if (event.isComposing || event.keyCode === 229) return;

        if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          goToMatch(event.shiftKey ? -1 : 1);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          closeFind(side, true);
        }
      });

      bar.replaceInput.addEventListener('input', function () {
        findState.replacement = bar.replaceInput.value;
        mirrorFindReplacement(side);
      });

      bar.replaceInput.addEventListener('keydown', function (event) {
        if (event.isComposing || event.keyCode === 229) return;

        if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          replaceCurrentMatch(side);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          closeFind(side, true);
        }
      });

      bar.prev.addEventListener('click', function () {
        goToMatch(-1);
      });

      bar.next.addEventListener('click', function () {
        goToMatch(1);
      });

      bar.caseBtn.addEventListener('click', function () {
        findState.caseSensitive = !findState.caseSensitive;
        storageSet('findCase', findState.caseSensitive);
        updateFindOptionUI();
        runFind({ anchorSide: side, preserve: true, noScroll: true });
      });

      bar.regexBtn.addEventListener('click', function () {
        findState.regex = !findState.regex;
        storageSet('findRegex', findState.regex);
        updateFindOptionUI();
        runFind({ anchorSide: side, preserve: true, noScroll: true });
      });

      bar.close.addEventListener('click', function () {
        closeFind(side, true);
      });

      bar.replaceBtn.addEventListener('click', function () {
        replaceCurrentMatch(side);
      });

      bar.replaceAllBtn.addEventListener('click', function () {
        replaceAllMatches(side);
      });

      [
        bar.prev,
        bar.next,
        bar.caseBtn,
        bar.regexBtn,
        bar.replaceBtn,
        bar.replaceAllBtn
      ].forEach(function (button) {
        button.addEventListener('mousedown', function (event) {
          event.preventDefault();
        });
      });
    }

    bindFindBar('left');
    bindFindBar('right');

    els.input.addEventListener('click', handleInputFindClick);
    els.outputScroll.addEventListener('click', handleOutputFindClick);

    els.outputGutter.addEventListener('click', function (event) {
      var button = event.target && event.target.closest
        ? event.target.closest('.fold-btn')
        : null;

      if (!button) return;

      event.preventDefault();
      toggleFold(button.getAttribute('data-fold-key'));
    });

    els.themeToggle.addEventListener('click', toggleTheme);

    els.indentSelect.addEventListener('change', function () {
      storageSet('indent', els.indentSelect.value);
      if (state.output) doFormat({ silent: true });
    });

    els.sortKeys.addEventListener('change', function () {
      storageSet('sortKeys', els.sortKeys.checked);
      if (state.output) doFormat({ silent: true });
    });

    els.autoFormat.addEventListener('change', function () {
      storageSet('autoFormat', els.autoFormat.checked);
      if (els.autoFormat.checked) runValidation();
    });

    els.input.addEventListener('input', onInput);
    els.input.addEventListener('scroll', syncInputGutter);
    els.input.addEventListener('click', updateCursor);
    els.input.addEventListener('keyup', updateCursor);
    els.input.addEventListener('select', updateCursor);

    els.input.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      var unit = els.indentSelect.value === 'tab' ? '\t' : '  ';
      insertTextAtCursor(unit);
      onInput();
    });

    els.outputScroll.addEventListener('scroll', syncOutputGutter);

    els.textTab.addEventListener('click', function () {
      if (!state.output) {
        showToast(state.error ? '请先修复 JSON 语法错误' : '请先格式化 JSON');
        return;
      }
      setView('text');
    });

    els.treeTab.addEventListener('click', function () {
      if (!state.output) {
        showToast(state.error ? '请先修复 JSON 语法错误' : '请先格式化 JSON');
        return;
      }
      setView('tree');
    });

    els.expandBtn.addEventListener('click', function () {
      if (state.view === 'tree') {
        var nodes = els.treeView.querySelectorAll('details');
        for (var i = 0; i < nodes.length; i++) nodes[i].open = true;
        return;
      }

      unfoldAll();
    });

    if (els.renderMoreBtn) {
      els.renderMoreBtn.addEventListener('click', function () {
        appendRenderRange(state.renderedLines, state.renderedLines + RENDER_CHUNK);
      });
    }

    els.collapseBtn.addEventListener('click', function () {
      if (state.view === 'tree') {
        var nodes = els.treeView.querySelectorAll('details');
        for (var i = 0; i < nodes.length; i++) nodes[i].open = false;
        return;
      }

      foldAll();
    });

    els.gotoErrorBtn.addEventListener('click', function () {
      if (!state.error || typeof state.error.position !== 'number') return;

      var position = Math.min(Math.max(0, state.error.position), els.input.value.length);
      els.input.focus();
      els.input.setSelectionRange(position, Math.min(position + 1, els.input.value.length));

      var lineHeight = 22;
      els.input.scrollTop = Math.max(0, (state.error.line - 3) * lineHeight);
      syncInputGutter();
      updateCursor();
    });

    document.addEventListener('keydown', function (event) {
      if (event.isComposing) return;

      /* 仅在 JSON 视图激活时接管快捷键，避免劫持其它工具和浏览器默认行为 */
      if (window.Toolbox && !window.Toolbox.isActive('json')) return;

      var modifier = event.ctrlKey || event.metaKey;
      var activeElement = document.activeElement;
      var inFindField = findBars.left.bar.contains(activeElement) ||
        findBars.right.bar.contains(activeElement);

      if (modifier && !event.shiftKey && (event.key === 'z' || event.key === 'Z') && !inFindField) {
        event.preventDefault();
        undoLastChange();
        return;
      }

      var activeSide = findBars.right.bar.contains(document.activeElement) ? 'right' : 'left';

      if (modifier && !event.shiftKey && (event.key === 'f' || event.key === 'F')) {
        event.preventDefault();
        openFind(activeSide, false);
        return;
      }

      if (modifier && !event.shiftKey && (event.key === 'h' || event.key === 'H')) {
        event.preventDefault();
        openFind(activeSide, true);
        return;
      }

      if (event.key === 'Escape' && findIsOpen()) {
        event.preventDefault();
        closeAllFind(true);
        return;
      }

      if (event.key === 'Escape' && bracketFocus.active) {
        event.preventDefault();
        clearBracketFocus();
        return;
      }

      if (event.key === 'F3' && findIsOpen()) {
        event.preventDefault();
        goToMatch(event.shiftKey ? -1 : 1);
        return;
      }

      if (modifier && event.key === 'Enter') {
        event.preventDefault();
        doFormat();
        return;
      }

      if (modifier && event.shiftKey && (event.key === 'm' || event.key === 'M')) {
        event.preventDefault();
        doMinify();
      }
    });

    setupDropZone();
    setupSplitter();

    window.addEventListener('pagehide', saveDraft);
  }

  function setupDropZone() {
    var zone = els.dropZone;

    function hasFiles(event) {
      var types = event.dataTransfer && event.dataTransfer.types;
      if (!types) return false;
      for (var i = 0; i < types.length; i++) {
        if (types[i] === 'Files') return true;
      }
      return false;
    }

    ['dragenter', 'dragover'].forEach(function (type) {
      zone.addEventListener(type, function (event) {
        if (!hasFiles(event)) return;
        event.preventDefault();
        event.stopPropagation();
        zone.classList.add('is-dragover');
      });
    });

    zone.addEventListener('dragleave', function (event) {
      if (!zone.contains(event.relatedTarget)) {
        zone.classList.remove('is-dragover');
      }
    });

    zone.addEventListener('drop', function (event) {
      event.preventDefault();
      event.stopPropagation();
      zone.classList.remove('is-dragover');

      var files = event.dataTransfer && event.dataTransfer.files;
      if (files && files.length) readFile(files[0]);
    });

    window.addEventListener('dragover', function (event) {
      if (hasFiles(event)) event.preventDefault();
    });

    window.addEventListener('drop', function (event) {
      if (hasFiles(event)) event.preventDefault();
    });
  }

  /* ---------------- 初始化 ---------------- */

  function init() {
    initTheme();
    setupPreferences();
    bindEvents();

    var draft = storageGet('draft', null);

    if (typeof draft === 'string') {
      els.input.value = draft;
    } else {
      els.input.value = SAMPLE;
    }

    updateInputMeta();
    updateGutter(true);
    updateCursor();
    syncInputGutter();

    if (els.input.value.trim()) {
      if (els.input.value.length <= 500000) {
        doFormat({ silent: true });
      } else {
        setStatus('neutral', '内容较大 · 按 Ctrl+Enter 格式化');
      }
    } else {
      resetResultState();
      setStatus('neutral', '等待输入');
    }

    if (typeof draft !== 'string') saveDraft();
    initHistory();
  }

  init();
})();
