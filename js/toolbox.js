/* =========================================================
 * 开发工具箱 — 外壳：工具注册表、hash 路由、通用 UI
 * 纯浏览器端实现，不依赖任何第三方库。
 * ========================================================= */
(function (root) {
  'use strict';

  var STORE_PREFIX = 'toolbox:';
  var DEFAULT_VIEW = 'json';
  var APP_TITLE = '开发工具箱';
  var FALLBACK_SUBTITLE = 'JSON · 加解密 · SQL · 时间戳 · 编码';

  var tools = Object.create(null);
  var order = [];
  var groups = [];
  var active = DEFAULT_VIEW;
  var booted = false;
  var roots = Object.create(null);
  var dom = Object.create(null);
  var toastTimer = 0;

  /* ---------------- 基础工具 ---------------- */

  function byId(id) {
    return document.getElementById(id);
  }

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function storageGet(key, fallback) {
    try {
      var raw = localStorage.getItem(STORE_PREFIX + key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value));
    } catch (err) {
      /* 隐私模式或配额不足时静默降级 */
    }
  }

  function escapeHtml(text) {
    return String(text === null || text === undefined ? '' : text).replace(/[&<>"']/g, function (ch) {
      if (ch === '&') return '&amp;';
      if (ch === '<') return '&lt;';
      if (ch === '>') return '&gt;';
      if (ch === '"') return '&quot;';
      return '&#39;';
    });
  }

  function debounce(fn, wait) {
    var timer = 0;
    function wrapped() {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        timer = 0;
        fn.apply(context, args);
      }, wait);
    }
    wrapped.cancel = function () {
      clearTimeout(timer);
      timer = 0;
    };
    return wrapped;
  }

  function formatBytes(bytes) {
    var value = Number(bytes) || 0;
    if (value < 1024) return value + ' B';
    if (value < 1024 * 1024) return (value / 1024).toFixed(1).replace(/\.0$/, '') + ' KB';
    return (value / 1024 / 1024).toFixed(2).replace(/\.00$/, '') + ' MB';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  /* ---------------- 撤销 / 重做 ---------------- */

  /*
   * 每个工具在 mount 时把自己的「主文本域」登记进来，页面右上角的
   * 撤销 / 重做按钮与 Ctrl+Z / Ctrl+Y 都作用在它上面。
   */
  var historyTargets = Object.create(null);

  /*
   * 工具可能先自己 attach 了 history（为了拿 onChange 更新自己的按钮），
   * 这里在它的 onChange 外面再挂一层，保证顶栏按钮始终同步。
   */
  function bindHistory(input) {
    if (!input || !root.TextHistory) return null;

    var history = root.TextHistory.of(input) || root.TextHistory.attach(input);

    if (!history.__toolboxHooked) {
      history.__toolboxHooked = true;
      var original = history.onChange;

      history.onChange = function (stack) {
        if (typeof original === 'function') original(stack);
        syncHistoryButtons();
      };
    }

    return history;
  }

  function setHistoryTarget(id, input) {
    if (!input) {
      delete historyTargets[id];
      syncHistoryButtons();
      return null;
    }

    historyTargets[id] = input;

    var history = bindHistory(input);
    syncHistoryButtons();
    return history;
  }

  setHistoryTarget.onChange = null;

  function historyTarget(id) {
    var key = id || active;
    var direct = historyTargets[key];
    if (direct && direct.isConnected) return direct;

    /* 工具没登记时，兜底取当前视图里第一个可编辑文本域 */
    var tool = tools[key];
    var view = viewOf(tool);
    if (!view) return null;

    var candidates = view.querySelectorAll('textarea, input[type="text"], input[type="search"]');
    for (var i = 0; i < candidates.length; i++) {
      var node = candidates[i];
      if (node.readOnly || node.offsetParent === null) continue;
      return node;
    }

    return null;
  }

  function undoActive() {
    var input = historyTarget();
    var history = input && root.TextHistory ? root.TextHistory.of(input) : null;
    if (!history) {
      toast('当前页签没有可撤销的编辑');
      return false;
    }

    if (!history.undo()) {
      toast('已经退到最早的一步');
      return false;
    }

    return true;
  }

  function redoActive() {
    var input = historyTarget();
    var history = input && root.TextHistory ? root.TextHistory.of(input) : null;
    if (!history) return false;

    if (!history.redo()) {
      toast('没有可重做的操作');
      return false;
    }

    return true;
  }

  function syncHistoryButtons() {
    if (!dom.undoBtn) return;

    var input = historyTarget();
    var history = input && root.TextHistory ? root.TextHistory.of(input) : null;

    var canUndo = !!(history && history.canUndo());
    var canRedo = !!(history && history.canRedo());

    dom.undoBtn.disabled = !canUndo;
    dom.redoBtn.disabled = !canRedo;
  }

  /**
   * 生成一对撤销 / 重做按钮。工具把它放进自己的标题栏时，
   * 点到的永远是「这个工具登记的主文本域」。
   * @param {HTMLElement} input 该工具的主文本域（可省略，回退到全局当前目标）
   */
  function historyButtons(input) {
    var group = el('div', 'history-group');

    var undoBtn = el('button', 'history-btn');
    undoBtn.type = 'button';
    undoBtn.title = '撤销 (Ctrl+Z)';
    undoBtn.setAttribute('aria-label', '撤销');
    undoBtn.appendChild(icon('i-undo'));
    undoBtn.disabled = true;

    var redoBtn = el('button', 'history-btn');
    redoBtn.type = 'button';
    redoBtn.title = '重做 (Ctrl+Y)';
    redoBtn.setAttribute('aria-label', '重做');
    redoBtn.appendChild(icon('i-redo'));
    redoBtn.disabled = true;

    function history() {
      var node = input && input.isConnected ? input : historyTarget();
      return node && root.TextHistory ? root.TextHistory.of(node) : null;
    }

    function sync() {
      var stack = history();
      undoBtn.disabled = !(stack && stack.canUndo());
      redoBtn.disabled = !(stack && stack.canRedo());
    }

    undoBtn.addEventListener('click', function () {
      var stack = history();
      if (!stack) return;
      if (!stack.undo()) toast('已经退到最早的一步');
    });

    redoBtn.addEventListener('click', function () {
      var stack = history();
      if (!stack) return;
      if (!stack.redo()) toast('没有可重做的操作');
    });

    if (input && root.TextHistory) {
      var attached = bindHistory(input);
      if (attached) attached.onChange = function () { sync(); syncHistoryButtons(); };
    }

    /* 输入与撤销都会改变可用状态，用轻量轮询兜住所有入口 */
    var timer = setInterval(sync, 400);
    group.__stopSync = function () { clearInterval(timer); };

    group.appendChild(undoBtn);
    group.appendChild(redoBtn);

    return { node: group, undoBtn: undoBtn, redoBtn: redoBtn, sync: sync };
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function icon(id, className) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'icon' + (className ? ' ' + className : ''));
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function toast(message) {
    var box = byId('toast');
    var text = byId('toastText');
    if (!box || !text) return;

    text.textContent = message;
    box.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      box.classList.remove('is-visible');
    }, 1900);
  }

  function copyText(text) {
    var value = String(text === null || text === undefined ? '' : text);

    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      return navigator.clipboard.writeText(value).then(
        function () { return true; },
        function () { return legacyCopy(value); }
      );
    }

    return Promise.resolve(legacyCopy(value));
  }

  function legacyCopy(value) {
    try {
      var area = el('textarea');
      area.value = value;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch (err) {
      return false;
    }
  }

  function downloadText(filename, text, mime) {
    try {
      var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = el('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      return true;
    } catch (err) {
      return false;
    }
  }

  /* ---------------- 通用 UI 组件 ---------------- */

  function head(options) {
    options = options || {};
    var wrap = el('header', 'view-head');
    var left = el('div');

    var title = el('h2', 'view-title');
    if (options.icon) title.appendChild(icon(options.icon));
    title.appendChild(document.createTextNode(options.title || ''));
    left.appendChild(title);

    if (options.desc) left.appendChild(el('p', 'view-desc', options.desc));

    wrap.appendChild(left);

    var right = el('div', 'view-head-actions');

    if (options.tag !== false) {
      var tag = el('span', 'view-tag');
      tag.appendChild(icon('i-lock'));
      tag.appendChild(document.createTextNode(options.tag || '本地计算'));
      right.appendChild(tag);
    }

    /* 每个页签右上角都有一个「查找」，Ctrl+F 是同一个入口 */
    if (options.search !== false) {
      var findBtn = el('button', 'mini mini-find view-find-btn');
      findBtn.type = 'button';
      findBtn.title = '在当前页签查找 / 替换 (Ctrl+F)';
      findBtn.setAttribute('aria-label', '在当前页签查找');
      findBtn.appendChild(icon('i-search'));
      findBtn.appendChild(document.createTextNode('查找'));
      findBtn.addEventListener('click', function () {
        globalFind();
      });
      right.appendChild(findBtn);
    }

    wrap.appendChild(right);

    return wrap;
  }

  function colHead(title, options) {
    options = options || {};
    var bar = el('header', 't-col-head');
    var label = el('div', 't-col-title');
    label.appendChild(document.createTextNode(title));
    if (options.badge) label.appendChild(el('span', 'badge', options.badge));
    bar.appendChild(label);

    var actions = el('div', 't-col-actions');
    (options.actions || []).forEach(function (node) {
      if (node) actions.appendChild(node);
    });
    bar.appendChild(actions);

    return bar;
  }

  function miniButton(label, options) {
    options = options || {};
    var btn = el('button', 'mini' + (options.danger ? ' mini-danger' : ''));
    btn.type = 'button';
    if (options.icon) btn.appendChild(icon(options.icon));
    if (label) btn.appendChild(document.createTextNode(label));
    if (options.title) btn.title = options.title;
    if (options.onClick) btn.addEventListener('click', options.onClick);
    return btn;
  }

  function copyButton(getText, label) {
    return miniButton(label || '复制', {
      icon: 'i-copy',
      title: '复制到剪贴板',
      onClick: function () {
        var text = typeof getText === 'function' ? getText() : getText;
        if (!text) {
          toast('没有可复制的内容');
          return;
        }
        copyText(text).then(function (ok) {
          toast(ok ? '已复制到剪贴板' : '复制失败，请手动选择文本');
        });
      }
    });
  }

  function checkbox(labelText, options) {
    options = options || {};
    var label = el('label', 'check');
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!options.checked;
    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + labelText));
    return { label: label, input: input };
  }

  /* 标签在左、控件在右 —— 与 JSON 工具栏的 .field 完全一致 */
  function field(labelText, control, hint) {
    var group = el('div', 't-group is-row');
    if (labelText) group.appendChild(el('span', 't-label', labelText));
    group.appendChild(control);

    if (hint) {
      group.title = hint;
      var tip = el('span', 't-hint is-inline', hint);
      group.appendChild(tip);
    }

    return group;
  }

  /**
   * 分段按钮组：替代「模式」下拉，把几个互斥选项做成并排按钮。
   * @param {Array<{value:string,label:string,title?:string}>} items
   * @param {{value?:string, onChange?:function(string):void, ariaLabel?:string}} options
   */
  function segmented(items, options) {
    options = options || {};

    var box = el('div', 'seg');
    box.setAttribute('role', 'group');
    if (options.ariaLabel) box.setAttribute('aria-label', options.ariaLabel);

    var buttons = [];
    var current = options.value || (items[0] && items[0].value);

    items.forEach(function (item) {
      var btn = el('button', 'seg-btn', item.label);
      btn.type = 'button';
      btn.setAttribute('data-value', item.value);
      btn.setAttribute('aria-pressed', 'false');
      if (item.title) btn.title = item.title;

      btn.addEventListener('click', function () {
        if (current === item.value) return;
        current = item.value;
        sync();
        if (typeof options.onChange === 'function') options.onChange(item.value);
      });

      buttons.push(btn);
      box.appendChild(btn);
    });

    function sync() {
      buttons.forEach(function (btn) {
        var on = btn.getAttribute('data-value') === current;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    var api = {
      node: box,
      buttons: buttons,
      get value() { return current; },
      set value(next) {
        current = next;
        sync();
      },
      set: function (next, silent) {
        current = next;
        sync();
        if (!silent && typeof options.onChange === 'function') options.onChange(next);
      },
      disable: function (value, disabled) {
        buttons.forEach(function (btn) {
          if (btn.getAttribute('data-value') === value) btn.disabled = !!disabled;
        });
      }
    };

    sync();
    return api;
  }

  function textarea(placeholder, options) {
    options = options || {};
    var area = el('textarea', 't-textarea');
    area.spellcheck = false;
    area.autocomplete = 'off';
    area.setAttribute('autocapitalize', 'off');
    if (placeholder) area.placeholder = placeholder;
    if (options.value) area.value = options.value;
    if (options.readonly) area.readOnly = true;
    if (options.label) area.setAttribute('aria-label', options.label);
    else if (placeholder) area.setAttribute('aria-label', placeholder);
    return area;
  }

  function note(text, kind, iconId) {
    var box = el('div', 't-note' + (kind ? ' is-' + kind : ''));
    if (iconId !== false) box.appendChild(icon(iconId || 'i-alert'));
    box.appendChild(el('span', '', text));
    return box;
  }

  function empty(text, iconId) {
    var box = el('div', 't-empty');
    if (iconId !== false) box.appendChild(icon(iconId || 'i-code'));
    box.appendChild(el('span', '', text));
    return box;
  }

  function statLine(items) {
    var box = el('div', 't-stats');
    (items || []).forEach(function (item) {
      var span = el('span', 't-stat');
      span.appendChild(document.createTextNode(item.label + ' '));
      span.appendChild(el('b', '', item.value));
      box.appendChild(span);
    });
    return box;
  }

  /* ---------------- 注册表 ---------------- */

  function register(def) {
    if (!def || !def.id) throw new Error('Toolbox.register 需要一个 id');
    if (tools[def.id]) throw new Error('工具 id 重复：' + def.id);

    var tool = {
      id: def.id,
      group: def.group || '其他',
      title: def.title || def.id,
      desc: def.desc || '',
      icon: def.icon || 'i-code',
      keywords: def.keywords || [],
      shortcuts: def.shortcuts || [],
      staticEl: def.staticEl || '',
      mount: typeof def.mount === 'function' ? def.mount : null,
      run: typeof def.run === 'function' ? def.run : null,
      find: typeof def.find === 'function' ? def.find : null,
      show: typeof def.show === 'function' ? def.show : null,
      hide: typeof def.hide === 'function' ? def.hide : null,
      destroy: typeof def.destroy === 'function' ? def.destroy : null
    };

    tools[tool.id] = tool;
    order.push(tool.id);
    if (groups.indexOf(tool.group) === -1) groups.push(tool.group);

    return tool;
  }

  function isActive(id) {
    return active === id;
  }

  /* ---------------- 路由 ---------------- */

  function normalizeId(value) {
    var text = String(value || '').replace(/^#\/?/, '').trim();
    if (!text) return '';
    try {
      text = decodeURIComponent(text);
    } catch (err) {
      /* 保持原样 */
    }
    return text.toLowerCase();
  }

  function parseHash() {
    return normalizeId(root.location.hash);
  }

  function writeHash(id) {
    var hash = '#/' + id;
    if (root.location.hash === hash) return;
    try {
      root.history.replaceState(null, '', hash);
    } catch (err) {
      root.location.replace(hash);
    }
  }

  function viewOf(tool) {
    if (!tool) return null;
    if (tool.staticEl) return byId(tool.staticEl.replace(/^#/, ''));
    return roots[tool.id] || null;
  }

  function renderFailure(tool, error) {
    var box = el('div', 'view');
    box.appendChild(head({ title: tool.title, desc: tool.desc, icon: tool.icon }));
    box.appendChild(note('该工具加载失败：' + (error && error.message ? error.message : String(error)), 'error'));
    return box;
  }

  function ensureView(tool) {
    if (tool.staticEl) {
      var existing = byId(tool.staticEl.replace(/^#/, ''));
      if (existing) return existing;
    }

    if (roots[tool.id]) return roots[tool.id];

    var section = el('section', 'view');
    section.id = 'view-' + tool.id;
    section.setAttribute('data-view', tool.id);
    section.hidden = true;

    try {
      if (tool.mount) tool.mount(section);
      else section.appendChild(head({ title: tool.title, desc: tool.desc, icon: tool.icon }));
    } catch (error) {
      section.textContent = '';
      section.appendChild(head({ title: tool.title, desc: tool.desc, icon: tool.icon }));
      section.appendChild(note('该工具加载失败：' + (error && error.message ? error.message : String(error)), 'error'));
      if (root.console && console.error) console.error('[toolbox] ' + tool.id + ' 挂载失败', error);
    }

    /* 统一挂一组撤销 / 重做按钮：工具自己有就用它的，没有才注入 */
    if (!tool.staticEl) ensureHistoryButtons(tool, section);

    dom.host.appendChild(section);
    roots[tool.id] = section;
    return section;
  }

  /**
   * 工具自己没放撤销按钮时，把一组按钮塞进 .view-head 的右侧。
   * 工具自己放了（视图里已经有 .history-group）则不再重复添加。
   */
  function injectHistoryButtons(tool, section) {
    if (!root.TextHistory) return;
    if (section.querySelector('.history-group')) return;

    var headEl = section.querySelector('.view-head');
    if (!headEl) return;

    var actions = headEl.querySelector('.view-head-actions');
    if (!actions) {
      actions = el('div', 'view-head-actions');
      headEl.appendChild(actions);
    }

    var pair = historyButtons(null);
    var findBtn = actions.querySelector('.view-find-btn');

    if (findBtn) actions.insertBefore(pair.node, findBtn);
    else actions.appendChild(pair.node);

    tool.__historyButtons = pair;
  }

  /* 工具挂载完之后再补按钮：此时视图里有没有自己的按钮已经能看出来了 */
  function ensureHistoryButtons(tool, section) {
    if (!root.TextHistory) return;
    if (tool.staticEl) return;
    if (tool.__historyButtons) return;

    /* 工具自己提供了撤销按钮就沿用它的，只跟顶栏保持同步 */
    var own = section.querySelector('.history-group');

    if (own) {
      var local = section.querySelector('.history-btn');
      tool.__historyButtons = {
        node: own,
        sync: function () {
          var input = historyTarget(tool.id);
          var stack = input && root.TextHistory ? root.TextHistory.of(input) : null;
          var buttons = own.querySelectorAll('.history-btn');

          if (buttons[0]) buttons[0].disabled = !(stack && stack.canUndo());
          if (buttons[1]) buttons[1].disabled = !(stack && stack.canRedo());

          /* 工具自己也可能挂了 body 级的同步按钮，这里不重复处理 */
          if (local) local.setAttribute('data-toolbox-sync', '1');
        }
      };
      return;
    }

    injectHistoryButtons(tool, section);
  }

  function activate(id, options) {
    options = options || {};
    var target = tools[id] ? id : DEFAULT_VIEW;
    var tool = tools[target];
    if (!tool) return;

    var previous = active;

    if (previous && previous !== target) {
      var previousTool = tools[previous];
      var previousView = viewOf(previousTool);
      if (previousView) previousView.hidden = true;
      if (previousTool && previousTool.hide) {
        try {
          previousTool.hide();
        } catch (error) {
          if (root.console && console.error) console.error('[toolbox] hide 失败', error);
        }
      }
    }

    active = target;

    var view = ensureView(tool);
    if (view) view.hidden = false;

    if (tool.show) {
      try {
        tool.show();
      } catch (error) {
        if (root.console && console.error) console.error('[toolbox] show 失败', error);
      }
    }

    if (tool.__historyButtons && tool.__historyButtons.sync) tool.__historyButtons.sync();

    updateNav();    updateChrome(tool);
    syncHistoryButtons();

    if (previous !== target || options.force) {
      storageSet('view', target);
      document.dispatchEvent(new CustomEvent('toolbox:viewchange', {
        detail: { view: target, prev: previous }
      }));
    }
  }

  function updateNav() {
    if (!dom.nav) return;
    var items = dom.nav.querySelectorAll('.nav-item');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var selected = item.getAttribute('data-tool') === active;
      item.classList.toggle('is-active', selected);
      if (selected) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    }
  }

  function updateChrome(tool) {
    document.title = (tool.title || APP_TITLE) + ' · ' + APP_TITLE;

    if (dom.subtitle) {
      dom.subtitle.textContent = tool.desc || FALLBACK_SUBTITLE;
    }

    if (!dom.footerHints) return;
    dom.footerHints.textContent = '';

    (tool.shortcuts || []).forEach(function (item) {
      var wrap = el('span', 'shortcut');
      (item.keys || []).forEach(function (key, index) {
        if (index) wrap.appendChild(el('span', '', '+'));
        wrap.appendChild(el('kbd', '', key));
      });
      if (item.label) wrap.appendChild(el('span', '', item.label));
      dom.footerHints.appendChild(wrap);
    });
  }

  function renderNav() {
    var nav = el('nav', 'nav');
    nav.setAttribute('aria-label', '工具列表');

    groups.forEach(function (group) {
      var block = el('div', 'nav-group');
      block.appendChild(el('p', 'nav-group-title', group));

      order.forEach(function (id) {
        var tool = tools[id];
        if (tool.group !== group) return;

        var button = el('button', 'nav-item');
        button.type = 'button';
        button.setAttribute('data-tool', id);
        button.title = tool.desc || tool.title;
        button.appendChild(icon(tool.icon));
        button.appendChild(el('span', 'nav-label', tool.title));
        block.appendChild(button);
      });

      nav.appendChild(block);
    });

    dom.nav.textContent = '';
    dom.nav.appendChild(nav);
  }

  function onNavClick(event) {
    var target = event.target;
    var item = target && target.closest ? target.closest('.nav-item') : null;
    if (!item || !dom.nav.contains(item)) return;

    var id = item.getAttribute('data-tool');
    if (!tools[id]) return;

    if (parseHash() === id) {
      activate(id, { force: true });
    } else {
      root.location.hash = '#/' + id;
    }
  }

  function onHashChange() {
    var id = parseHash();

    if (!id) {
      writeHash(active);
      return;
    }

    if (!tools[id]) {
      writeHash(DEFAULT_VIEW);
      activate(DEFAULT_VIEW);
      return;
    }

    if (id !== active) activate(id);
  }

  /* 统一的主操作快捷键：Ctrl/⌘ + Enter，由当前工具提供 run() */
  function onPrimaryShortcut(event) {
    if (event.isComposing) return;
    if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') return;

    var tool = tools[active];
    if (!tool || !tool.run) return;

    event.preventDefault();

    try {
      tool.run();
    } catch (error) {
      if (root.console && console.error) console.error('[toolbox] run 失败', error);
      toast('操作失败：' + (error && error.message ? error.message : String(error)));
    }
  }

  /**
   * 全局查找入口。
   * 顺序：当前工具的 finder → 当前视图里的第一个文本域 → 没有可搜内容时提示。
   * JSON 视图有自己的双侧查找，它会把 finder 设为 override，这里不会被调用。
   */
  function globalFind(options) {
    options = options || {};

    if (root.Finder && root.Finder.runOverride()) return true;

    var tool = tools[active];
    if (tool && typeof tool.find === 'function') {
      try {
        if (tool.find(options) !== false) return true;
      } catch (error) {
        if (root.console && console.error) console.error('[toolbox] find 失败', error);
      }
    }

    /* 兜底：在激活视图里找第一个可见 textarea / input 挂一个临时查找条 */
    var view = viewOf(tool);
    var host = null;

    if (view) {
      var candidates = view.querySelectorAll('textarea, input[type="text"], input[type="search"]');
      for (var i = 0; i < candidates.length; i++) {
        var node = candidates[i];
        if (node.offsetParent === null || node.readOnly) continue;
        host = node;
        break;
      }
    }

    if (!host) {
      toast('当前页签没有可搜索的文本');
      return false;
    }

    if (root.Finder) {
      var controller = root.Finder.attach(view || byId('content'), {
        targets: [host],
        label: tool ? tool.title : '查找'
      });
      controller.show(options.replace);
      return true;
    }

    return false;
  }

  function onFindShortcut(event) {
    if (event.isComposing) return;
    if (!(event.ctrlKey || event.metaKey) || event.shiftKey) return;
    if (event.key !== 'f' && event.key !== 'F' && event.key !== 'h' && event.key !== 'H') return;

    /* JSON 视图自己处理双侧查找 */
    if (active === 'json') return;

    event.preventDefault();
    globalFind({ replace: event.key === 'h' || event.key === 'H' });
  }

  function boot() {
    if (booted) return;
    booted = true;

    dom.nav = byId('toolNav');
    dom.host = byId('viewHost');
    dom.footerHints = byId('footerHints');
    dom.subtitle = byId('brandSubtitle');
    dom.undoBtn = byId('undoAllBtn');
    dom.redoBtn = byId('redoAllBtn');

    if (!dom.nav || !dom.host) return;

    if (dom.undoBtn) dom.undoBtn.addEventListener('click', undoActive);
    if (dom.redoBtn) dom.redoBtn.addEventListener('click', redoActive);

    renderNav();
    dom.nav.addEventListener('click', onNavClick);

    var initial = parseHash();
    if (!initial || !tools[initial]) {
      var stored = storageGet('view', DEFAULT_VIEW);
      initial = tools[stored] ? stored : DEFAULT_VIEW;
      writeHash(initial);
    }

    activate(initial, { force: true });
    root.addEventListener('hashchange', onHashChange);
    document.addEventListener('keydown', onPrimaryShortcut);
    document.addEventListener('keydown', onFindShortcut);

    if (dom.subtitle && !tools[DEFAULT_VIEW]) {
      dom.subtitle.textContent = FALLBACK_SUBTITLE;
    }
  }

  /* ---------------- 导出 ---------------- */

  root.Toolbox = {
    DEFAULT_VIEW: DEFAULT_VIEW,
    register: register,
    activate: activate,
    isActive: isActive,
    get active() { return active; },
    get tools() { return order.map(function (id) { return tools[id]; }); },
    /* 撤销 / 重做 */
    historyTarget: historyTarget,
    setHistoryTarget: setHistoryTarget,
    undo: undoActive,
    redo: redoActive,
    syncHistory: syncHistoryButtons,
    historyButtons: historyButtons,
    ui: {
      $: $,
      byId: byId,
      el: el,
      icon: icon,
      escapeHtml: escapeHtml,
      debounce: debounce,
      formatBytes: formatBytes,
      storageGet: storageGet,
      storageSet: storageSet,
      toast: toast,
      copyText: copyText,
      downloadText: downloadText,
      head: head,
      colHead: colHead,
      miniButton: miniButton,
      copyButton: copyButton,
      checkbox: checkbox,
      field: field,
      segmented: segmented,
      textarea: textarea,
      note: note,
      empty: empty,
      statLine: statLine,
      historyButtons: historyButtons,
      codeView: function (options) {
        return root.CodeView ? root.CodeView.createReadonly(options) : null;
      },
      codeEditor: function (options) {
        return root.CodeView ? root.CodeView.createEditor(options) : null;
      },
      highlight: function (language, code) {
        return root.Syntax ? root.Syntax.highlight(language, code) : escapeHtml(code);
      }
    },
    find: function (options) {
      return globalFind(options);
    }
  };

  /* JSON 视图是静态标记，注册一项以便出现在导航中 */
  register({
    id: 'json',
    group: '数据格式',
    title: 'JSON 格式化',
    desc: '格式化 · 压缩 · 校验 · 树形查看 · 双侧查找',
    icon: 'i-braces',
    keywords: ['json', 'format', 'minify', 'beautify'],
    staticEl: '#view-json',
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], label: '格式化' },
      { keys: ['Ctrl', 'Shift', 'M'], label: '压缩' },
      { keys: ['Ctrl', 'Z'], label: '撤销' },
      { keys: ['Ctrl', 'F'], label: '双侧查找' }
    ]
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
