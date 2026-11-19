/* =========================================================
 * 工具：SQL 格式化 / 压缩
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;
  var SQL = window.SQLFormat;

  var SAMPLE = "select u.id, u.name, count(o.id) as order_count, sum(o.total) as total " +
    "from users u left join orders o on u.id = o.user_id " +
    "where u.created_at >= '2026-01-01' and o.status in ('paid', 'shipped') " +
    "group by u.id, u.name having count(o.id) > 0 order by total desc limit 20;";

  function build() {
    var root = ui.el('section', 'view');
    root.appendChild(ui.head({
      icon: 'i-database',
      title: 'SQL 格式化',
      desc: '把紧凑的 SQL 排成可读的多行格式，或压缩为一行；正确处理字符串、注释与引号标识符。'
    }));

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');

    var indentSelect = ui.el('select', 't-select');
    indentSelect.setAttribute('aria-label', '缩进');
    [['2', '2 个空格'], ['4', '4 个空格']].forEach(function (item) {
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

    options.appendChild(ui.field('缩进', indentSelect));
    options.appendChild(ui.field('关键字', caseSelect));
    options.appendChild(removeBox.label);
    toolbar.appendChild(options);

    var actions = ui.el('div', 't-actions');

    var formatBtn = ui.el('button', 'btn btn-primary btn-sm');
    formatBtn.type = 'button';
    formatBtn.appendChild(ui.icon('i-sparkles'));
    formatBtn.appendChild(document.createTextNode('格式化'));

    var minifyBtn = ui.el('button', 'btn btn-ghost btn-sm');
    minifyBtn.type = 'button';
    minifyBtn.appendChild(ui.icon('i-shrink'));
    minifyBtn.appendChild(document.createTextNode('压缩'));

    var sampleBtn = ui.el('button', 'btn btn-ghost btn-sm');
    sampleBtn.type = 'button';
    sampleBtn.textContent = '示例';

    actions.appendChild(sampleBtn);
    actions.appendChild(minifyBtn);
    actions.appendChild(formatBtn);
    toolbar.appendChild(actions);
    root.appendChild(toolbar);

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
          inputArea.value = text;
          doFormat();
        }, function () { ui.toast('读取剪贴板失败'); });
      }
    });
    var clearBtn = ui.miniButton('清空', {
      icon: 'i-trash',
      danger: true,
      onClick: function () {
        inputArea.value = '';
        outputArea.textContent = '';
        errorText.textContent = '';
        updateStats();
      }
    });

    inputCol.appendChild(ui.colHead('输入', { actions: [pasteBtn, clearBtn] }));
    var inputBody = ui.el('div', 't-col-body');
    inputBody.appendChild(inputArea);
    var inputStats = ui.el('div', 't-stats');
    inputBody.appendChild(inputStats);
    inputCol.appendChild(inputBody);

    /* 输出 */
    var outputCol = ui.el('section', 't-col');
    var outputArea = ui.el('pre', 't-result is-empty', '格式化结果将显示在这里');
    var errorText = ui.el('p', 't-error');

    outputCol.appendChild(ui.colHead('输出', {
      actions: [ui.copyButton(function () { return outputArea.textContent; }, '复制')]
    }));
    var outputBody = ui.el('div', 't-col-body');
    outputBody.appendChild(outputArea);
    outputBody.appendChild(errorText);
    var outputStats = ui.el('div', 't-stats');
    outputBody.appendChild(outputStats);
    outputCol.appendChild(outputBody);

    cols.appendChild(inputCol);
    cols.appendChild(outputCol);
    root.appendChild(cols);

    /* ---------------- 逻辑 ---------------- */

    function applyResult(result) {
      outputArea.textContent = result.text || '';
      outputArea.classList.toggle('is-empty', !result.text);
      outputArea.style.whiteSpace = 'pre';

      if (result.removedComments) {
        outputStats.textContent = '';
        outputStats.appendChild(ui.el('span', 't-stat', '已移除 ' + result.removedComments + ' 处注释'));
      } else {
        outputStats.textContent = '';
      }

      updateStats(outputArea.textContent);
    }

    function updateStats(outputText) {
      var source = inputArea.value;
      inputStats.textContent = '';
      inputStats.appendChild(ui.el('span', 't-stat', '输入 ' + source.split('\n').length + ' 行 / ' + source.length + ' 字符'));

      if (outputText !== undefined) {
        outputStats.textContent = '';
        outputStats.appendChild(ui.el('span', 't-stat', '输出 ' + (outputText ? outputText.split('\n').length : 0) + ' 行 / ' + (outputText ? outputText.length : 0) + ' 字符'));
      }
    }

    function doFormat() {
      errorText.textContent = '';

      if (!inputArea.value.trim()) {
        outputArea.textContent = '';
        outputArea.classList.add('is-empty');
        updateStats('');
        return;
      }

      try {
        var result = SQL.format(inputArea.value, {
          indent: Number(indentSelect.value) || 2,
          keywordCase: caseSelect.value,
          removeComments: removeBox.input.checked
        });

        applyResult(result);
      } catch (err) {
        outputArea.textContent = '';
        outputArea.classList.add('is-empty');
        errorText.textContent = err.message;
        updateStats('');
      }
    }

    function doMinify() {
      errorText.textContent = '';

      if (!inputArea.value.trim()) {
        outputArea.textContent = '';
        outputArea.classList.add('is-empty');
        updateStats('');
        return;
      }

      try {
        var result = SQL.minify(inputArea.value, {
          keywordCase: caseSelect.value,
          removeComments: removeBox.input.checked
        });

        applyResult(result);
      } catch (err) {
        outputArea.textContent = '';
        outputArea.classList.add('is-empty');
        errorText.textContent = err.message;
        updateStats('');
      }
    }

    formatBtn.addEventListener('click', doFormat);
    minifyBtn.addEventListener('click', doMinify);
    indentSelect.addEventListener('change', doFormat);
    caseSelect.addEventListener('change', doFormat);
    removeBox.input.addEventListener('change', doFormat);

    sampleBtn.addEventListener('click', function () {
      inputArea.value = SAMPLE;
      doFormat();
    });

    /* 首屏 */
    inputArea.value = SAMPLE;
    doFormat();

    return { root: root, format: doFormat };
  }

  var instance = null;

  TB.register({
    id: 'sql',
    group: '数据格式',
    title: 'SQL 格式化',
    desc: 'SQL 美化 / 压缩，保留字符串与注释语义',
    icon: 'i-database',
    keywords: ['sql', 'mysql', 'postgres', 'format', 'beautify', 'minify', '格式化'],
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], label: '格式化' }
    ],
    run: function () {
      if (instance) instance.format();
    },
    mount: function (host) {
      instance = build();
      host.appendChild(instance.root);
    }
  });
})();
