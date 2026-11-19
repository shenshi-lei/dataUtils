/* =========================================================
 * 工具：进制转换 + 文本格式化
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;
  var B = window.Bytes;
  var Radix = window.Radix;
  var TextCase = window.TextCase;

  function build() {
    var state = { tab: 'number', lastOp: null };

    var root = ui.el('section', 'view');
    root.appendChild(ui.head({
      icon: 'i-type',
      title: '进制与文本',
      desc: '任意进制大整数互转（BigInt 保精度），以及大小写、命名风格与行级文本整理。'
    }));

    var tabRow = ui.el('div', 't-tabs-row');
    var tabs = ui.el('div', 'tabs');
    tabs.setAttribute('role', 'tablist');

    var numberTab = ui.el('button', 'tab is-active', '进制转换');
    numberTab.type = 'button';
    numberTab.setAttribute('role', 'tab');
    numberTab.setAttribute('aria-selected', 'true');

    var textTab = ui.el('button', 'tab', '文本格式化');
    textTab.type = 'button';
    textTab.setAttribute('role', 'tab');
    textTab.setAttribute('aria-selected', 'false');

    tabs.appendChild(numberTab);
    tabs.appendChild(textTab);
    tabRow.appendChild(tabs);
    root.appendChild(tabRow);

    /* ---------------- 进制转换 ---------------- */

    var numberPanel = ui.el('div', 't-stack');
    var numberToolbar = ui.el('div', 't-toolbar');
    var numberOptions = ui.el('div', 't-options');

    var baseSelect = ui.el('select', 't-select');
    baseSelect.setAttribute('aria-label', '源进制');
    [['auto', '自动（识别 0x / 0b / 0o）'], ['2', '2 进制'], ['8', '8 进制'], ['10', '10 进制'], ['16', '16 进制'], ['36', '36 进制']].forEach(function (item) {
      var option = ui.el('option', '', item[1]);
      option.value = item[0];
      baseSelect.appendChild(option);
    });

    var numberInput = ui.el('input', 't-input');
    numberInput.type = 'text';
    numberInput.placeholder = '例如 9007199254740993 或 0xFFFFFFFF';
    numberInput.setAttribute('aria-label', '数字');
    numberInput.style.minWidth = '320px';

    numberOptions.appendChild(ui.field('源进制', baseSelect));
    numberOptions.appendChild(ui.field('数字', numberInput));
    numberToolbar.appendChild(numberOptions);

    var numberActions = ui.el('div', 't-actions');
    var clearNumber = ui.miniButton('清空', {
      icon: 'i-trash',
      danger: true,
      onClick: function () {
        numberInput.value = '';
        numberRows.textContent = '';
        numberError.textContent = '';
      }
    });
    numberActions.appendChild(clearNumber);
    numberToolbar.appendChild(numberActions);
    numberPanel.appendChild(numberToolbar);

    var numberCols = ui.el('div', 't-cols');

    var numberHintCol = ui.el('section', 't-col');
    numberHintCol.appendChild(ui.colHead('说明'));
    var numberHintBody = ui.el('div', 't-col-body');
    numberHintBody.appendChild(ui.note('使用 BigInt 解析，不经过 Number，因此 64 位以上的整数也不会丢精度。', 'ok', 'i-check'));
    numberHintBody.appendChild(ui.note('支持负号与 0x / 0b / 0o 前缀；显式选择进制时前缀只被忽略，不改变进制。', null, 'i-alert'));
    numberHintCol.appendChild(numberHintBody);

    var numberResultCol = ui.el('section', 't-col');
    numberResultCol.appendChild(ui.colHead('转换结果'));
    var numberResultBody = ui.el('div', 't-col-body');
    var numberError = ui.el('p', 't-error');
    numberResultBody.appendChild(numberError);
    var numberRows = ui.el('div', 't-rows');
    numberResultBody.appendChild(numberRows);
    numberResultCol.appendChild(numberResultBody);

    numberCols.appendChild(numberHintCol);
    numberCols.appendChild(numberResultCol);
    numberPanel.appendChild(numberCols);
    root.appendChild(numberPanel);

    /* ---------------- 文本格式化 ---------------- */

    var textPanel = ui.el('div', 't-stack');
    textPanel.hidden = true;

    var textToolbar = ui.el('div', 't-toolbar');
    var textOptions = ui.el('div', 't-options');

    var operationGroups = [
      {
        label: '命名',
        items: [
          ['camel', 'camelCase'],
          ['pascal', 'PascalCase'],
          ['snake', 'snake_case'],
          ['kebab', 'kebab-case'],
          ['constant', 'CONSTANT_CASE']
        ]
      },
      {
        label: '大小写',
        items: [
          ['upper', '全大写'],
          ['lower', '全小写'],
          ['title', '标题格式']
        ]
      },
      {
        label: '行处理',
        items: [
          ['trim', '去首尾空白'],
          ['blank', '去空行'],
          ['dedupe', '去重行'],
          ['sort', '行排序'],
          ['reverse', '反转行']
        ]
      }
    ];

    operationGroups.forEach(function (group) {
      var wrap = ui.el('div', 't-inline');
      wrap.appendChild(ui.el('span', 't-label', group.label));

      group.items.forEach(function (item) {
        var button = ui.el('button', 'btn btn-ghost btn-sm');
        button.type = 'button';
        button.textContent = item[1];
        button.title = '把左侧文本转换为 ' + item[1];
        button.addEventListener('click', function () {
          applyText(item[0]);
        });
        wrap.appendChild(button);
      });

      textOptions.appendChild(wrap);
    });

    textToolbar.appendChild(textOptions);

    var textActions = ui.el('div', 't-actions');
    textActions.appendChild(ui.miniButton('还原', {
      icon: 'i-undo',
      onClick: function () {
        textOutput.value = textInput.value;
        updateTextStats();
      }
    }));
    textToolbar.appendChild(textActions);
    textPanel.appendChild(textToolbar);

    var textCols = ui.el('div', 't-cols');

    var textInputCol = ui.el('section', 't-col');
    var textInput = ui.textarea('在此输入原始文本…', { label: '原始文本' });
    textInput.classList.add('is-mono-big');

    textInputCol.appendChild(ui.colHead('输入', {
      actions: [ui.copyButton(function () { return textInput.value; }, '复制')]
    }));
    var textInputBody = ui.el('div', 't-col-body');
    textInputBody.appendChild(textInput);
    var textInputStats = ui.el('div', 't-stats');
    textInputBody.appendChild(textInputStats);
    textInputCol.appendChild(textInputBody);

    var textOutputCol = ui.el('section', 't-col');
    var textOutput = ui.textarea('处理结果…', { readonly: true, label: '处理结果' });
    textOutput.classList.add('is-mono-big');

    textOutputCol.appendChild(ui.colHead('输出', {
      actions: [ui.copyButton(function () { return textOutput.value; }, '复制')]
    }));
    var textOutputBody = ui.el('div', 't-col-body');
    textOutputBody.appendChild(textOutput);
    var textOutputStats = ui.el('div', 't-stats');
    textOutputBody.appendChild(textOutputStats);
    textOutputCol.appendChild(textOutputBody);

    textCols.appendChild(textInputCol);
    textCols.appendChild(textOutputCol);
    textPanel.appendChild(textCols);
    root.appendChild(textPanel);

    /* ---------------- 进制逻辑 ---------------- */

    function renderNumber() {
      numberError.textContent = '';
      numberRows.textContent = '';

      var source = numberInput.value.trim();
      if (!source) return;

      var converted;

      try {
        converted = Radix.convert(source, baseSelect.value);
      } catch (err) {
        numberError.textContent = err.message;
        return;
      }

      converted.results.forEach(function (item) {
        var row = ui.el('div', 't-row');
        row.appendChild(ui.el('div', 't-row-key', item.base + ' 进制'));

        var val = ui.el('div', 't-row-val', item.text);
        row.appendChild(val);

        var act = ui.el('div', 't-row-act');
        act.appendChild(ui.miniButton('', {
          icon: 'i-copy',
          title: '复制',
          onClick: function () {
            ui.copyText(item.text).then(function (ok) { ui.toast(ok ? '已复制' : '复制失败'); });
          }
        }));
        row.appendChild(act);

        numberRows.appendChild(row);
      });
    }

    baseSelect.addEventListener('change', renderNumber);
    numberInput.addEventListener('input', ui.debounce(renderNumber, 120));

    /* ---------------- 文本逻辑 ---------------- */

    function applyText(operation) {
      try {
        textOutput.value = TextCase.apply(textInput.value, operation);
        state.lastOp = operation;
      } catch (err) {
        ui.toast(err.message);
        return;
      }

      updateTextStats();
    }

    function updateTextStats() {
      var source = textInput.value;
      var output = textOutput.value;

      textInputStats.textContent = '';
      textInputStats.appendChild(ui.el('span', 't-stat', '字符 ' + source.length));
      textInputStats.appendChild(ui.el('span', 't-stat', '字节 ' + B.utf8Encode(source).length));
      textInputStats.appendChild(ui.el('span', 't-stat', '行 ' + (source ? source.split('\n').length : 0)));
      textInputStats.appendChild(ui.el('span', 't-stat', '词 ' + TextCase.splitWords(source).length));

      textOutputStats.textContent = '';
      textOutputStats.appendChild(ui.el('span', 't-stat', '输出 ' + output.length + ' 字符'));
    }

    textInput.addEventListener('input', ui.debounce(function () {
      textOutput.value = textInput.value;
      updateTextStats();
    }, 120));

    /* ---------------- 标签切换 ---------------- */

    function setTab(name) {
      var isNumber = name === 'number';
      state.tab = isNumber ? 'number' : 'text';

      numberTab.classList.toggle('is-active', isNumber);
      textTab.classList.toggle('is-active', !isNumber);
      numberTab.setAttribute('aria-selected', isNumber ? 'true' : 'false');
      textTab.setAttribute('aria-selected', isNumber ? 'false' : 'true');

      numberPanel.hidden = !isNumber;
      textPanel.hidden = isNumber;
    }

    numberTab.addEventListener('click', function () { setTab('number'); });
    textTab.addEventListener('click', function () { setTab('text'); });

    /* 首屏 */
    numberInput.value = '9007199254740993';
    renderNumber();
    textInput.value = 'user profile name\nhello_world\nHTTPServer\n中文测试';
    textOutput.value = textInput.value;
    updateTextStats();

    function runPrimary() {
      if (state.tab === 'number') renderNumber();
      else if (state.lastOp) applyText(state.lastOp);
    }

    return { root: root, run: runPrimary };
  }

  var instance = null;

  TB.register({
    id: 'text',
    group: '文本',
    title: '进制与文本',
    desc: '任意进制大整数互转、命名风格与行级文本整理',
    icon: 'i-type',
    keywords: ['base', 'hex', 'radix', 'camel', 'snake', 'kebab', '进制', '命名'],
    shortcuts: [{ keys: ['Ctrl', 'Enter'], label: '重新转换' }],
    run: function () {
      if (instance) instance.run();
    },
    mount: function (host) {
      instance = build();
      host.appendChild(instance.root);
    }
  });
})();
