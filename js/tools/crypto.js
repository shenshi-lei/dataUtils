/* =========================================================
 * 工具：AES 加解密（CBC / CTR / GCM）
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;
  var B = window.Bytes;
  var Kit = window.CryptoKit;

  var KEY_SIZES = [16, 24, 32];

  function build() {
    var state = { busy: false };

    var root = ui.el('section', 't-page');
    root.appendChild(ui.head({
      icon: 'i-lock',
      title: 'AES 加解密',
      desc: 'AES-128/192/256，支持 CBC（PKCS#7）、CTR 与 GCM；密钥与明文只在内存中处理。',
      search: true
    }));

    /* ---------- 第一行：算法与操作 ---------- */

    var bar1 = ui.el('div', 't-toolbar');
    var options1 = ui.el('div', 't-options');

    var modeSelect = ui.el('select', 't-select');
    modeSelect.setAttribute('aria-label', 'AES 模式');
    [
      ['CBC', 'AES-CBC（PKCS#7 填充）'],
      ['CTR', 'AES-CTR（流式，无填充）'],
      ['GCM', 'AES-GCM（带认证标签）']
    ].forEach(function (item) {
      var option = ui.el('option', '', item[1]);
      option.value = item[0];
      modeSelect.appendChild(option);
    });

    var formatSelect = ui.el('select', 't-select');
    formatSelect.setAttribute('aria-label', '密文编码');
    [['base64', 'Base64'], ['hex', '十六进制']].forEach(function (item) {
      var option = ui.el('option', '', item[1]);
      option.value = item[0];
      formatSelect.appendChild(option);
    });

    var prefixBox = ui.checkbox('IV 前置到密文', {});

    options1.appendChild(ui.field('模式', modeSelect));
    options1.appendChild(ui.field('密文编码', formatSelect));
    options1.appendChild(prefixBox.label);
    bar1.appendChild(options1);

    var actions1 = ui.el('div', 't-actions');

    var searchBtn = ui.miniButton('查找', {
      icon: 'i-search',
      title: '在明文与密文中查找 (Ctrl+F)',
      onClick: function () { TB.find(); }
    });

    var encryptBtn = ui.el('button', 'btn btn-primary btn-sm');
    encryptBtn.type = 'button';
    encryptBtn.appendChild(ui.icon('i-lock'));
    encryptBtn.appendChild(document.createTextNode('加密'));

    var decryptBtn = ui.el('button', 'btn btn-ghost btn-sm');
    decryptBtn.type = 'button';
    decryptBtn.appendChild(ui.icon('i-key'));
    decryptBtn.appendChild(document.createTextNode('解密'));

    var swapBtn = ui.el('button', 'btn btn-ghost btn-sm');
    swapBtn.type = 'button';
    swapBtn.textContent = '交换';

    actions1.appendChild(searchBtn);
    actions1.appendChild(encryptBtn);
    actions1.appendChild(decryptBtn);
    actions1.appendChild(swapBtn);
    bar1.appendChild(actions1);
    root.appendChild(bar1);

    /* ---------- 第二行：密钥与 IV ---------- */

    var bar2 = ui.el('div', 't-toolbar');
    var options2 = ui.el('div', 't-options');

    var keyInput = ui.el('input', 't-input');
    keyInput.type = 'text';
    keyInput.placeholder = '16 / 24 / 32 字节的密钥';
    keyInput.setAttribute('aria-label', 'AES 密钥');
    keyInput.style.minWidth = '240px';

    var keyEnc = ui.el('select', 't-select');
    keyEnc.setAttribute('aria-label', '密钥编码');
    [['utf8', 'UTF-8 文本'], ['hex', 'Hex'], ['base64', 'Base64']].forEach(function (item) {
      var option = ui.el('option', '', item[1]);
      option.value = item[0];
      keyEnc.appendChild(option);
    });

    var keyBadge = ui.el('span', 'badge', '— 字节');
    var keyRandom = ui.miniButton('随机', { icon: 'i-shuffle', title: '生成 32 字节随机密钥（Hex）' });

    var keyInline = ui.el('div', 't-inline');
    keyInline.appendChild(keyInput);
    keyInline.appendChild(keyEnc);
    keyInline.appendChild(keyBadge);
    keyInline.appendChild(keyRandom);
    options2.appendChild(ui.field('密钥', keyInline));

    var ivInput = ui.el('input', 't-input');
    ivInput.type = 'text';
    ivInput.setAttribute('aria-label', 'AES IV');
    ivInput.style.minWidth = '220px';

    var ivEnc = ui.el('select', 't-select');
    ivEnc.setAttribute('aria-label', 'IV 编码');
    [['hex', 'Hex'], ['base64', 'Base64'], ['utf8', 'UTF-8 文本']].forEach(function (item) {
      var option = ui.el('option', '', item[1]);
      option.value = item[0];
      ivEnc.appendChild(option);
    });

    var ivBadge = ui.el('span', 'badge', '— 字节');
    var ivRandom = ui.miniButton('随机', { icon: 'i-shuffle', title: '生成符合当前模式的随机 IV' });

    var ivInline = ui.el('div', 't-inline');
    ivInline.appendChild(ivInput);
    ivInline.appendChild(ivEnc);
    ivInline.appendChild(ivBadge);
    ivInline.appendChild(ivRandom);
    options2.appendChild(ui.field('IV / Nonce', ivInline));

    bar2.appendChild(options2);
    root.appendChild(bar2);

    var availability = ui.el('div', 't-note is-error');
    availability.hidden = true;
    root.appendChild(availability);

    /* ---------- 双栏 ---------- */

    var cols = ui.el('div', 't-cols');

    var plainCol = ui.el('section', 't-col');
    var plainArea = ui.textarea('明文（加密时读取这里）…', { label: '明文' });
    plainArea.classList.add('is-mono-big');
    plainCol.appendChild(ui.colHead('明文', { actions: [ui.copyButton(function () { return plainArea.value; }, '复制')] }));
    var plainBody = ui.el('div', 't-col-body');
    plainBody.appendChild(plainArea);
    var plainStats = ui.el('div', 't-stats');
    plainBody.appendChild(plainStats);
    plainCol.appendChild(plainBody);

    var cipherCol = ui.el('section', 't-col');
    var cipherArea = ui.textarea('密文（解密时读取这里）…', { label: '密文' });
    cipherArea.classList.add('is-mono-big');
    cipherCol.appendChild(ui.colHead('密文', { actions: [ui.copyButton(function () { return cipherArea.value; }, '复制')] }));
    var cipherBody = ui.el('div', 't-col-body');
    cipherBody.appendChild(cipherArea);
    var cipherStats = ui.el('div', 't-stats');
    cipherBody.appendChild(cipherStats);
    var errorText = ui.el('p', 't-error');
    cipherBody.appendChild(errorText);
    cipherCol.appendChild(cipherBody);

    cols.appendChild(plainCol);
    cols.appendChild(cipherCol);
    root.appendChild(cols);

    var notes = ui.el('div', 't-note');
    notes.appendChild(ui.icon('i-lock'));
    notes.appendChild(ui.el('span', '',
      'CBC 的 PKCS#7 填充由浏览器 WebCrypto 自动完成（与 Java / OpenSSL 的 PKCS5Padding 互通）；' +
      'CTR / GCM 不填充，GCM 自带 16 字节认证标签。' +
      'IV 必须唯一，随机 IV 请随密文一起保存（可勾选「IV 前置到密文」）。' +
      'GCM 暂不支持 AAD；密钥与明文不写入本地存储。'));
    root.appendChild(notes);

    /* ---------------- 逻辑 ---------------- */

    var finder = null;

    function ensureFinder() {
      if (finder) return finder;

      finder = window.Finder.attach(root, {
        label: 'AES 查找',
        scope: '明文 + 密文',
        targets: [plainArea, cipherArea]
      });
      return finder;
    }

    function decodeWith(text, encoding) {
      if (encoding === 'hex') return B.hexToBytes(text);
      if (encoding === 'base64') return B.base64ToBytes(text);
      return B.utf8Encode(text);
    }

    function encodeWith(bytes, encoding) {
      if (encoding === 'hex') return B.bytesToHex(bytes);
      return B.bytesToBase64(bytes);
    }

    function currentMode() {
      return modeSelect.value;
    }

    function requiredIvLength() {
      return currentMode() === 'GCM' ? 12 : 16;
    }

    function readKey() {
      var text = keyInput.value.trim();
      if (!text) throw new Error('请先填写密钥');

      var bytes;
      try {
        bytes = decodeWith(text, keyEnc.value);
      } catch (err) {
        throw new Error('密钥解析失败：' + err.message);
      }

      if (KEY_SIZES.indexOf(bytes.length) < 0) {
        throw new Error('密钥为 ' + bytes.length + ' 字节，AES 只接受 16 / 24 / 32 字节（128 / 192 / 256 位）');
      }

      return bytes;
    }

    function readIv() {
      var text = ivInput.value.trim();
      if (!text) throw new Error('请填写 IV，或点击「随机」生成一个');

      var bytes;
      try {
        bytes = decodeWith(text, ivEnc.value);
      } catch (err) {
        throw new Error('IV 解析失败：' + err.message);
      }

      var expected = requiredIvLength();
      if (bytes.length !== expected) {
        throw new Error('当前模式要求 IV 为 ' + expected + ' 字节，实际为 ' + bytes.length + ' 字节');
      }

      return bytes;
    }

    function setBusy(busy) {
      state.busy = busy;
      encryptBtn.disabled = busy;
      decryptBtn.disabled = busy;
      swapBtn.disabled = busy;
    }

    function showError(message) {
      errorText.textContent = message || '';
    }

    function updateKeyBadge() {
      var text = keyInput.value.trim();

      if (!text) {
        keyBadge.textContent = '— 字节';
        keyBadge.style.color = '';
        return;
      }

      var bytes;
      try {
        bytes = decodeWith(text, keyEnc.value);
      } catch (err) {
        keyBadge.textContent = '解析失败';
        keyBadge.style.color = 'var(--danger)';
        return;
      }

      var ok = KEY_SIZES.indexOf(bytes.length) >= 0;
      keyBadge.textContent = bytes.length + ' 字节 · AES-' + (bytes.length * 8);
      keyBadge.style.color = ok ? '' : 'var(--danger)';
    }

    function updateIvBadge() {
      var text = ivInput.value.trim();

      if (!text) {
        ivBadge.textContent = '— 字节';
        ivBadge.style.color = '';
        return;
      }

      var bytes;
      try {
        bytes = decodeWith(text, ivEnc.value);
      } catch (err) {
        ivBadge.textContent = '解析失败';
        ivBadge.style.color = 'var(--danger)';
        return;
      }

      var expected = requiredIvLength();
      ivBadge.textContent = bytes.length + ' / ' + expected + ' 字节';
      ivBadge.style.color = bytes.length === expected ? '' : 'var(--danger)';
    }

    function updateStats() {
      plainStats.textContent = '';
      plainStats.appendChild(ui.el('span', 't-stat', '明文 ' + B.utf8Encode(plainArea.value).length + ' 字节'));

      cipherStats.textContent = '';
      cipherStats.appendChild(ui.el('span', 't-stat', '密文 ' + cipherArea.value.length + ' 字符'));
    }

    function doEncrypt() {
      if (state.busy) return;
      showError('');

      var key;
      var iv;
      var prefix = prefixBox.input.checked;

      try {
        key = readKey();
        iv = readIv();
      } catch (err) {
        showError(err.message);
        return;
      }

      var mode = currentMode();
      var payload = B.utf8Encode(plainArea.value);
      var encoding = formatSelect.value;

      setBusy(true);

      Kit.aesEncrypt({ mode: mode, key: key, iv: iv, data: payload }).then(function (cipher) {
        var combined = prefix ? B.concatBytes(iv, cipher) : cipher;
        cipherArea.value = encodeWith(combined, encoding);
        cipherArea.classList.remove('is-invalid');
        updateStats();
        ui.toast('加密完成');
      }).catch(function (error) {
        showError(Kit.describeError(error, 'encrypt'));
      }).then(function () {
        setBusy(false);
      });
    }

    function doDecrypt() {
      if (state.busy) return;
      showError('');

      var key;
      var iv;
      var prefix = prefixBox.input.checked;
      var encoding = formatSelect.value;
      var mode = currentMode();

      try {
        key = readKey();

        if (!cipherArea.value.trim()) throw new Error('请先把密文放到右侧输入框');

        var raw;
        try {
          raw = decodeWith(cipherArea.value.trim(), encoding);
        } catch (err) {
          throw new Error('密文解码失败：' + err.message);
        }

        if (prefix) {
          var ivLength = requiredIvLength();
          if (raw.length <= ivLength) throw new Error('密文长度不足，无法取出前置 IV');
          iv = raw.slice(0, ivLength);
          raw = raw.slice(ivLength);
        } else {
          iv = readIv();
        }

        setBusy(true);

        Kit.aesDecrypt({ mode: mode, key: key, iv: iv, data: raw }).then(function (plain) {
          /* CBC 的 PKCS#7 填充由 WebCrypto 解密时自动剥除，这里不能再手动 unpad */
          var bytes = plain;

          if (B.isValidUtf8(bytes)) {
            plainArea.value = B.utf8Decode(bytes);
            plainArea.classList.remove('is-invalid');
          } else {
            plainArea.value = B.bytesToHex(bytes);
            plainArea.classList.add('is-invalid');
            showError('解密成功，但结果不是有效的 UTF-8 文本，已按十六进制显示。');
          }

          updateStats();
          ui.toast('解密完成');
        }).catch(function (error) {
          showError(Kit.describeError(error, 'decrypt'));
        }).then(function () {
          setBusy(false);
        });
      } catch (err) {
        showError(err.message);
        setBusy(false);
      }
    }

    /* ---------------- 事件 ---------------- */

    encryptBtn.addEventListener('click', doEncrypt);
    decryptBtn.addEventListener('click', doDecrypt);

    swapBtn.addEventListener('click', function () {
      var temp = plainArea.value;
      plainArea.value = cipherArea.value;
      cipherArea.value = temp;
      updateStats();
    });

    keyRandom.addEventListener('click', function () {
      var bytes = B.randomBytes(32);
      keyEnc.value = 'hex';
      keyInput.value = B.bytesToHex(bytes);
      updateKeyBadge();
    });

    ivRandom.addEventListener('click', function () {
      var bytes = B.randomBytes(requiredIvLength());
      ivEnc.value = 'hex';
      ivInput.value = B.bytesToHex(bytes);
      updateIvBadge();
    });

    keyInput.addEventListener('input', updateKeyBadge);
    keyEnc.addEventListener('change', updateKeyBadge);
    ivInput.addEventListener('input', updateIvBadge);
    ivEnc.addEventListener('change', updateIvBadge);

    modeSelect.addEventListener('change', function () {
      updateIvBadge();
      showError('');
    });

    plainArea.addEventListener('input', updateStats);
    cipherArea.addEventListener('input', updateStats);

    /* 首屏 */
    if (!Kit.available()) {
      availability.hidden = false;
      availability.textContent = '';
      availability.appendChild(ui.icon('i-alert'));
      availability.appendChild(ui.el('span', '', Kit.unavailableReason()));
      encryptBtn.disabled = true;
      decryptBtn.disabled = true;
      keyRandom.disabled = true;
      ivRandom.disabled = true;
    } else {
      keyEnc.value = 'hex';
      keyInput.value = B.bytesToHex(B.randomBytes(32));
      ivEnc.value = 'hex';
      ivInput.value = B.bytesToHex(B.randomBytes(16));
      plainArea.value = 'hello 加密世界';
    }

    updateKeyBadge();
    updateIvBadge();
    updateStats();

    return {
      root: root,
      encrypt: doEncrypt,
      decrypt: doDecrypt,
      find: function (options) {
        return ensureFinder().show(options && options.replace);
      }
    };
  }

  var instance = null;

  TB.register({
    id: 'crypto',
    group: '加解密',
    title: 'AES 加解密',
    desc: 'AES-128/192/256，CBC / CTR / GCM 三种模式',
    icon: 'i-lock',
    keywords: ['aes', 'encrypt', 'decrypt', 'cbc', 'gcm', 'ctr', '加密', '解密'],
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], label: '加密' },
      { keys: ['Ctrl', 'F'], label: '查找' }
    ],
    run: function () {
      if (instance) instance.encrypt();
    },
    find: function (options) {
      if (instance) return instance.find(options);
      return false;
    },
    mount: function (host) {
      instance = build();
      host.appendChild(instance.root);
    }
  });
})();
