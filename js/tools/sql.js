/* =========================================================
 * 工具：SQL 格式化 / 压缩 / 语法检查
 * 支持 16 种数据库方言（MySQL / 金仓 / 达梦 / PostgreSQL / Oracle …），
 * 输错会即时给出带行列号的诊断，输入时按当前方言提示关键字。
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;
  var SQL = window.SQLFormat;
  var Lint = window.SQLLint;
  var Dialects = window.SQLDialects;

  var SAMPLE = "select u.id, u.name, count(o.id) as order_count, sum(o.total) as total " +
    "from users u left join orders o on u.id = o.user_id " +
    "where u.created_at >= '2026-01-01' and o.status in ('paid', 'shipped') " +
    "group by u.id, u.name having count(o.id) > 0 order by total desc limit 20;";

  var SAMPLE_BY_DIALECT = {
    oracle: "select u.id, nvl(u.name, '匿名') as name, count(o.id) as cnt\n" +
      "  from users u, orders o\n" +
      " where u.id = o.user_id(+)\n" +
      "   and rownum <= 20\n" +
      " group by u.id, u.name\n" +
      " order by cnt desc",
    sqlserver: "select top (20) u.id, isnull(u.name, N'匿名') as name, count(o.id) as cnt\n" +
      "  from dbo.users u with (nolock)\n" +
      "  left join dbo.orders o on o.user_id = u.id\n" +
      " where u.created_at >= '2026-01-01'\n" +
      " group by u.id, u.name\n" +
      " order by cnt desc",
    postgresql: "select u.id, coalesce(u.name, '匿名') as name, count(o.id) as cnt\n" +
      "  from users u\n" +
      "  left join orders o on o.user_id = u.id\n" +
      " where u.created_at >= '2026-01-01'::date\n" +
      " group by u.id, u.name\n" +
      " order by cnt desc\n" +
      " limit 20",
    dm: "select rownum, u.id, nvl(u.name, '匿名') as name, count(o.id) as cnt\n" +
      "  from users u\n" +
      "  left join orders o on o.user_id = u.id\n" +
      " where u.created_at >= to_date('2026-01-01', 'yyyy-mm-dd')\n" +
      " group by u.id, u.name\n" +
      " order by cnt desc",
    kingbase: "select u.id, coalesce(u.name, '匿名') as name, count(o.id) as cnt\n" +
      "  from users u\n" +
      "  left join orders o on o.user_id = u.id\n" +
      " where u.created_at >= '2026-01-01'\n" +
      " group by u.id, u.name\n" +
      " order by cnt desc\n" +
      " fetch first 20 rows only",
    clickhouse: "select toDate(created_at) as day, uniqExact(user_id) as users\n" +
      "  from events\n" +
      " prewhere created_at >= today() - 7\n" +
      " group by day\n" +
      " order by day\n" +
      " limit 20"
  };

  /* ---------------- 方言下拉 ---------------- */

  function buildDialectSelect() {
    var select = ui.el('select', 't-select');
    select.setAttribute('aria-label', '数据库方言');
    select.title = '语法检查、着色与关键字提示都按所选数据库进行';

    if (!Dialects) {
      var option = ui.el('option', '', '通用 SQL');
      option.value = 'ansi';
      select.appendChild(option);
      return select;
    }

    var groups = [];
    var byGroup = Object.create(null);

    Dialects.LIST.forEach(function (item) {
      var groupName = item.group || '其它';

      if (!byGroup[groupName]) {
        byGroup[groupName] = document.createElement('optgroup');
        byGroup[groupName].label = groupName;
        groups.push(groupName);
      }

      var opt = ui.el('option', '', item.label + (item.version ? ' · ' + item.version : ''));
      opt.value = item.id;
      byGroup[groupName].appendChild(opt);
    });

    groups.forEach(function (name) {
      select.appendChild(byGroup[name]);
    });

    return select;
  }

  /* ---------------- 关键字候选 ---------------- */

  function buildCompleter(input, getDialect) {
    if (!window.Completer || !Dialects) return null;

    return window.Completer.attach(input, {
      minChars: 1,
      maxItems: 40,
      getCandidates: function (prefix) {
        var pack = Dialects.byId(getDialect());
        if (!pack) return [];

        var upper = prefix.toUpperCase();
        var seen = Object.create(null);
        var list = [];

        function collect(text, kind) {
          String(text || '').split(/\s+/).forEach(function (word) {
            if (!word) return;
            if (word.indexOf(upper) !== 0) return;
            if (seen[word]) return;
            seen[word] = true;
            list.push({ word: word, kind: kind });
          });
        }

        collect(pack.keywords, 'keyword');
        collect(pack.types, 'type');
        collect(pack.functions, 'function');

        return list;
      }
    });
  }

  function build() {
    var state = {
      dialect: 'mysql',
      autoDialect: true,
      check: true
    };

    /* 从上次的选择里恢复 */
    var storedDialect = ui.storageGet('sql:dialect', '');
    if (storedDialect && Dialects && Dialects.byId(storedDialect)) {
      state.dialect = Dialects.byId(storedDialect).id;
      state.autoDialect = false;
    }

    var root = ui.el('section', 't-page');
    root.appendChild(ui.head({
      icon: 'i-database',
      title: 'SQL 格式化',
      desc: '16 种数据库方言的格式化、压缩与语法检查：关键字提示、错误定位、方言差异提醒。',
      search: true
    }));

    /* ---------------- 工具栏 ---------------- */

    var toolbar = ui.el('div', 't-toolbar is-split');
    var options = ui.el('div', 't-options');

    var dialectSelect = buildDialectSelect();
    dialectSelect.value = state.dialect;

    var indentSelect = ui.el('select', 't-select');
    indentSelect.setAttribute('aria-label', '缩进');
    [['2', '2 个空格'], ['4', '4 个空格'], ['tab', 'Tab']].forEach(function (item) {
      var option = ui.el('option', '', item[1]);
      option.value = item[0];
      indentSelect.appendChild(option);
    });

    var caseSelect = ui.el('select', 't-select');
    caseSelect.setAttribute('aria-label', '关键字大小写');
    [['upper', '关键字大写'], ['lower', '关键字小写'], ['keep', '保持原样']].forEach(function (item) {
      var option = ui.el('option', '', item[1]);
      option.value = item[0];
      caseSelect.appendChild(option);
    });

    var removeBox = ui.checkbox('移除注释', {});
    var autoBox = ui.checkbox('自动识别方言', { checked: state.autoDialect });
    var checkBox = ui.checkbox('语法检查', { checked: state.check });

    options.appendChild(ui.field('方言', dialectSelect, '影响语法检查、着色与关键字提示'));
    options.appendChild(ui.field('缩进', indentSelect));
    options.appendChild(ui.field('关键字', caseSelect));
    options.appendChild(autoBox.label);
    options.appendChild(checkBox.label);
    options.appendChild(removeBox.label);
    toolbar.appendChild(options);

    var actions = ui.el('div', 't-actions');

    var history = ui.historyButtons(null);

    var searchBtn = ui.miniButton('查找', {
      icon: 'i-search',
      title: '在输入 / 结果中查找替换 (Ctrl+F)',
      onClick: function () { TB.find(); }
    });

    var sampleBtn = ui.el('button', 'btn btn-ghost btn-sm');
    sampleBtn.type = 'button';
    sampleBtn.textContent = '示例';
    sampleBtn.title = '按当前方言载入一段示例 SQL';

    var minifyBtn = ui.el('button', 'btn btn-ghost btn-sm');
    minifyBtn.type = 'button';
    minifyBtn.appendChild(ui.icon('i-shrink'));
    minifyBtn.appendChild(document.createTextNode('压缩'));

    var formatBtn = ui.el('button', 'btn btn-primary btn-sm');
    formatBtn.type = 'button';
    formatBtn.appendChild(ui.icon('i-sparkles'));
    formatBtn.appendChild(document.createTextNode('格式化'));

    actions.appendChild(history.node);
    actions.appendChild(searchBtn);
    actions.appendChild(sampleBtn);
    actions.appendChild(minifyBtn);
    actions.appendChild(formatBtn);
    toolbar.appendChild(actions);
    root.appendChild(toolbar);

    /* ---------------- 双栏 ---------------- */

    var cols = ui.el('div', 't-cols');

    /* 输入 */
    var inputCol = ui.el('section', 't-col');
    var inputArea = ui.textarea('在此粘贴 SQL…', { label: 'SQL 输入' });
    inputArea.classList.add('is-mono-big');

    var pasteBtn = ui.miniButton('粘贴', {
      icon: 'i-upload',
      onClick: function () {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          ui.toast('当前浏览器不允许读取剪贴板，请手动粘贴');
          return;
        }
        navigator.clipboard.readText().then(function (text) {
          if (window.TextHistory && window.TextHistory.of(inputArea)) {
            window.TextHistory.of(inputArea).record();
          }
          inputArea.value = text;
          doFormat();
        }, function () { ui.toast('读取剪贴板失败'); });
      }
    });

    var clearBtn = ui.miniButton('清空', {
      icon: 'i-trash',
      danger: true,
      onClick: function () {
        if (window.TextHistory && window.TextHistory.of(inputArea)) {
          window.TextHistory.of(inputArea).record();
        }
        inputArea.value = '';
        clearOutput('格式化结果将显示在这里');
        updateStats();
        refreshCheck();
      }
    });

    inputCol.appendChild(ui.colHead('输入', { badge: '0 行', actions: [pasteBtn, clearBtn] }));
    var inputBadge = inputCol.querySelector('.badge');
    var inputBody = ui.el('div', 't-col-body');
    inputBody.appendChild(inputArea);
    var inputStats = ui.el('div', 't-stats');
    inputBody.appendChild(inputStats);
    inputCol.appendChild(inputBody);

    /* 输出：彩色 + 行号 */
    var outputCol = ui.el('section', 't-col');
    var outputView = ui.codeView({
      language: 'sql',
      dialect: state.dialect,
      placeholder: '格式化结果将显示在这里'
    });

    var errorText = ui.el('p', 't-error');

    var dialectBadge = ui.el('span', 'badge', '');

    outputCol.appendChild(ui.colHead('输出', {
      badge: null,
      actions: [
        dialectBadge,
        ui.copyButton(function () { return outputView.getValue(); }, '复制')
      ]
    }));
    var outputBody = ui.el('div', 't-col-body');
    outputBody.appendChild(outputView.root);
    outputBody.appendChild(errorText);
    var outputStats = ui.el('div', 't-stats');
    outputBody.appendChild(outputStats);
    outputCol.appendChild(outputBody);

    cols.appendChild(inputCol);
    cols.appendChild(outputCol);
    root.appendChild(cols);

    /* ---------------- 语法检查面板 ---------------- */

    var checkPanel = ui.el('section', 'sql-check');
    var checkHead = ui.el('div', 'sql-check-head');

    var checkTitle = ui.el('div', 'sql-check-title');
    checkTitle.appendChild(ui.icon('i-shield'));
    checkTitle.appendChild(document.createTextNode('语法检查'));

    var summaryBadge = ui.el('span', 'sql-summary', '等待输入');

    var checkActions = ui.el('div', 't-col-actions');
    var checkBtn = ui.miniButton('重新检查', {
      icon: 'i-check-circle',
      title: '立即按当前方言检查一次',
      onClick: function () { refreshCheck(true); }
    });
    var jumpBtn = ui.miniButton('定位', {
      icon: 'i-search',
      title: '跳到光标所在行对应的第一个问题',
      onClick: function () { jumpToNearest(); }
    });
    checkActions.appendChild(checkBtn);
    checkActions.appendChild(jumpBtn);

    checkTitle.appendChild(summaryBadge);
    checkHead.appendChild(checkTitle);
    checkHead.appendChild(checkActions);

    var checkList = ui.el('div', 'sql-check-list');
    var checkEmpty = ui.el('div', 'sql-check-empty');
    checkEmpty.appendChild(ui.icon('i-check-circle'));
    checkEmpty.appendChild(ui.el('span', '', '未发现语法问题'));

    checkPanel.appendChild(checkHead);
    checkPanel.appendChild(checkList);
    checkPanel.appendChild(checkEmpty);
    root.appendChild(checkPanel);

    /* ---------------- 查找 ---------------- */

    var finder = null;

    function ensureFinder() {
      if (finder) return finder;

      finder = window.Finder.attach(root, {
        label: 'SQL 查找',
        scope: '输入 + 输出',
        targets: [
          inputArea,
          outputView.pre
        ],
        getText: function () { return outputView.getValue(); },
        onReplace: function (next) {
          /* 只读结果被替换后取消着色，避免高亮与文本错位 */
          outputView.setValue(next);
          updateStats(outputView.getValue());
        }
      });
      return finder;
    }

    /* ---------------- 逻辑 ---------------- */

    var historyRef = window.TextHistory ? window.TextHistory.attach(inputArea, {
      onChange: function () { history.sync(); }
    }) : null;

    if (historyRef) historyRef.onChange = function () { history.sync(); };
    TB.setHistoryTarget('sql', inputArea);

    var completer = buildCompleter(inputArea, function () { return state.dialect; });

    function indentValue() {
      var raw = indentSelect.value;
      return raw === 'tab' ? '\t' : Number(raw) || 2;
    }

    function clearOutput(placeholder) {
      outputView.setValue('');
      outputView.pre.classList.add('is-empty');
      outputView.pre.textContent = placeholder || '';
      outputStats.textContent = '';
    }

    function currentDialect() {
      return Dialects ? Dialects.byId(state.dialect) : null;
    }

    function syncDialectChrome() {
      var dialect = currentDialect();
      var label = dialect ? dialect.label : '通用 SQL';
      dialectBadge.textContent = label;
      dialectBadge.title = dialect && dialect.notes ? dialect.notes : label;
      outputView.setDialect(state.dialect);
    }

    function applyResult(result) {
      var text = result.text || '';
      outputView.setValue(text);

      if (!text) {
        outputView.pre.classList.add('is-empty');
        outputView.pre.textContent = '格式化结果将显示在这里';
      }

      outputStats.textContent = '';
      if (result.removedComments) {
        outputStats.appendChild(ui.el('span', 't-stat', '已移除 ' + result.removedComments + ' 处注释'));
      }

      updateStats(text);
      if (finder && finder.open) finder.execute(true);
    }

    function updateStats(outputText) {
      var source = inputArea.value;
      var inLines = source ? source.split('\n').length : 0;

      inputStats.textContent = '';
      inputStats.appendChild(ui.el('span', 't-stat', '输入 ' + inLines + ' 行 / ' + source.length + ' 字符'));
      if (inputBadge) inputBadge.textContent = inLines + ' 行';

      if (outputText !== undefined) {
        var outLines = outputText ? outputText.split('\n').length : 0;
        outputStats.textContent = '';
        outputStats.appendChild(ui.el('span', 't-stat', '输出 ' + outLines + ' 行 / ' + (outputText ? outputText.length : 0) + ' 字符'));
      }
    }

    function doFormat() {
      errorText.textContent = '';

      if (!inputArea.value.trim()) {
        clearOutput('格式化结果将显示在这里');
        updateStats('');
        refreshCheck();
        return;
      }

      try {
        var result = SQL.format(inputArea.value, {
          indent: indentValue(),
          keywordCase: caseSelect.value,
          removeComments: removeBox.input.checked,
          dialect: state.dialect
        });

        applyResult(result);
      } catch (err) {
        clearOutput('（格式化失败）');
        errorText.textContent = err.message;
      }

      refreshCheck();
    }

    function doMinify() {
      errorText.textContent = '';

      if (!inputArea.value.trim()) {
        clearOutput('格式化结果将显示在这里');
        updateStats('');
        refreshCheck();
        return;
      }

      try {
        var result = SQL.minify(inputArea.value, {
          keywordCase: caseSelect.value === 'keep' ? 'keep' : caseSelect.value,
          removeComments: removeBox.input.checked,
          dialect: state.dialect
        });

        applyResult(result);
      } catch (err) {
        clearOutput('（压缩失败）');
        errorText.textContent = err.message;
      }

      refreshCheck();
    }

    /* ---------------- 语法检查 ---------------- */

    var diagnostics = [];
    var mirror = null;

    function ensureMirror() {
      if (mirror) return mirror;
      if (!window.TextMirror) return null;
      mirror = window.TextMirror.attach(inputArea);
      return mirror;
    }

    function severityLabel(severity) {
      return (Lint && Lint.LABELS && Lint.LABELS[severity]) || severity;
    }

    function paintIssues() {
      var layer = ensureMirror();
      if (!layer) return;

      layer.setIssues(diagnostics.filter(function (item) {
        return item.severity !== 'hint';
      }).map(function (item) {
        return {
          start: item.start,
          end: item.end,
          severity: item.severity,
          message: item.message
        };
      }));
    }

    function refreshCheck(force) {
      if (!Lint) return;

      var enabled = checkBox.input.checked;
      checkPanel.hidden = !enabled;
      if (!enabled) {
        diagnostics = [];
        paintIssues();
        return;
      }

      var source = inputArea.value;

      if (!source.trim()) {
        diagnostics = [];
        renderDiagnostics([]);
        summaryBadge.textContent = '等待输入';
        summaryBadge.className = 'sql-summary';
        paintIssues();
        return;
      }

      /* 自动识别方言：只在用户没手动选过时生效 */
      if (state.autoDialect && Dialects) {
        var detected = Dialects.detect(source);
        if (detected && detected !== state.dialect && detected !== 'ansi') {
          state.dialect = detected;
          dialectSelect.value = detected;
          syncDialectChrome();
        }
      }

      var result;

      try {
        result = Lint.lint(source, { dialect: state.dialect });
      } catch (err) {
        summaryBadge.textContent = '检查失败';
        summaryBadge.className = 'sql-summary is-error';
        return;
      }

      diagnostics = result.diagnostics || [];

      var info = Lint.summary(result);
      summaryBadge.textContent = info.text;
      summaryBadge.className = 'sql-summary' +
        (info.errors ? ' is-error' : info.warnings ? ' is-warning' : '');

      renderDiagnostics(diagnostics);
      paintIssues();

      if (force) ui.toast(info.text);
    }

    function renderDiagnostics(list) {
      checkList.textContent = '';

      var visible = list.filter(function (item) {
        return item.severity !== 'hint';
      });

      checkEmpty.hidden = visible.length > 0;
      checkList.hidden = visible.length === 0;

      visible.forEach(function (item) {
        var row = ui.el('button', 'sql-diag is-' + item.severity);
        row.type = 'button';
        row.title = item.hint || item.message;

        row.appendChild(ui.el('span', 'sql-diag-sev', severityLabel(item.severity)));

        var text = ui.el('div', 'sql-diag-text');
        text.appendChild(ui.el('b', '', item.message));
        if (item.hint) text.appendChild(ui.el('small', '', item.hint));
        row.appendChild(text);

        row.appendChild(ui.el('span', 'sql-diag-pos', item.line + ':' + item.column));

        row.addEventListener('click', function () {
          revealOffset(item.start, item.end);
        });

        checkList.appendChild(row);
      });
    }

    function revealOffset(start, end) {
      inputArea.focus();

      var text = inputArea.value;
      var from = Math.max(0, Math.min(start, text.length));
      var to = Math.max(from, Math.min(end === undefined ? from : end, text.length));

      if (from === to && to < text.length) to = from + 1;

      try {
        inputArea.setSelectionRange(from, to);
      } catch (err) {
        /* 忽略 */
      }

      var before = text.slice(0, from);
      var line = before.split('\n').length - 1;
      var lineHeight = parseFloat(getComputedStyle(inputArea).lineHeight) || 20;
      inputArea.scrollTop = Math.max(0, line * lineHeight - inputArea.clientHeight / 2);

      var layer = window.TextMirror && window.TextMirror.of(inputArea);
      if (layer) layer.align();
    }

    /* 把光标所在行对应的第一个问题定位出来 */
    function jumpToNearest() {
      if (!diagnostics.length) {
        ui.toast('当前没有发现语法问题');
        return;
      }

      var caret = inputArea.selectionStart || 0;
      var list = diagnostics.filter(function (item) {
        return item.severity !== 'hint';
      });

      if (!list.length) list = diagnostics;

      var target = null;

      for (var i = 0; i < list.length; i++) {
        if (list[i].start >= caret) {
          target = list[i];
          break;
        }
      }

      if (!target) target = list[0];
      revealOffset(target.start, target.end);
    }

    /* ---------------- 事件 ---------------- */

    formatBtn.addEventListener('click', doFormat);
    minifyBtn.addEventListener('click', doMinify);
    indentSelect.addEventListener('change', doFormat);
    caseSelect.addEventListener('change', doFormat);
    removeBox.input.addEventListener('change', doFormat);

    dialectSelect.addEventListener('change', function () {
      state.dialect = dialectSelect.value;
      state.autoDialect = false;
      autoBox.input.checked = false;
      ui.storageSet('sql:dialect', state.dialect);
      syncDialectChrome();
      doFormat();
    });

    autoBox.input.addEventListener('change', function () {
      state.autoDialect = autoBox.input.checked;
      if (state.autoDialect) refreshCheck(true);
    });

    checkBox.input.addEventListener('change', function () {
      state.check = checkBox.input.checked;
      refreshCheck(true);
    });

    sampleBtn.addEventListener('click', function () {
      var sample = SAMPLE_BY_DIALECT[state.dialect] || SAMPLE;
      if (historyRef) historyRef.record();
      inputArea.value = sample;
      doFormat();
      ui.toast('已按 ' + (currentDialect() ? currentDialect().label : '通用 SQL') + ' 载入示例');
    });

    /* 输入变化：同步统计、自动格式化预览与语法检查 */
    var checkLater = ui.debounce(function () { refreshCheck(); }, 320);

    inputArea.addEventListener('input', function () {
      updateStats(outputView.getValue());
      checkLater();
    });

    /* ---------------- 首屏 ---------------- */

    syncDialectChrome();
    inputArea.value = SAMPLE;
    doFormat();
    refreshCheck();

    return {
      root: root,
      format: doFormat,
      find: function (options) {
        return ensureFinder().show(options && options.replace);
      },
      setDialect: function (id) {
        if (!Dialects) return;
        state.dialect = Dialects.byId(id).id;
        state.autoDialect = false;
        autoBox.input.checked = false;
        dialectSelect.value = state.dialect;
        syncDialectChrome();
        doFormat();
      },
      check: function () { refreshCheck(true); },
      destroy: function () {
        if (completer) completer.destroy();
      }
    };
  }

  var instance = null;

  TB.register({
    id: 'sql',
    group: '数据格式',
    title: 'SQL 格式化',
    desc: '多方言 SQL 美化 / 压缩 / 语法检查，含关键字提示',
    icon: 'i-database',
    keywords: ['sql', 'mysql', 'postgres', 'oracle', 'kingbase', 'dameng', 'dm', 'clickhouse', 'hive',
      'format', 'beautify', 'minify', 'lint', '格式化', '语法检查', '金仓', '达梦'],
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], label: '格式化' },
      { keys: ['Ctrl', 'F'], label: '查找替换' },
      { keys: ['Ctrl', 'Z'], label: '撤销' },
      { keys: ['Ctrl', 'Space'], label: '关键字提示' }
    ],
    run: function () {
      if (instance) instance.format();
    },
    find: function (options) {
      if (instance) return instance.find(options);
      return false;
    },
    mount: function (host) {
      instance = build();
      host.appendChild(instance.root);
    },
    destroy: function () {
      if (instance && instance.destroy) instance.destroy();
    }
  });
})();
