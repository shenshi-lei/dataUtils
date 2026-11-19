/* =========================================================
 * 工具：哈希 / MD5 / HMAC
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;
  var B = window.Bytes;
  var Kit = window.CryptoKit;
  var MD5 = window.MD5;

  var ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

  function hexOf(bytes, upper) {
    var hex = B.bytesToHex(bytes);
    return upper ? hex.toUpperCase() : hex;
  }

  function build() {
    var state = {
      selected: { MD5: true, 'SHA-256': true },
      hmac: false,
      hmacAlgo: 'SHA-256',
      upper: false,
      run: 0,
      results: []
    };

    var root = ui.el('section', 'view');
    root.appendChild(ui.head({
      icon: 'i-hash',
      title: '哈希 / MD5',
      desc: 'MD5、SHA-1、SHA-256/384/512 与 HMAC 摘要，输入内容不会离开本机。'
    }));

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');

    var boxes = {};
    ALGORITHMS.forEach(function (name) {
      var box = ui.checkbox(name, { checked: !!state.selected[name] });
      box.input.addEventListener('change', function () {
        state.selected[name] = box.input.checked;
        compute();
      });
      boxes[name] = box;
      options.appendChild(box.label);
    });

    var upperBox = ui.checkbox('大写十六进制', {});
    upperBox.input.addEventListener('change', function () {
      state.upper = upperBox.input.checked;
      compute();
    });
    options.appendChild(upperBox.label);

    toolbar.appendChild(options);

    var actions = ui.el('div', 't-actions');
    var copyAllBtn = ui.miniButton('复制全部', {
      icon: 'i-copy',
      onClick: function () {
        if (!state.results.length) {
          ui.toast('还没有结果');
          return;
        }
        var text = state.results.map(function (item) {
          return item.label + ': ' + item.hex;
        }).join('\n');
        ui.copyText(text).then(function (ok) { ui.toast(ok ? '已复制全部结果' : '复制失败'); });
      }
    });
    var clearBtn = ui.miniButton('清空', {
      icon: 'i-trash',
      danger: true,
      onClick: function () {
        inputArea.value = '';
        compute();
        inputArea.focus();
      }
    });
    actions.appendChild(copyAllBtn);
    actions.appendChild(clearBtn);
    toolbar.appendChild(actions);
    root.appendChild(toolbar);

    /* HMAC 配置条 */
    var hmacBar = ui.el('div', 't-toolbar');
    var hmacOptions = ui.el('div', 't-options');

    var hmacBox = ui.checkbox('启用 HMAC', {});
    hmacOptions.appendChild(hmacBox.label);

    var hmacSelect = ui.el('select', 't-select');
    hmacSelect.setAttribute('aria-label', 'HMAC 摘要算法');
    ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].forEach(function (name) {
      var option = ui.el('option', '', name);
      option.value = name;
      if (name === state.hmacAlgo) option.selected = true;
      hmacSelect.appendChild(option);
    });

    var keyInput = ui.el('input', 't-input');
    keyInput.type = 'text';
    keyInput.placeholder = 'HMAC 密钥（按 UTF-8 处理）';
    keyInput.setAttribute('aria-label', 'HMAC 密钥');
    keyInput.style.minWidth = '220px';

    hmacOptions.appendChild(ui.field('算法', hmacSelect));
    var keyField = ui.field('密钥', keyInput);
    hmacOptions.appendChild(keyField);
    hmacBar.appendChild(hmacOptions);

    var hmacHint = ui.note('HMAC 使用 UTF-8 字节作为密钥；MD5 不支持 HMAC。', null, 'i-alert');
    hmacBar.appendChild(hmacHint);
    hmacBar.hidden = true;
    root.appendChild(hmacBar);

    var unavailable = ui.el('div', 't-note is-warn');
    unavailable.hidden = true;
    root.appendChild(unavailable);

    /* 双栏 */
    var cols = ui.el('div', 't-cols');

    var inputCol = ui.el('section', 't-col');
    var inputArea = ui.textarea('在此输入需要计算摘要的文本…', { label: '待计算文本' });
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
          compute();
        }, function () { ui.toast('读取剪贴板失败'); });
      }
    });
    inputCol.appendChild(ui.colHead('输入', { actions: [pasteBtn] }));
    var inputBody = ui.el('div', 't-col-body');
    inputBody.appendChild(inputArea);
    var inputStats = ui.el('div', 't-stats');
    inputBody.appendChild(inputStats);
    inputCol.appendChild(inputBody);

    var outputCol = ui.el('section', 't-col');
    var refreshBtn = ui.miniButton('重新计算', { icon: 'i-sparkles', onClick: function () { compute(); } });
    outputCol.appendChild(ui.colHead('摘要结果', { actions: [refreshBtn] }));

    var outputBody = ui.el('div', 't-col-body');
    var rowsScroll = ui.el('div', 't-scroll');
    var rowsBox = ui.el('div', 't-rows');
    rowsScroll.appendChild(rowsBox);
    outputBody.appendChild(rowsScroll);

    var errorText = ui.el('p', 't-error');
    outputBody.appendChild(errorText);
    var resultNote = ui.el('div', 't-note is-warn');
    resultNote.hidden = true;
    resultNote.appendChild(ui.icon('i-alert'));
    resultNote.appendChild(ui.el('span', '', 'MD5 与 SHA-1 已被证明存在碰撞，只能用于校验完整性，不要用于密码存储或签名。'));
    outputBody.appendChild(resultNote);
    outputCol.appendChild(outputBody);

    cols.appendChild(inputCol);
    cols.appendChild(outputCol);
    root.appendChild(cols);

    /* ---------------- 逻辑 ---------------- */

    function selectedList() {
      return ALGORITHMS.filter(function (name) { return state.selected[name]; });
    }

    function compute() {
      var runId = ++state.run;
      var text = inputArea.value;
      var bytes = B.utf8Encode(text);

      inputStats.textContent = '';
      inputStats.appendChild(ui.el('span', 't-stat', '字符 ' + text.length + ' · 字节 ' + bytes.length));

      errorText.textContent = '';

      var jobs = selectedList().map(function (name) {
        if (name === 'MD5') {
          var digest = MD5.digestBytes(bytes);
          return Promise.resolve({
            label: 'MD5',
            hex: hexOf(digest, state.upper),
            base64: B.bytesToBase64(digest),
            bytes: digest.length
          });
        }

        return Kit.digest(name, bytes).then(function (digest) {
          return {
            label: name,
            hex: hexOf(digest, state.upper),
            base64: B.bytesToBase64(digest),
            bytes: digest.length
          };
        });
      });

      if (state.hmac) {
        jobs.push(
          Kit.hmac(state.hmacAlgo, B.utf8Encode(keyInput.value), bytes).then(function (mac) {
            return {
              label: 'HMAC-' + state.hmacAlgo,
              hex: hexOf(mac, state.upper),
              base64: B.bytesToBase64(mac),
              bytes: mac.length
            };
          })
        );
      }

      Promise.all(jobs).then(function (list) {
        if (runId !== state.run) return;
        state.results = list;
        render(list);
      }).catch(function (error) {
        if (runId !== state.run) return;
        state.results = [];
        rowsBox.textContent = '';
        errorText.textContent = Kit.describeError(error) || (error && error.message) || '计算失败';
      });
    }

    function render(list) {
      rowsBox.textContent = '';

      if (!list.length) {
        rowsBox.appendChild(ui.empty('请至少选择一种摘要算法', 'i-hash'));
        return;
      }

      list.forEach(function (item) {
        var row = ui.el('div', 't-row');

        row.appendChild(ui.el('div', 't-row-key', item.label));

        var value = ui.el('div', 't-row-val');
        value.appendChild(ui.el('div', '', item.hex));
        var sub = ui.el('div', 't-hint');
        sub.textContent = 'Base64: ' + item.base64;
        value.appendChild(sub);
        row.appendChild(value);

        var actions2 = ui.el('div', 't-row-act');
        actions2.appendChild(ui.miniButton('', {
          icon: 'i-copy',
          title: '复制 ' + item.label,
          onClick: function () {
            ui.copyText(item.hex).then(function (ok) {
              ui.toast(ok ? item.label + ' 已复制' : '复制失败');
            });
          }
        }));
        row.appendChild(actions2);

        rowsBox.appendChild(row);
      });
    }

    function syncHmac() {
      state.hmac = hmacBox.input.checked;
      state.hmacAlgo = hmacSelect.value;
      hmacBar.hidden = !state.hmac;
      hmacSelect.disabled = !state.hmac;
      keyInput.disabled = !state.hmac;
      compute();
    }

    hmacBox.input.addEventListener('change', syncHmac);
    hmacSelect.addEventListener('change', syncHmac);
    keyInput.addEventListener('input', ui.debounce(function () {
      if (state.hmac) compute();
    }, 200));
    inputArea.addEventListener('input', ui.debounce(compute, 180));

    /* 首屏可用性提示 */
    if (!Kit.available()) {
      unavailable.hidden = false;
      unavailable.textContent = '';
      unavailable.appendChild(ui.icon('i-alert'));
      unavailable.appendChild(ui.el('span', '', Kit.unavailableReason() + '（MD5 仍可使用）'));
      ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].forEach(function (name) {
        boxes[name].input.disabled = true;
      });
      hmacBox.input.disabled = true;
    }

    inputArea.value = 'hello world';
    syncHmac();
    compute();

    return { root: root, compute: compute };
  }

  var instance = null;

  TB.register({
    id: 'hash',
    group: '加解密',
    title: '哈希 / MD5',
    desc: 'MD5、SHA-1、SHA-256/384/512 与 HMAC 摘要计算',
    icon: 'i-hash',
    keywords: ['md5', 'sha', 'sha1', 'sha256', 'hmac', 'hash', '摘要'],
    shortcuts: [{ keys: ['Ctrl', 'Enter'], label: '重新计算' }],
    run: function () {
      if (instance) instance.compute();
    },
    mount: function (host) {
      instance = build();
      host.appendChild(instance.root);
    }
  });
})();
