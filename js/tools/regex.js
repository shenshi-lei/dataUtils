/* =========================================================
 * 工具：正则表达式测试
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;

  var MAX_TEXT = 200000;
  var MAX_MATCHES = 1000;
  var MAX_LIST = 200;

  var FLAGS = [
    { flag: 'i', title: '忽略大小写' },
    { flag: 'm', title: '多行模式（^ $ 匹配每行）' },
    { flag: 's', title: 'dotAll（. 匹配换行）' },
    { flag: 'u', title: 'Unicode 模式' },
    { flag: 'y', title: '粘性匹配（从 lastIndex 开始）' }
  ];

  function escapeHtml(text) {
    return String(text === null || text === undefined ? '' : text).replace(/[&<>"']/g, function (ch) {
      if (ch === '&') return '&amp;';
      if (ch === '<') return '&lt;';
      if (ch === '>') return '&gt;';
      if (ch === '"') return '&quot;';
      return '&#39;';
    });
  }

  function lineColumnAt(text, index) {
    var line = 1;
    var lastBreak = -1;

    for (var i = 0; i < index && i < text.length; i++) {
      if (text.charCodeAt(i) === 10) {
        line++;
        lastBreak = i;
      }
    }

    return { line: line, column: index - lastBreak };
  }

  function build() {
    var state = {
      flags: { i: false, m: false, s: false, u: false, y: false }
    };

    var root = ui.el('section', 'view');
    root.appendChild(ui.head({
      icon: 'i-search',
      title: '正则测试',
      desc: '实时高亮全部匹配并列出捕获组；始终列举全部匹配，列表最多 ' + MAX_LIST + ' 条。'
    }));

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');

    var patternInput = ui.el('input', 't-input');
    patternInput.type = 'text';
    patternInput.placeholder = '输入正则，例如 (\\w+)@(\\w+\\.\\w+) 或 (?<name>\\d+)';
    patternInput.setAttribute('aria-label', '正则表达式');
    patternInput.style.minWidth = '320px';
    patternInput.style.flex = '1';

    options.appendChild(ui.field('正则', patternInput));

    var flagBoxes = ui.el('div', 't-inline');
    FLAGS.forEach(function (item) {
      var button = ui.el('button', 'find-opt');
      button.type = 'button';
      button.textContent = item.flag;
      button.title = item.title;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', item.flag + '：' + item.title);

      button.addEventListener('click', function () {
        state.flags[item.flag] = !state.flags[item.flag];
        button.setAttribute('aria-pressed', state.flags[item.flag] ? 'true' : 'false');
        compute();
      });

      flagBoxes.appendChild(button);
    });
    options.appendChild(ui.field('修饰符', flagBoxes));
    toolbar.appendChild(options);

    var actions = ui.el('div', 't-actions');
    var sampleBtn = ui.el('button', 'btn btn-ghost btn-sm');
    sampleBtn.type = 'button';
    sampleBtn.textContent = '示例';

    var clearBtn = ui.miniButton('清空', {
      icon: 'i-trash',
      danger: true,
      onClick: function () {
        patternInput.value = '';
        textArea.value = '';
        render(null);
        patternInput.focus();
      }
    });

    actions.appendChild(sampleBtn);
    actions.appendChild(clearBtn);
    toolbar.appendChild(actions);
    root.appendChild(toolbar);

    var cols = ui.el('div', 't-cols');

    /* 测试文本 */
    var textCol = ui.el('section', 't-col');
    var textArea = ui.textarea('在此输入要匹配的文本…', { label: '测试文本' });
    textArea.classList.add('is-mono-big');
    textCol.appendChild(ui.colHead('测试文本', {
      actions: [ui.miniButton('粘贴', {
        icon: 'i-upload',
        onClick: function () {
          if (!navigator.clipboard || !navigator.clipboard.readText) {
            ui.toast('当前浏览器不允许读取剪贴板，请手动粘贴');
            return;
          }
          navigator.clipboard.readText().then(function (text) {
            textArea.value = text;
            compute();
          }, function () { ui.toast('读取剪贴板失败'); });
        }
      })]
    }));
    var textBody = ui.el('div', 't-col-body');
    textBody.appendChild(textArea);
    var textStats = ui.el('div', 't-stats');
    textBody.appendChild(textStats);
    textCol.appendChild(textBody);

    /* 结果 */
    var resultCol = ui.el('section', 't-col');
    resultCol.appendChild(ui.colHead('匹配结果'));
    var resultBody = ui.el('div', 't-col-body');
    var scroll = ui.el('div', 't-scroll');

    var errorText = ui.el('p', 't-error');
    scroll.appendChild(errorText);

    var highlight = ui.el('pre', 't-highlight');
    highlight.textContent = '';
    scroll.appendChild(highlight);

    var resultStats = ui.el('div', 't-stats');
    scroll.appendChild(resultStats);

    var listBox = ui.el('div', 't-rows');
    scroll.appendChild(listBox);

    resultBody.appendChild(scroll);
    resultCol.appendChild(resultBody);

    cols.appendChild(textCol);
    cols.appendChild(resultCol);
    root.appendChild(cols);

    /* ---------------- 逻辑 ---------------- */

    function activeFlags() {
      var out = '';
      FLAGS.forEach(function (item) {
        if (state.flags[item.flag]) out += item.flag;
      });
      return out;
    }

    function compute() {
      var pattern = patternInput.value;
      var text = textArea.value;

      errorText.textContent = '';

      textStats.textContent = '';
      textStats.appendChild(ui.el('span', 't-stat', '字符 ' + text.length + ' · 行 ' + (text ? text.split('\n').length : 0)));

      if (!pattern) {
        render(null);
        return;
      }

      if (text.length > MAX_TEXT) {
        errorText.textContent = '文本超过 ' + MAX_TEXT + ' 字符，请缩短后再测试（避免页面卡死）';
        render(null);
        return;
      }

      var flags = activeFlags();
      var regex;

      try {
        regex = new RegExp(pattern, flags.indexOf('g') >= 0 ? flags : flags + 'g');
      } catch (err) {
        errorText.textContent = '正则表达式无效：' + err.message;
        render(null);
        return;
      }

      var matches = [];
      var truncated = false;
      var started = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      var match;

      while ((match = regex.exec(text)) !== null) {
        matches.push({
          index: match.index,
          text: match[0],
          groups: match.slice(1),
          named: match.groups || null
        });

        if (match[0].length === 0) {
          /* 零宽匹配必须手动前进，否则 exec 会原地死循环 */
          var next = match.index + 1;
          if (flags.indexOf('u') >= 0 && text.charCodeAt(match.index) >= 0xd800 && text.charCodeAt(match.index) <= 0xdbff) {
            next++;
          }
          regex.lastIndex = next;
        }

        if (matches.length >= MAX_MATCHES) {
          truncated = true;
          break;
        }

        if (regex.lastIndex > text.length) break;
      }

      var elapsed = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - started);

      render({ matches: matches, text: text, truncated: truncated, elapsed: elapsed });
    }

    function render(result) {
      highlight.textContent = '';
      listBox.textContent = '';
      resultStats.textContent = '';

      if (!result) {
        highlight.textContent = textArea.value;
        return;
      }

      var text = result.text;
      var matches = result.matches;

      if (!matches.length) {
        highlight.textContent = text;
        resultStats.appendChild(ui.el('span', 't-stat', '没有匹配'));
        return;
      }

      /* 高亮：只处理有长度的匹配，零宽匹配在列表中标注 */
      var html = '';
      var cursor = 0;

      matches.forEach(function (item) {
        if (item.text.length === 0) return;
        if (item.index < cursor) return;

        html += escapeHtml(text.slice(cursor, item.index));
        html += '<mark>' + escapeHtml(item.text) + '</mark>';
        cursor = item.index + item.text.length;
      });

      html += escapeHtml(text.slice(cursor));
      highlight.innerHTML = html;

      resultStats.appendChild(ui.el('span', 't-stat', '匹配 ' + matches.length + ' 处' + (result.truncated ? '（已截断）' : '')));
      resultStats.appendChild(ui.el('span', 't-stat', '耗时 ' + result.elapsed + ' ms'));

      var shown = matches.slice(0, MAX_LIST);

      shown.forEach(function (item, index) {
        var position = lineColumnAt(text, item.index);
        var row = ui.el('div', 't-row');

        row.appendChild(ui.el('div', 't-row-key', '#' + (index + 1) + ' 行 ' + position.line + ':' + position.column));

        var value = ui.el('div', 't-row-val');

        if (item.text.length === 0) {
          value.appendChild(ui.el('div', 't-hint', '（零宽匹配，位置 ' + item.index + '）'));
        } else {
          var preview = item.text.length > 160 ? item.text.slice(0, 160) + '…' : item.text;
          value.appendChild(ui.el('div', '', preview));
        }

        var extras = [];

        if (item.groups && item.groups.length) {
          var named = item.named || {};
          var nameKeys = Object.keys(named);

          item.groups.forEach(function (group, groupIndex) {
            var label = '$' + (groupIndex + 1);
            extras.push(label + '=' + (group === undefined ? 'undefined' : JSON.stringify(group)));
          });

          nameKeys.forEach(function (key) {
            extras.push('<' + key + '>=' + JSON.stringify(named[key]));
          });
        }

        if (extras.length) {
          var groupLine = ui.el('div', 't-hint');
          groupLine.textContent = extras.join('  ');
          value.appendChild(groupLine);
        }

        row.appendChild(value);

        var act = ui.el('div', 't-row-act');
        act.appendChild(ui.miniButton('', {
          icon: 'i-copy',
          title: '复制匹配内容',
          onClick: function () {
            ui.copyText(item.text).then(function (ok) { ui.toast(ok ? '已复制' : '复制失败'); });
          }
        }));
        row.appendChild(act);

        listBox.appendChild(row);
      });

      if (matches.length > shown.length) {
        var more = ui.el('div', 't-note');
        more.appendChild(ui.icon('i-alert'));
        more.appendChild(ui.el('span', '', '共 ' + matches.length + ' 处匹配，列表只显示前 ' + MAX_LIST + ' 条。'));
        listBox.appendChild(more);
      }
    }

    patternInput.addEventListener('input', ui.debounce(compute, 160));
    textArea.addEventListener('input', ui.debounce(compute, 160));

    sampleBtn.addEventListener('click', function () {
      patternInput.value = '(?<user>[\\w.+-]+)@(?<domain>[\\w-]+\\.[\\w.]+)';
      state.flags.i = true;
      textArea.value = '联系 alice@example.com 或 bob.smith@corp.co.uk，无效地址 a@b。';
      root.querySelectorAll('.find-opt').forEach(function (button) {
        var letter = button.textContent;
        button.setAttribute('aria-pressed', state.flags[letter] ? 'true' : 'false');
      });
      compute();
    });

    /* 首屏 */
    patternInput.value = '\\d+';
    textArea.value = '订单 2026 年共 128 笔，金额 45600 元。';
    compute();

    return { root: root, compute: compute };
  }

  var instance = null;

  TB.register({
    id: 'regex',
    group: '文本',
    title: '正则测试',
    desc: '实时高亮全部匹配，列出捕获组与命名组',
    icon: 'i-search',
    keywords: ['regex', 'regexp', '正则', 'match', '捕获组'],
    shortcuts: [{ keys: ['Ctrl', 'Enter'], label: '重新匹配' }],
    run: function () {
      if (instance) instance.compute();
    },
    mount: function (host) {
      instance = build();
      host.appendChild(instance.root);
    }
  });
})();
