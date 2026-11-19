/* =========================================================
 * 工具：Base64 / URL 编解码
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;
  var B = window.Bytes;

  function build() {
    var state = {
      mode: 'base64-encode',
      urlSafe: false,
      form: false
    };

    var root = ui.el('section', 'view');
    root.appendChild(ui.head({
      icon: 'i-code',
      title: 'Base64 / URL 编解码',
      desc: 'UTF-8 安全的 Base64 与 URL 百分号编码，支持 URL-safe 变体与表单编码。'
    }));

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');

    var modeSelect = ui.el('select', 't-select');
    modeSelect.setAttribute('aria-label', '转换模式');
    [
      ['base64-encode', 'Base64 编码'],
      ['base64-decode', 'Base64 解码'],
      ['url-encode', 'URL 编码'],
      ['url-decode', 'URL 解码']
    ].forEach(function (item) {
      var option = ui.el('option', '', item[1]);
      option.value = item[0];
      modeSelect.appendChild(option);
    });

    options.appendChild(ui.field('模式', modeSelect));

    var urlSafeBox = ui.checkbox('URL-safe（-_ 且去填充）', { checked: false });
    var formBox = ui.checkbox('表单编码（空格转 +）', { checked: false });
    options.appendChild(urlSafeBox.label);
    options.appendChild(formBox.label);
    toolbar.appendChild(options);

    var actions = ui.el('div', 't-actions');
    var swapBtn = ui.el('button', 'btn btn-ghost btn-sm');
    swapBtn.type = 'button';
    swapBtn.appendChild(ui.icon('i-replace'));
    swapBtn.appendChild(document.createTextNode('交换'));
    swapBtn.title = '把结果放回输入，并切换方向';

    var sampleBtn = ui.el('button', 'btn btn-ghost btn-sm');
    sampleBtn.type = 'button';
    sampleBtn.textContent = '示例';

    actions.appendChild(swapBtn);
    actions.appendChild(sampleBtn);
    toolbar.appendChild(actions);
    root.appendChild(toolbar);

    var cols = ui.el('div', 't-cols');

    /* 输入 */
    var inputCol = ui.el('section', 't-col');
    var inputBadge = ui.el('span', 'badge', '0 字符');
    var inputArea = ui.textarea('在此输入要转换的文本…', { label: '输入内容' });
    inputArea.classList.add('is-mono-big');

    var clearBtn = ui.miniButton('清空', { icon: 'i-trash', onClick: function () { inputArea.value = ''; convert(); inputArea.focus(); }, danger: true });
    var pasteBtn = ui.miniButton('粘贴', {
      icon: 'i-upload',
      onClick: function () {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          ui.toast('当前浏览器不允许读取剪贴板，请手动粘贴');
          return;
        }
        navigator.clipboard.readText().then(function (text) {
          inputArea.value = text;
          convert();
        }, function () {
          ui.toast('读取剪贴板失败');
        });
      }
    });

    inputCol.appendChild(ui.colHead('输入', { badge: null, actions: [pasteBtn, clearBtn] }));
    var inputBody = ui.el('div', 't-col-body');
    inputBody.appendChild(inputArea);
    var inputMeta = ui.el('div', 't-stats');
    inputBody.appendChild(inputMeta);
    inputCol.appendChild(inputBody);

    /* 输出 */
    var outputCol = ui.el('section', 't-col');
    var outputArea = ui.textarea('转换结果…', { readonly: true, label: '输出结果' });
    outputArea.classList.add('is-mono-big');
    var errorBox = ui.el('p', 't-error');
    var outputNote = ui.el('div', 't-note');
    outputNote.hidden = true;

    var copyBtn = ui.copyButton(function () { return outputArea.value; }, '复制结果');
    outputCol.appendChild(ui.colHead('输出', { actions: [copyBtn] }));
    var outputBody = ui.el('div', 't-col-body');
    outputBody.appendChild(outputArea);
    outputBody.appendChild(outputNote);
    outputBody.appendChild(errorBox);
    var outputMeta = ui.el('div', 't-stats');
    outputBody.appendChild(outputMeta);
    outputCol.appendChild(outputBody);

    cols.appendChild(inputCol);
    cols.appendChild(outputCol);
    root.appendChild(cols);

    /* ---------------- 逻辑 ---------------- */

    function base64Encode(text) {
      var bytes = B.utf8Encode(text);
      return state.urlSafe ? B.bytesToBase64Url(bytes) : B.bytesToBase64(bytes);
    }

    function base64Decode(text) {
      var bytes = B.base64ToBytes(text);
      if (!bytes.length) return { text: '', bytes: bytes };

      if (B.isValidUtf8(bytes)) {
        return { text: B.utf8Decode(bytes), bytes: bytes };
      }

      return {
        text: B.bytesToHex(bytes),
        bytes: bytes,
        note: '解码结果不是有效的 UTF-8 文本，已按十六进制显示（共 ' + bytes.length + ' 字节）'
      };
    }

    function urlEncode(text) {
      var result = encodeURIComponent(text);
      return state.form ? result.replace(/%20/g, '+') : result;
    }

    function urlDecode(text) {
      var source = state.form ? text.replace(/\+/g, ' ') : text;
      try {
        return decodeURIComponent(source);
      } catch (err) {
        throw new Error('非法的百分号编码：请检查 % 后面是否为两位十六进制数');
      }
    }

    function convert() {
      var source = inputArea.value;
      var result = '';
      var bytes = 0;
      var note = '';

      outputArea.classList.remove('is-invalid');
      errorBox.textContent = '';
      outputNote.hidden = true;

      if (!source) {
        outputArea.value = '';
        updateMeta(0);
        return;
      }

      try {
        if (state.mode === 'base64-encode') {
          result = base64Encode(source);
          bytes = B.utf8Encode(source).length;
        } else if (state.mode === 'base64-decode') {
          var decoded = base64Decode(source.trim());
          result = decoded.text;
          bytes = decoded.bytes.length;
          note = decoded.note || '';
        } else if (state.mode === 'url-encode') {
          result = urlEncode(source);
          bytes = B.utf8Encode(source).length;
        } else {
          result = urlDecode(source);
          bytes = B.utf8Encode(result).length;
        }

        outputArea.value = result;
        updateMeta(bytes);

        if (note) {
          outputNote.textContent = '';
          outputNote.className = 't-note is-warn';
          outputNote.appendChild(ui.icon('i-alert'));
          outputNote.appendChild(ui.el('span', '', note));
          outputNote.hidden = false;
        }
      } catch (err) {
        outputArea.value = '';
        outputArea.classList.add('is-invalid');
        errorBox.textContent = err && err.message ? err.message : '转换失败';
        updateMeta(0);
      }
    }

    function updateMeta(byteCount) {
      inputMeta.textContent = '';
      inputMeta.appendChild(ui.el('span', 't-stat', '输入 ' + inputArea.value.length + ' 字符 / ' + B.utf8Encode(inputArea.value).length + ' 字节'));
      inputBadge.textContent = inputArea.value.length + ' 字符';

      outputMeta.textContent = '';
      outputMeta.appendChild(ui.el('span', 't-stat', '输出 ' + outputArea.value.length + ' 字符 / ' + (byteCount || 0) + ' 字节'));
    }

    function syncControls() {
      state.mode = modeSelect.value;
      var isBase64 = state.mode.indexOf('base64') === 0;
      urlSafeBox.label.hidden = !isBase64;
      formBox.label.hidden = isBase64;
      state.urlSafe = urlSafeBox.input.checked;
      state.form = formBox.input.checked;
      convert();
    }

    modeSelect.addEventListener('change', syncControls);
    urlSafeBox.input.addEventListener('change', syncControls);
    formBox.input.addEventListener('change', syncControls);

    inputArea.addEventListener('input', ui.debounce(convert, 120));

    swapBtn.addEventListener('click', function () {
      if (!outputArea.value) return;
      inputArea.value = outputArea.value;
      modeSelect.value = state.mode === 'base64-encode' ? 'base64-decode'
        : state.mode === 'base64-decode' ? 'base64-encode'
          : state.mode === 'url-encode' ? 'url-decode' : 'url-encode';
      syncControls();
    });

    sampleBtn.addEventListener('click', function () {
      inputArea.value = state.mode === 'base64-decode' ? '5L2g5aW977yM5LiW55WM' : '你好，世界 Hello';
      convert();
    });

    /* 首屏 */
    inputArea.value = '你好，世界 Hello';
    syncControls();

    return {
      root: root,
      convert: convert,
      focus: function () { inputArea.focus(); }
    };
  }

  var instance = null;

  TB.register({
    id: 'encode',
    group: '编码转换',
    title: 'Base64 / URL',
    desc: 'UTF-8 安全的 Base64、URL-safe 与 URL 百分号编码',
    icon: 'i-code',
    keywords: ['base64', 'url', 'encode', 'decode', 'urlsafe'],
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], label: '立即转换' }
    ],
    run: function () {
      if (instance) instance.convert();
    },
    mount: function (host) {
      instance = build();
      host.appendChild(instance.root);
    }
  });
})();
