/* =========================================================
 * 工具：JWT 解析（只解码，不验签）
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;
  var JWT = window.JWT;
  var DF = window.DateFormat;

  function build() {
    var root = ui.el('section', 't-page');
    root.appendChild(ui.head({
      icon: 'i-key',
      title: 'JWT 解析',
      desc: '解码 Header 与 Payload 并检查时间声明；只做解码，不验证签名，也不发送任何网络请求。',
      search: true
    }));

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');
    var tip = ui.el('span', 'view-tag');
    tip.appendChild(ui.icon('i-alert'));
    tip.appendChild(document.createTextNode('未验签 · 仅解码'));
    options.appendChild(tip);
    toolbar.appendChild(options);

    var actions = ui.el('div', 't-actions');

    var searchBtn = ui.miniButton('查找', {
      icon: 'i-search',
      title: '在 Token 与解析结果中查找 (Ctrl+F)',
      onClick: function () { TB.find(); }
    });

    var sampleBtn = ui.el('button', 'btn btn-ghost btn-sm');
    sampleBtn.type = 'button';
    sampleBtn.textContent = '示例 token';

    var clearBtn = ui.miniButton('清空', { icon: 'i-trash', danger: true });

    actions.appendChild(searchBtn);
    actions.appendChild(sampleBtn);
    actions.appendChild(clearBtn);
    toolbar.appendChild(actions);
    root.appendChild(toolbar);

    var cols = ui.el('div', 't-cols');

    /* 输入 */
    var inputCol = ui.el('section', 't-col');
    var inputArea = ui.textarea('粘贴 JWT，例如 eyJhbGciOi…（可带 Bearer 前缀）', { label: 'JWT 内容' });
    inputArea.classList.add('is-mono-big');
    inputCol.appendChild(ui.colHead('Token', {
      actions: [ui.copyButton(function () { return inputArea.value; }, '复制')]
    }));
    var inputBody = ui.el('div', 't-col-body');
    inputBody.appendChild(inputArea);
    var inputStats = ui.el('div', 't-stats');
    inputBody.appendChild(inputStats);
    inputCol.appendChild(inputBody);

    /* 输出 */
    var outputCol = ui.el('section', 't-col');
    outputCol.appendChild(ui.colHead('解析结果'));

    var outputBody = ui.el('div', 't-col-body');
    var scroll = ui.el('div', 't-scroll');

    var errorText = ui.el('p', 't-error');
    scroll.appendChild(errorText);

    var summaryWrap = ui.el('div');
    summaryWrap.appendChild(ui.el('p', 't-label', '概要'));
    var summaryBox = ui.el('dl', 't-kv');
    summaryWrap.appendChild(summaryBox);

    var headerTitle = ui.el('div', 't-inline');
    headerTitle.appendChild(ui.el('p', 't-label', 'Header'));
    var headerCopy = ui.copyButton(function () { return headView.getValue(); }, '复制');
    headerTitle.appendChild(headerCopy);

    var headView = ui.codeView({ language: 'json', placeholder: '' });
    headView.root.style.minHeight = '96px';

    var payloadTitle = ui.el('div', 't-inline');
    payloadTitle.appendChild(ui.el('p', 't-label', 'Payload'));
    var payloadCopy = ui.copyButton(function () { return payloadView.getValue(); }, '复制');
    payloadTitle.appendChild(payloadCopy);

    var payloadView = ui.codeView({ language: 'json', placeholder: '' });
    payloadView.root.style.minHeight = '130px';

    var signatureNote = ui.el('div', 't-note is-warn');

    scroll.appendChild(summaryWrap);
    scroll.appendChild(headerTitle);
    scroll.appendChild(headView.root);
    scroll.appendChild(payloadTitle);
    scroll.appendChild(payloadView.root);
    scroll.appendChild(signatureNote);

    outputBody.appendChild(scroll);
    outputCol.appendChild(outputBody);

    cols.appendChild(inputCol);
    cols.appendChild(outputCol);
    root.appendChild(cols);

    /* ---------------- 查找 ---------------- */

    var finder = null;

    function ensureFinder() {
      if (finder) return finder;

      finder = window.Finder.attach(root, {
        label: 'JWT 查找',
        scope: 'Token + 解析结果',
        targets: [inputArea, headView.pre, payloadView.pre],
        getText: function () {
          return headView.getValue() + '\n' + payloadView.getValue();
        }
      });
      return finder;
    }

    /* ---------------- 逻辑 ---------------- */

    function timeCell(value) {
      if (typeof value !== 'number' || !isFinite(value)) return '';
      return DF.format(new Date(value * 1000), 'YYYY-MM-DD HH:mm:ss', { timeZone: 'local' }) + '（本地）';
    }

    function addSummary(term, value) {
      summaryBox.appendChild(ui.el('dt', '', term));
      summaryBox.appendChild(ui.el('dd', '', value));
    }

    function setDetailVisible(visible) {
      summaryWrap.hidden = !visible;
      headerTitle.hidden = !visible;
      headView.root.hidden = !visible;
      payloadTitle.hidden = !visible;
      payloadView.root.hidden = !visible;
      signatureNote.hidden = !visible;
    }

    function render() {
      var raw = inputArea.value;
      errorText.textContent = '';
      summaryBox.textContent = '';
      headView.setValue('');
      payloadView.setValue('');

      var token = JWT.normalize(raw);

      inputStats.textContent = '';
      if (token) inputStats.appendChild(ui.el('span', 't-stat', '长度 ' + token.length + ' 字符'));

      if (!token) {
        setDetailVisible(false);
        return;
      }

      var decoded;

      try {
        decoded = JWT.decode(raw);
      } catch (err) {
        setDetailVisible(false);
        errorText.textContent = err.message;
        return;
      }

      setDetailVisible(true);

      var header = decoded.header || {};
      var payload = decoded.payload || {};

      if (typeof header === 'object' && header !== null) {
        addSummary('alg', String(header.alg === undefined ? '—' : header.alg));
        if (header.typ !== undefined) addSummary('typ', String(header.typ));
        if (header.kid !== undefined) addSummary('kid', String(header.kid));
      }

      if (typeof payload === 'object' && payload !== null) {
        var now = Date.now() / 1000;

        if (typeof payload.exp === 'number') {
          addSummary('exp', timeCell(payload.exp) + (payload.exp < now ? ' · 已过期' : ' · 未过期'));
        }
        if (typeof payload.iat === 'number') addSummary('iat', timeCell(payload.iat));
        if (typeof payload.nbf === 'number') {
          addSummary('nbf', timeCell(payload.nbf) + (payload.nbf > now ? ' · 尚未生效' : ' · 已生效'));
        }
        if (payload.sub !== undefined) addSummary('sub', String(payload.sub));
      }

      headView.setValue(JSON.stringify(header, null, 2));
      payloadView.setValue(JSON.stringify(payload, null, 2));

      signatureNote.textContent = '';      signatureNote.appendChild(ui.icon('i-alert'));
      signatureNote.appendChild(ui.el('span', '',
        '签名段 ' + decoded.signatureBytes + ' 字节。本工具只做解码展示，不验证签名；' +
        '要确认 token 可信，必须在服务端用密钥或公钥校验。'));
    }

    inputArea.addEventListener('input', ui.debounce(render, 150));

    sampleBtn.addEventListener('click', function () {
      inputArea.value = JWT.sample();
      render();
    });

    clearBtn.addEventListener('click', function () {
      inputArea.value = '';
      render();
      inputArea.focus();
    });

    /* 首屏用示例快速展示 */
    inputArea.value = JWT.sample();
    render();

    return {
      root: root,
      render: render,
      find: function (options) {
        return ensureFinder().show(options && options.replace);
      }
    };
  }

  var instance = null;

  TB.register({
    id: 'jwt',
    group: '数据格式',
    title: 'JWT 解析',
    desc: '解码 Header / Payload 并检查 exp、iat、nbf',
    icon: 'i-key',
    keywords: ['jwt', 'token', 'jose', 'bearer', '解码'],
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], label: '重新解析' },
      { keys: ['Ctrl', 'F'], label: '查找' }
    ],
    run: function () {
      if (instance) instance.render();
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
