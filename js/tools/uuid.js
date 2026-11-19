/* =========================================================
 * 工具：UUID / 随机字符串 / 随机密码
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;
  var B = window.Bytes;

  var UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var LOWER = 'abcdefghijklmnopqrstuvwxyz';
  var DIGITS = '0123456789';
  var SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?/~';

  function randomString(length, alphabet) {
    if (!alphabet) throw new Error('字符集不能为空');

    var out = '';
    var size = Math.max(1, Math.floor(length));

    while (out.length < size) {
      var bytes = B.randomBytes(Math.max(16, size));

      for (var i = 0; i < bytes.length && out.length < size; i++) {
        var byte = bytes[i];
        /* 拒绝采样，避免取模偏差 */
        if (byte >= 256 - (256 % alphabet.length)) continue;
        out += alphabet.charAt(byte % alphabet.length);
      }
    }

    return out;
  }

  function uuidV4() {
    var bytes = B.randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    var hex = B.bytesToHex(bytes);
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  function shuffle(text) {
    var chars = text.split('');

    for (var i = chars.length - 1; i > 0; i--) {
      var random = B.randomBytes(4);
      var value = random[0] | (random[1] << 8) | (random[2] << 16) | ((random[3] & 0x7f) << 24);
      var j = value % (i + 1);
      var temp = chars[i];
      chars[i] = chars[j];
      chars[j] = temp;
    }

    return chars.join('');
  }

  function build() {
    var root = ui.el('section', 'view');
    root.appendChild(ui.head({
      icon: 'i-shuffle',
      title: 'UUID / 随机串',
      desc: 'UUID v4、NanoID 风格随机串与随机密码，使用 crypto.getRandomValues 生成，不消耗可预测的 Math.random。'
    }));

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');

    var typeSelect = ui.el('select', 't-select');
    typeSelect.setAttribute('aria-label', '生成类型');
    [
      ['uuid', 'UUID v4'],
      ['nanoid', 'NanoID 风格随机串'],
      ['password', '随机密码']
    ].forEach(function (item) {
      var option = ui.el('option', '', item[1]);
      option.value = item[0];
      typeSelect.appendChild(option);
    });

    var countInput = ui.el('input', 't-input');
    countInput.type = 'number';
    countInput.min = '1';
    countInput.max = '100';
    countInput.value = '5';
    countInput.setAttribute('aria-label', '生成数量');
    countInput.style.width = '80px';

    var lengthInput = ui.el('input', 't-input');
    lengthInput.type = 'number';
    lengthInput.min = '4';
    lengthInput.max = '128';
    lengthInput.value = '21';
    lengthInput.setAttribute('aria-label', '长度');
    lengthInput.style.width = '80px';

    var upperBox = ui.checkbox('大写 UUID', {});
    var hyphenBox = ui.checkbox('带连字符', { checked: true });

    options.appendChild(ui.field('类型', typeSelect));
    options.appendChild(ui.field('数量', countInput));
    var lengthField = ui.field('长度', lengthInput);
    options.appendChild(lengthField);
    options.appendChild(upperBox.label);
    options.appendChild(hyphenBox.label);
    toolbar.appendChild(options);

    var actions = ui.el('div', 't-actions');
    var generateBtn = ui.el('button', 'btn btn-primary btn-sm');
    generateBtn.type = 'button';
    generateBtn.appendChild(ui.icon('i-sparkles'));
    generateBtn.appendChild(document.createTextNode('生成'));

    var copyAllBtn = ui.miniButton('复制全部', { icon: 'i-copy' });

    actions.appendChild(generateBtn);
    toolbar.appendChild(actions);
    root.appendChild(toolbar);

    /* 字符集（密码模式） */
    var charsetBar = ui.el('div', 't-toolbar');
    var charsetOptions = ui.el('div', 't-options');
    charsetOptions.appendChild(ui.el('span', 't-label', '密码字符集'));

    var lowerBox = ui.checkbox('小写字母', { checked: true });
    var upperCharBox = ui.checkbox('大写字母', { checked: true });
    var digitBox = ui.checkbox('数字', { checked: true });
    var symbolBox = ui.checkbox('符号', {});
    var sets = { lower: true, upper: true, digit: true, symbol: false };

    lowerBox.input.addEventListener('change', function () { sets.lower = lowerBox.input.checked; generate(); });
    upperCharBox.input.addEventListener('change', function () { sets.upper = upperCharBox.input.checked; generate(); });
    digitBox.input.addEventListener('change', function () { sets.digit = digitBox.input.checked; generate(); });
    symbolBox.input.addEventListener('change', function () { sets.symbol = symbolBox.input.checked; generate(); });

    charsetOptions.appendChild(lowerBox.label);
    charsetOptions.appendChild(upperCharBox.label);
    charsetOptions.appendChild(digitBox.label);
    charsetOptions.appendChild(symbolBox.label);

    var alphabetInput = ui.el('input', 't-input');
    alphabetInput.type = 'text';
    alphabetInput.value = UPPER + LOWER + DIGITS + '_-';
    alphabetInput.setAttribute('aria-label', 'NanoID 字符集');
    alphabetInput.style.minWidth = '280px';
    var alphabetField = ui.field('NanoID 字符集', alphabetInput);
    charsetOptions.appendChild(alphabetField);

    charsetBar.appendChild(charsetOptions);
    charsetBar.hidden = true;
    root.appendChild(charsetBar);
    var errorText = ui.el('p', 't-error');
    root.appendChild(errorText);

    var resultCol = ui.el('section', 't-col');
    resultCol.appendChild(ui.colHead('生成结果', { actions: [copyAllBtn] }));
    var resultBody = ui.el('div', 't-col-body');
    var resultArea = ui.el('pre', 't-result is-empty', '点击「生成」开始');
    resultBody.appendChild(resultArea);
    var stats = ui.el('div', 't-stats');
    resultBody.appendChild(stats);
    resultCol.appendChild(resultBody);
    root.appendChild(resultCol);

    /* ---------------- 逻辑 ---------------- */

    function currentType() {
      return typeSelect.value;
    }

    function buildPassword() {
      var length = Math.max(4, Math.min(128, Number(lengthInput.value) || 16));
      var alphabets = [];

      if (sets.lower) alphabets.push(LOWER);
      if (sets.upper) alphabets.push(UPPER);
      if (sets.digit) alphabets.push(DIGITS);
      if (sets.symbol) alphabets.push(SYMBOLS);

      if (!alphabets.length) throw new Error('请至少选择一种密码字符集');

      var all = alphabets.join('');
      var chars = alphabets.map(function (set) { return randomString(1, set); });

      while (chars.length < length) chars.push(randomString(1, all));

      return shuffle(chars.slice(0, length).join(''));
    }

    function generate() {
      errorText.textContent = '';

      var type = currentType();
      var count = Math.max(1, Math.min(100, Number(countInput.value) || 1));
      countInput.value = String(count);

      var list = [];

      try {
        for (var i = 0; i < count; i++) {
          if (type === 'uuid') {
            var id = uuidV4();
            if (!hyphenBox.input.checked) id = id.replace(/-/g, '');
            if (upperBox.input.checked) id = id.toUpperCase();
            list.push(id);
          } else if (type === 'nanoid') {
            var length = Math.max(4, Math.min(128, Number(lengthInput.value) || 21));
            lengthInput.value = String(length);
            list.push(randomString(length, alphabetInput.value.trim()));
          } else {
            list.push(buildPassword());
          }
        }
      } catch (err) {
        errorText.textContent = err.message;
        resultArea.textContent = '';
        resultArea.classList.add('is-empty');
        stats.textContent = '';
        return;
      }

      resultArea.textContent = list.join('\n');
      resultArea.classList.remove('is-empty');

      stats.textContent = '';
      stats.appendChild(ui.el('span', 't-stat', '共 ' + list.length + ' 条'));
      stats.appendChild(ui.el('span', 't-stat', '每条 ' + list[0].length + ' 字符'));
    }

    function syncPanels() {
      var type = currentType();
      var isUuid = type === 'uuid';
      var isPassword = type === 'password';

      lengthField.hidden = isUuid;
      upperBox.label.hidden = !isUuid;
      hyphenBox.label.hidden = !isUuid;
      charsetBar.hidden = !(isPassword || type === 'nanoid');
      charsetOptions.querySelectorAll('.check').forEach(function (label) {
        label.hidden = !isPassword;
      });
      alphabetField.hidden = type !== 'nanoid';

      if (type === 'nanoid') lengthInput.value = lengthInput.value || '21';
      generate();
    }

    typeSelect.addEventListener('change', syncPanels);
    countInput.addEventListener('change', generate);
    lengthInput.addEventListener('change', generate);
    upperBox.input.addEventListener('change', generate);
    hyphenBox.input.addEventListener('change', generate);
    alphabetInput.addEventListener('input', ui.debounce(generate, 250));
    generateBtn.addEventListener('click', generate);

    copyAllBtn.addEventListener('click', function () {
      var text = resultArea.textContent;
      if (!text || resultArea.classList.contains('is-empty')) {
        ui.toast('还没有生成结果');
        return;
      }
      ui.copyText(text).then(function (ok) {
        ui.toast(ok ? '已复制 ' + text.split('\n').length + ' 条' : '复制失败');
      });
    });

    syncPanels();

    return { root: root, generate: generate };
  }

  var instance = null;

  TB.register({
    id: 'uuid',
    group: '生成器',
    title: 'UUID / 随机串',
    desc: 'UUID v4、NanoID 风格随机串与随机密码',
    icon: 'i-shuffle',
    keywords: ['uuid', 'guid', 'nanoid', 'random', 'password', '随机'],
    shortcuts: [{ keys: ['Ctrl', 'Enter'], label: '重新生成' }],
    run: function () {
      if (instance) instance.generate();
    },
    mount: function (host) {
      instance = build();
      host.appendChild(instance.root);
    }
  });
})();
