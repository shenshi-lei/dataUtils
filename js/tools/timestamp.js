/* =========================================================
 * 工具：时间戳转换
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;
  var DF = window.DateFormat;

  function build() {
    var state = {
      live: true,
      displayZone: 'local',
      parseZone: 'local'
    };

    var root = ui.el('section', 't-page');
    root.appendChild(ui.head({
      icon: 'i-clock',
      title: '时间戳转换',
      desc: '秒 / 毫秒 / 微秒时间戳与本地、UTC、常用时区互转，支持相对时间与严格日期校验。',
      search: true
    }));

    /* ---------------- 工具栏 ---------------- */

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');

    var zoneSelect = ui.el('select', 't-select');
    zoneSelect.setAttribute('aria-label', '显示时区');
    DF.ZONES.forEach(function (zone) {
      var option = ui.el('option', '', zone.label);
      option.value = zone.id;
      zoneSelect.appendChild(option);
    });
    options.appendChild(ui.field('显示时区', zoneSelect));

    var liveBox = ui.checkbox('实时刷新', { checked: true });
    options.appendChild(liveBox.label);
    toolbar.appendChild(options);

    var actions = ui.el('div', 't-actions');

    var searchBtn = ui.miniButton('查找', {
      icon: 'i-search',
      title: '在页签内查找 (Ctrl+F)',
      onClick: function () { TB.find(); }
    });

    var nowBtn = ui.el('button', 'btn btn-ghost btn-sm');
    nowBtn.type = 'button';
    nowBtn.appendChild(ui.icon('i-clock'));
    nowBtn.appendChild(document.createTextNode('用当前时间'));

    actions.appendChild(searchBtn);
    actions.appendChild(nowBtn);
    toolbar.appendChild(actions);

    root.appendChild(toolbar);

    /* ---------- 当前时间（单行条，不占一整个卡片） ---------- */

    var liveCard = ui.el('section', 't-col');
    liveCard.classList.add('t-live');
    liveCard.appendChild(ui.colHead('当前时间', {
      badge: null,
      actions: [
        ui.miniButton('复制全部', {
          icon: 'i-copy',
          title: '复制秒级、毫秒级与本地时间',
          onClick: function () {
            var now = new Date();
            var text = [
              '秒级: ' + Math.floor(now.getTime() / 1000),
              '毫秒级: ' + now.getTime(),
              '本地: ' + DF.format(now, 'YYYY-MM-DD HH:mm:ss.SSS', { timeZone: 'local' }),
              'UTC: ' + DF.format(now, 'YYYY-MM-DD HH:mm:ss.SSS', { timeZone: 'UTC' })
            ].join('\n');
            ui.copyText(text).then(function (ok) { ui.toast(ok ? '已复制' : '复制失败'); });
          }
        })
      ]
    }));

    var liveBody = ui.el('div', 't-col-body t-live-body');
    var liveRows = ui.el('div', 't-rows t-rows-compact');
    liveBody.appendChild(liveRows);
    liveCard.appendChild(liveBody);
    root.appendChild(liveCard);

    /* ---------- 双栏 ---------- */

    var cols = ui.el('div', 't-cols');

    /* 左：时间戳 → 时间 */
    var left = ui.el('section', 't-col');
    left.appendChild(ui.colHead('时间戳 → 时间', {
      actions: [
        ui.miniButton('现在', {
          icon: 'i-clock',
          title: '填入当前毫秒时间戳',
          onClick: function () {
            tsInput.value = String(Date.now());
            unitSelect.value = 'auto';
            renderTimestamp();
          }
        })
      ]
    }));

    var leftBody = ui.el('div', 't-col-body');

    var tsInput = ui.el('input', 't-input');
    tsInput.type = 'text';
    tsInput.placeholder = '例如 1763552614 / 1763552614000';
    tsInput.setAttribute('aria-label', '时间戳');
    tsInput.inputMode = 'numeric';

    var unitSelect = ui.el('select', 't-select');
    unitSelect.setAttribute('aria-label', '时间戳单位');
    [['auto', '自动识别'], ['s', '秒（10 位）'], ['ms', '毫秒（13 位）'], ['us', '微秒（16 位）']].forEach(function (item) {
      var option = ui.el('option', '', item[1]);
      option.value = item[0];
      unitSelect.appendChild(option);
    });

    var tsInline = ui.el('div', 't-inline');
    tsInline.appendChild(tsInput);
    tsInline.appendChild(unitSelect);
    leftBody.appendChild(ui.field('时间戳', tsInline, '自动识别按位数判断：10 位=秒，13 位=毫秒，16 位=微秒'));

    var tsError = ui.el('p', 't-error');
    leftBody.appendChild(tsError);

    var tsRows = ui.el('div', 't-rows');
    leftBody.appendChild(tsRows);
    left.appendChild(leftBody);

    /* 右：时间 → 时间戳 */
    var right = ui.el('section', 't-col');
    right.appendChild(ui.colHead('时间 → 时间戳', {
      actions: [
        ui.miniButton('现在', {
          icon: 'i-clock',
          title: '填入当前本地时间',
          onClick: function () {
            dateInput.value = DF.format(new Date(), 'YYYY-MM-DD HH:mm:ss', { timeZone: 'local' });
            inputZoneSelect.value = 'local';
            renderDate();
          }
        })
      ]
    }));

    var rightBody = ui.el('div', 't-col-body');

    var dateInput = ui.el('input', 't-input');
    dateInput.type = 'text';
    dateInput.placeholder = '例如 2026-11-19 22:03:34';
    dateInput.setAttribute('aria-label', '日期时间');

    var dateInline = ui.el('div', 't-inline');
    dateInline.appendChild(dateInput);
    rightBody.appendChild(ui.field('日期时间', dateInline, '支持 2026-11-19、2026/11/19 22:03、2026-11-19T14:03:34Z 等格式'));

    var inputZoneSelect = ui.el('select', 't-select');
    inputZoneSelect.setAttribute('aria-label', '输入时区');
    DF.ZONES.forEach(function (zone) {
      var option = ui.el('option', '', zone.label);
      option.value = zone.id;
      inputZoneSelect.appendChild(option);
    });
    rightBody.appendChild(ui.field('输入时区', inputZoneSelect));

    var dateError = ui.el('p', 't-error');
    rightBody.appendChild(dateError);

    var dateRows = ui.el('div', 't-rows');
    rightBody.appendChild(dateRows);
    right.appendChild(rightBody);

    cols.appendChild(left);
    cols.appendChild(right);
    root.appendChild(cols);

    /* ---------------- 查找 ---------------- */

    var finder = null;

    function ensureFinder() {
      if (finder) return finder;

      /* 时间戳页签没有大段文本，直接在结果区做只读查找 */
      finder = window.Finder.attach(root, {
        label: '时间戳查找',
        scope: '结果列表',
        targets: [root]
      });
      return finder;
    }

    /* ---------------- 组件 ---------------- */

    function makeRow(label, value, copyValue, sub) {
      var row = ui.el('div', 't-row');
      row.appendChild(ui.el('div', 't-row-key', label));

      var val = ui.el('div', 't-row-val');
      var main = ui.el('div', 't-row-main', value || '—');
      if (!value) main.classList.add('is-muted');
      val.appendChild(main);

      if (sub) val.appendChild(ui.el('div', 't-row-sub', sub));

      row.appendChild(val);

      var act = ui.el('div', 't-row-act');
      if (value) {
        act.appendChild(ui.miniButton('', {
          icon: 'i-copy',
          title: '复制' + label,
          onClick: function () {
            ui.copyText(copyValue === undefined ? value : copyValue).then(function (ok) {
              ui.toast(ok ? label + ' 已复制' : '复制失败');
            });
          }
        }));
      }
      row.appendChild(act);
      return row;
    }

    function replaceRows(box, items) {
      box.textContent = '';
      items.forEach(function (item) {
        box.appendChild(makeRow(item.label, item.value, item.copy, item.sub));
      });
    }

    /* ---------------- 逻辑 ---------------- */

    function renderLive() {
      var now = new Date();
      var zone = state.displayZone;
      var seconds = Math.floor(now.getTime() / 1000);

      var items = [
        { label: '秒级', value: String(seconds) },
        { label: '毫秒级', value: String(now.getTime()) },
        {
          label: '本地时间',
          value: DF.format(now, 'YYYY-MM-DD HH:mm:ss.SSS', { timeZone: 'local' }),
          sub: DF.weekday(now, { timeZone: 'local' }) + ' · ' + DF.format(now, 'ZZ', { timeZone: 'local' })
        },
        { label: 'UTC', value: DF.format(now, 'YYYY-MM-DD HH:mm:ss.SSS', { timeZone: 'UTC' }) + 'Z' }
      ];

      if (zone !== 'local' && zone !== 'UTC') {
        items.push({
          label: zone,
          value: DF.format(now, 'YYYY-MM-DD HH:mm:ss.SSS', { timeZone: zone }),
          sub: DF.format(now, 'ZZ', { timeZone: zone }) + ' · ' + DF.weekday(now, { timeZone: zone })
        });
      }

      replaceRows(liveRows, items);
    }

    function renderTimestamp() {
      var source = tsInput.value.trim();
      tsError.textContent = '';
      tsRows.textContent = '';

      if (!source) return;

      var parsed;
      try {
        parsed = DF.parseTimestamp(source, { unit: unitSelect.value });
      } catch (err) {
        tsError.textContent = err.message;
        return;
      }

      var date = parsed.date;
      var zone = state.displayZone;
      var unitLabel = parsed.unit === 's' ? '秒' : parsed.unit === 'ms' ? '毫秒' : '微秒';

      var items = [
        {
          label: '本地时间',
          value: DF.format(date, 'YYYY-MM-DD HH:mm:ss.SSS', { timeZone: 'local' }),
          sub: DF.weekday(date, { timeZone: 'local' }) + ' · ' + DF.format(date, 'ZZ', { timeZone: 'local' })
        },
        { label: 'ISO 8601', value: DF.iso(date, { timeZone: zone }) },
        { label: 'UTC', value: DF.format(date, 'YYYY-MM-DD HH:mm:ss.SSS', { timeZone: 'UTC' }) + 'Z' },
        { label: 'RFC 2822', value: DF.rfc2822(date) },
        {
          label: '相对现在',
          value: DF.relative(date),
          sub: parsed.unit === 'us' ? '微秒时间戳已按毫秒精度取整' : '识别单位：' + unitLabel
        }
      ];

      if (zone !== 'local' && zone !== 'UTC') {
        items.splice(1, 0, {
          label: '所选时区',
          value: DF.format(date, 'YYYY-MM-DD HH:mm:ss.SSS', { timeZone: zone }),
          sub: DF.format(date, 'ZZ', { timeZone: zone }) + ' · ' + zone
        });
      }

      /* 额外转换：秒 / 毫秒 / 微秒三种形态都能直接拿走 */
      items.push({
        label: '秒级',
        value: String(Math.floor(date.getTime() / 1000)),
        copy: String(Math.floor(date.getTime() / 1000))
      });
      items.push({
        label: '毫秒级',
        value: String(date.getTime()),
        copy: String(date.getTime())
      });

      replaceRows(tsRows, items);
    }

    function renderDate() {
      var source = dateInput.value.trim();
      dateError.textContent = '';
      dateRows.textContent = '';

      if (!source) return;

      var parsed;
      try {
        parsed = DF.parse(source, { zone: inputZoneSelect.value });
      } catch (err) {
        dateError.textContent = err.message;
        return;
      }

      var date = parsed.date;
      var seconds = Math.floor(date.getTime() / 1000);
      var zone = state.displayZone;

      var items = [
        { label: '秒级', value: String(seconds), copy: String(seconds) },
        { label: '毫秒级', value: String(date.getTime()), copy: String(date.getTime()) },
        { label: 'ISO 8601', value: DF.iso(date, { timeZone: zone }) },
        {
          label: 'UTC',
          value: DF.format(date, 'YYYY-MM-DD HH:mm:ss.SSS', { timeZone: 'UTC' }) + 'Z'
        },
        {
          label: '本地时间',
          value: DF.format(date, 'YYYY-MM-DD HH:mm:ss.SSS', { timeZone: 'local' }),
          sub: DF.weekday(date, { timeZone: 'local' })
        },
        { label: '相对现在', value: DF.relative(date) }
      ];

      replaceRows(dateRows, items);
    }

    /* ---------------- 事件 ---------------- */

    zoneSelect.addEventListener('change', function () {
      state.displayZone = zoneSelect.value;
      renderLive();
      renderTimestamp();
      renderDate();
    });

    liveBox.input.addEventListener('change', function () {
      state.live = liveBox.input.checked;
      if (state.live) renderLive();
    });

    tsInput.addEventListener('input', ui.debounce(renderTimestamp, 150));
    unitSelect.addEventListener('change', renderTimestamp);
    dateInput.addEventListener('input', ui.debounce(renderDate, 150));
    inputZoneSelect.addEventListener('change', renderDate);

    nowBtn.addEventListener('click', useNow);

    function useNow() {
      var now = new Date();
      tsInput.value = String(now.getTime());
      unitSelect.value = 'ms';
      dateInput.value = DF.format(now, 'YYYY-MM-DD HH:mm:ss', { timeZone: 'local' });
      inputZoneSelect.value = 'local';
      renderTimestamp();
      renderDate();
    }

    var timer = setInterval(function () {
      if (!state.live) return;
      if (!root.isConnected) return;
      var section = root.closest ? root.closest('.view') : null;
      if (section && section.hidden) return;
      renderLive();
    }, 1000);

    /* 首屏 */
    var now = new Date();
    tsInput.value = String(now.getTime());
    dateInput.value = DF.format(now, 'YYYY-MM-DD HH:mm:ss', { timeZone: 'local' });
    renderLive();
    renderTimestamp();
    renderDate();

    return {
      root: root,
      useNow: useNow,
      find: function (options) {
        return ensureFinder().show(options && options.replace);
      },
      destroy: function () { clearInterval(timer); }
    };
  }

  var instance = null;

  TB.register({
    id: 'timestamp',
    group: '时间',
    title: '时间戳',
    desc: '秒 / 毫秒时间戳与日期互转，含相对时间与时区',
    icon: 'i-clock',
    keywords: ['timestamp', 'time', 'unix', '日期', '时间戳', '时区'],
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], label: '用当前时间' },
      { keys: ['Ctrl', 'F'], label: '查找' }
    ],
    run: function () {
      if (instance) instance.useNow();
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
