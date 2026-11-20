/* =========================================================
 * 工具：正则表达式测试
 * 实时高亮、捕获组 / 命名组、替换、拆分、速查表与代码生成。
 * 纯浏览器端实现，不依赖任何第三方库。
 * ========================================================= */
(function () {
  'use strict';

  var TB = window.Toolbox;
  if (!TB) return;

  var ui = TB.ui;

  /* 与旧版本保持一致的上限：避免超长文本把页面卡死 */
  var MAX_TEXT = 200000;
  var MAX_MATCHES = 1000;
  var MAX_LIST = 200;
  var MAX_MS = 4000;
  var MAX_SPLIT = 500;
  var MAX_REPLACE = 200000;

  var FLAGS = [
    { flag: 'g', title: 'global：找出全部匹配（关闭后只匹配第一处）' },
    { flag: 'i', title: 'ignoreCase：忽略大小写' },
    { flag: 'm', title: 'multiline：^ 和 $ 匹配每一行的开头 / 结尾' },
    { flag: 's', title: 'dotAll：让 . 也能匹配换行符' },
    { flag: 'u', title: 'unicode：按码点处理，支持 \\p{L} 与 \\u{...}' },
    { flag: 'y', title: 'sticky：只从 lastIndex 处开始匹配（粘性）' }
  ];

  /* 示例库：{name, pattern, flags, sample} */
  var PRESETS = [
    {
      name: '手机号',
      pattern: '1[3-9]\\d{9}',
      flags: 'g',
      sample: '客服 13812345678，备用 19900001111，无效 12345。'
    },
    {
      name: '邮箱',
      pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+',
      flags: 'gi',
      sample: '联系 alice@example.com 或 bob.smith@corp.co.uk，无效 a@b。'
    },
    {
      name: 'URL',
      pattern: 'https?://[\\w.-]+(?:/[\\w\\-./?%&=#]*)?',
      flags: 'gi',
      sample: '文档 https://example.com/a/b?x=1 ，接口 http://localhost:8080/api 。'
    },
    {
      name: 'IPv4',
      pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\b',
      flags: 'g',
      sample: '内网 192.168.1.1 与 10.0.0.255，非法 256.1.1.1。'
    },
    {
      name: '日期 YYYY-MM-DD',
      pattern: '(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])',
      flags: 'g',
      sample: '开始 2026-01-05，结束 2026-12-31，非法 2026-13-01。'
    },
    {
      name: '时间 HH:mm:ss',
      pattern: '\\b([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)\\b',
      flags: 'g',
      sample: '上班 09:30:00，下班 18:45:59，非法 25:00:00。'
    },
    {
      name: '中文字符',
      pattern: '[\\u4e00-\\u9fa5]+',
      flags: 'g',
      sample: 'Hello 你好，世界！Pure 中文 test。'
    },
    {
      name: '身份证',
      pattern: '\\b[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]\\b',
      flags: 'g',
      sample: '甲 11010119900307123X，乙 44052419800101001x。'
    },
    {
      name: '十六进制颜色',
      pattern: '#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b',
      flags: 'g',
      sample: '主色 #3b82f6，浅色 #fff，错误 #12345。'
    },
    {
      name: 'HTML 标签',
      pattern: '<(?<tag>[a-zA-Z][\\w-]*)\\b[^>]*>.*?</\\k<tag>>',
      flags: 'gis',
      sample: '<div class="card">hello</div>\n<p>world</p>'
    },
    {
      name: 'JSON 键值',
      pattern: '"(?<key>[^"]+)"\\s*:\\s*(?<value>[^,}\\n]+)',
      flags: 'g',
      sample: '{"name":"alice","age":30,"city":"上海"}'
    },
    {
      name: '重复单词',
      pattern: '\\b(\\w+)\\s+\\1\\b',
      flags: 'gi',
      sample: 'This is is a test test of repeated words.'
    },
    {
      name: '空白行',
      pattern: '^[ \\t]*$',
      flags: 'gm',
      sample: '第一行\n\n第三行\n   \n第五行'
    },
    {
      name: '金额',
      pattern: '(?<currency>[¥$€])?\\s?(?<amount>\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,2})?)',
      flags: 'g',
      sample: '收入 ¥1,234.50，支出 $99，余额 0.00。'
    },
    {
      name: '密码强度',
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$',
      flags: 'gm',
      sample: 'Abc12345\nweakpass\nStr0ngP@ss\n12345678'
    }
  ];

  /* 语法速查表：[写法, 说明] */
  var REFERENCE = [
    ['\\d', '数字 0-9，等价于 [0-9]'],
    ['\\D', '非数字，等价于 [^0-9]'],
    ['\\w', '单词字符：字母、数字、下划线'],
    ['\\W', '非单词字符'],
    ['\\s', '空白：空格、\\t、\\n、\\r、换页'],
    ['\\S', '非空白字符'],
    ['\\b', '单词边界（零宽，不消耗字符）'],
    ['\\B', '非单词边界'],
    ['[abc]', '字符集：a、b、c 中任意一个'],
    ['[^abc]', '排除 a、b、c 的任意一个字符'],
    ['[a-z0-9]', '字符范围，可连写多个范围'],
    ['*', '前一项出现 0 次或多次（贪婪）'],
    ['+', '前一项出现 1 次或多次'],
    ['?', '前一项出现 0 次或 1 次'],
    ['{n}', '前一项恰好出现 n 次'],
    ['{n,m}', '前一项出现 n 到 m 次'],
    ['*? +? ??', '懒惰量词：尽量少地匹配'],
    ['( )', '捕获组，替换时用 $1、$2 引用'],
    ['(?: )', '非捕获组：只分组，不占用 $n'],
    ['(?<name> )', '命名捕获组，用 $<name> 或 \\k<name> 引用'],
    ['\\1', '反向引用：与第 1 个捕获组相同的文本'],
    ['(?= )', '正向先行断言：右侧必须能匹配，不消耗字符'],
    ['(?! )', '负向先行断言：右侧不能匹配'],
    ['(?<= )', '正向后行断言：左侧必须能匹配'],
    ['(?<! )', '负向后行断言：左侧不能匹配'],
    ['^', '行首（m 修饰符下为每一行行首）'],
    ['$', '行尾（m 修饰符下为每一行行尾）'],
    ['.', '除换行外的任意字符（s 修饰符下含换行）'],
    ['a|b', '或：匹配 a 或 b'],
    ['\\.', '转义元字符，表示字面量点号'],
    ['\\p{L}', 'Unicode 字母（需要 u 修饰符）'],
    ['\\u{1F600}', '按码点转义（需要 u 修饰符）']
  ];

  /* ---------------- 纯逻辑辅助函数 ---------------- */

  /** 高亮渲染专用转义：绝不把用户输入直接拼进 innerHTML */
  function escapeHtml(text) {
    return String(text === null || text === undefined ? '' : text).replace(/[&<>"']/g, function (ch) {
      if (ch === '&') return '&amp;';
      if (ch === '<') return '&lt;';
      if (ch === '>') return '&gt;';
      if (ch === '"') return '&quot;';
      return '&#39;';
    });
  }

  function now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  /** 偏移量 → 行 / 列（列从 1 开始） */
  function lineColumnAt(text, index) {
    var line = 1;
    var lastBreak = -1;
    var end = Math.min(Math.max(index, 0), text.length);

    for (var i = 0; i < end; i++) {
      if (text.charCodeAt(i) === 10) {
        line++;
        lastBreak = i;
      }
    }

    return { line: line, column: end - lastBreak };
  }

  /** 识别 /pattern/flags 斜杠写法；不是该写法时返回 null */
  function parseSlash(raw) {
    var text = String(raw === null || raw === undefined ? '' : raw);
    if (text.charAt(0) !== '/') return null;

    /* 从后往前找未被转义的斜杠作为结束符 */
    var close = -1;
    for (var i = text.length - 1; i > 0; i--) {
      if (text.charAt(i) !== '/') continue;
      var slashes = 0;
      for (var j = i - 1; j >= 0 && text.charAt(j) === '\\'; j--) slashes++;
      if (slashes % 2 === 0) {
        close = i;
        break;
      }
    }

    if (close < 1) return null;

    var body = text.slice(1, close);
    var tail = text.slice(close + 1).trim();
    if (tail && !/^[gimsuy]+$/.test(tail)) return null;

    /* 去重并统一顺序，避免 /a/gg 这类重复修饰符让 new RegExp 抛错 */
    return { pattern: body, flags: normalizeFlags(tail) };
  }

  /** 修饰符去重并按 g i m s u y 顺序排列 */
  function normalizeFlags(flags) {
    var out = '';
    FLAGS.forEach(function (item) {
      if (flags.indexOf(item.flag) >= 0) out += item.flag;
    });
    return out;
  }

  /** 扫描未闭合的括号 / 字符类，返回下标，找不到返回 -1 */
  function scanUnclosed(pattern, isClass) {
    var stack = [];
    var inClass = false;

    for (var i = 0; i < pattern.length; i++) {
      var ch = pattern.charAt(i);

      if (ch === '\\') {
        i++;
        continue;
      }

      if (inClass) {
        if (ch === ']') inClass = false;
        continue;
      }

      if (ch === '[') {
        inClass = true;
        if (isClass) stack.push(i);
        continue;
      }

      if (isClass) continue;

      if (ch === '(') stack.push(i);
      else if (ch === ')') stack.pop();
    }

    if (isClass) return inClass && stack.length ? stack[stack.length - 1] : -1;
    return stack.length ? stack[stack.length - 1] : -1;
  }

  /** 找出「没有东西可以重复」的量词位置（* + ? 前面必须是可重复项） */
  function findStuckQuantifier(pattern) {
    for (var i = 0; i < pattern.length; i++) {
      var ch = pattern.charAt(i);

      if (ch === '\\') {
        i++;
        continue;
      }

      /* 跳过字符类内部，[?] 是合法的字面量问号 */
      if (ch === '[') {
        for (i++; i < pattern.length; i++) {
          if (pattern.charAt(i) === '\\') {
            i++;
            continue;
          }
          if (pattern.charAt(i) === ']') break;
        }
        continue;
      }

      if ('*+?'.indexOf(ch) < 0) continue;
      if (i === 0) return 0;

      var prev = pattern.charAt(i - 1);

      /* (?= (?! (?: (?<= (?<! 属于合法的分组前缀 */
      if (prev === '(' && ch === '?') continue;

      if (prev === '(' || prev === '|' || prev === '^') return i;
    }

    return -1;
  }

  var ERROR_RULES = [
    { test: /Unterminated group/i, reason: '括号没有闭合：有 ( 缺少对应的 )', kind: 'group' },
    { test: /Unterminated character class/i, reason: '字符类没有闭合：有 [ 缺少对应的 ]', kind: 'class' },
    { test: /Nothing to repeat/i, reason: '量词前面缺少可重复的内容（* + ? {n} 必须紧跟字符、分组或字符类）', kind: 'quant' },
    { test: /Invalid group/i, reason: '分组语法错误：检查 (? 开头的写法', kind: 'none' },
    { test: /Invalid escape/i, reason: '非法的转义序列：\\ 后面只能跟有特殊含义的字符', kind: 'none' },
    { test: /Invalid decimal escape/i, reason: '非法的十进制转义：反向引用编号超出已有捕获组数量', kind: 'none' },
    { test: /Invalid unicode escape/i, reason: '非法的 Unicode 转义：\\u 后需要 4 位十六进制，或 u 修饰符下用 \\u{...}', kind: 'none' },
    { test: /Invalid character class/i, reason: '字符类内容非法：检查 [ ] 内的范围写法', kind: 'class' },
    { test: /Range out of order/i, reason: '字符类范围顺序错误，例如 [z-a]', kind: 'none' },
    { test: /Lone quantifier brackets/i, reason: '量词花括号写法错误：应为 {n} 或 {n,m}', kind: 'quant' },
    { test: /numbers out of order/i, reason: '量词 {n,m} 中 n 大于 m，数字顺序写反了', kind: 'none' },
    { test: /Unmatched '\)'/i, reason: '多余的右括号 )', kind: 'none' },
    { test: /Duplicate capture group name/i, reason: '命名捕获组重名，请换一个名字', kind: 'none' },
    { test: /Invalid named/i, reason: '命名组引用不合法：\\k<name> 或 $<name> 的组名不存在', kind: 'none' },
    { test: /Invalid property name/i, reason: '\\p{...} 属性名无效，例如 \\p{L}', kind: 'none' },
    { test: /Invalid flags/i, reason: '修饰符不合法：只支持 g i m s u y', kind: 'none' }
  ];

  /** 从英文报错里抽出原因文本 */
  function extractReason(raw) {
    var text = String(raw || '');
    var marker = 'Invalid regular expression:';
    var at = text.indexOf(marker);

    if (at >= 0) {
      text = text.slice(at + marker.length).trim();
      var colon = text.lastIndexOf(':');
      if (colon >= 0) text = text.slice(colon + 1).trim();
    }

    return text;
  }

  /** 把英文正则报错翻译成中文，并尽量指出位置 */
  function describeRegexError(err, pattern) {
    var raw = err && err.message ? String(err.message) : '未知错误';
    var rule = null;

    for (var i = 0; i < ERROR_RULES.length; i++) {
      if (ERROR_RULES[i].test.test(raw)) {
        rule = ERROR_RULES[i];
        break;
      }
    }

    var position = -1;
    if (rule && rule.kind === 'group') position = scanUnclosed(pattern, false);
    else if (rule && rule.kind === 'class') position = scanUnclosed(pattern, true);
    else if (rule && rule.kind === 'quant') position = findStuckQuantifier(pattern);

    var out = '正则表达式无效：' + (rule ? rule.reason : '语法不符合 JavaScript 正则规则');

    if (position >= 0) out += '（大致在第 ' + (position + 1) + ' 个字符处）';
    if (!rule) out += '。原始信息：' + extractReason(raw);

    return out + '。';
  }

  /** 手动展开替换模板：支持 $1..$99、$&、$`、$'、$$、$<name> */
  function expandReplacement(item, replacement, fullText) {
    var template = String(replacement === null || replacement === undefined ? '' : replacement);
    var groups = item.groups || [];
    var named = item.named || {};
    var out = '';

    for (var i = 0; i < template.length; i++) {
      var ch = template.charAt(i);

      if (ch !== '$') {
        out += ch;
        continue;
      }

      var next = template.charAt(i + 1);

      if (next === '$') {
        out += '$';
        i++;
        continue;
      }

      if (next === '&') {
        out += item.text;
        i++;
        continue;
      }

      if (next === '`') {
        out += fullText.slice(0, item.index);
        i++;
        continue;
      }

      if (next === "'") {
        out += fullText.slice(item.index + item.text.length);
        i++;
        continue;
      }

      if (next === '<') {
        var close = template.indexOf('>', i + 2);
        if (close > 0) {
          var name = template.slice(i + 2, close);

          /* 命名组不存在时按原生语义保留整段字面量 */
          if (Object.prototype.hasOwnProperty.call(named, name)) {
            var value = named[name];
            out += value === undefined ? '' : value;
            i = close;
            continue;
          }
        }
      }

      if (next >= '1' && next <= '9') {
        var two = template.substr(i + 1, 2);

        if (/^\d\d$/.test(two)) {
          var big = Number(two);
          if (big >= 1 && big <= groups.length) {
            out += groups[big - 1] === undefined ? '' : groups[big - 1];
            i += 2;
            continue;
          }
        }

        var small = Number(next);
        if (small <= groups.length) {
          out += groups[small - 1] === undefined ? '' : groups[small - 1];
          i += 1;
          continue;
        }
      }

      /* 引用不存在或不是 $ 转义：保留字面量 $ */
      out += '$';
    }

    return out;
  }

  /** Unicode 模式下的代理对判断，零宽匹配推进时要整对跳过 */
  function isHighSurrogate(code) {
    return code >= 0xd800 && code <= 0xdbff;
  }

  /* ---------------- 代码生成 ---------------- */

  /** Java / Go 等语言的普通字符串转义 */
  function backslashEscape(text) {
    var out = '';

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);

      if (ch === '\\') out += '\\\\';
      else if (ch === '"') out += '\\"';
      else if (ch === '\n') out += '\\n';
      else if (ch === '\r') out += '\\r';
      else if (ch === '\t') out += '\\t';
      else out += ch;
    }

    return out;
  }

  /** Python 优先用原始字符串，遇到引号 / 结尾反斜杠时退回普通字符串 */
  function pythonLiteral(pattern) {
    var hasSingle = pattern.indexOf("'") >= 0;
    var hasDouble = pattern.indexOf('"') >= 0;
    var trailing = /\\+$/.exec(pattern);
    var oddTrailing = trailing && trailing[0].length % 2 === 1;

    if (!oddTrailing && !(hasSingle && hasDouble)) {
      if (hasDouble) return "r'" + pattern + "'";
      return 'r"' + pattern + '"';
    }

    return '"' + backslashEscape(pattern) + '"';
  }

  function javaFlags(flags) {
    var list = [];
    if (flags.indexOf('i') >= 0) list.push('Pattern.CASE_INSENSITIVE');
    if (flags.indexOf('m') >= 0) list.push('Pattern.MULTILINE');
    if (flags.indexOf('s') >= 0) list.push('Pattern.DOTALL');
    if (flags.indexOf('u') >= 0) list.push('Pattern.UNICODE_CASE');
    return list.length ? list.join(' | ') : '0';
  }

  function pythonFlags(flags) {
    var list = [];
    if (flags.indexOf('i') >= 0) list.push('re.I');
    if (flags.indexOf('m') >= 0) list.push('re.M');
    if (flags.indexOf('s') >= 0) list.push('re.S');
    return list.length ? list.join(' | ') : '';
  }

  function goPattern(pattern, flags) {
    var inline = '';
    if (flags.indexOf('i') >= 0) inline += 'i';
    if (flags.indexOf('m') >= 0) inline += 'm';
    if (flags.indexOf('s') >= 0) inline += 's';

    var body = (inline ? '(?' + inline + ')' : '') + pattern;

    if (body.indexOf('`') >= 0) return '"' + backslashEscape(body) + '"';
    return '`' + body + '`';
  }

  /** 生成四种语言的代码片段 */
  function buildSnippets(pattern, flags, sample) {
    var global = flags.indexOf('g') >= 0;
    var source = sample || '';
    var jsSample = JSON.stringify(source);

    var js = '// JavaScript / TypeScript\n'
      + 'const re = new RegExp(' + JSON.stringify(pattern) + ', ' + JSON.stringify(flags) + ');\n'
      + 'const text = ' + jsSample + ';\n';

    if (global) {
      js += '\n// 只要命中文本时\n'
        + 'const hits = text.match(re) || [];\n'
        + '\n// 需要捕获组 / 命名组时\n'
        + 'let m;\n'
        + 'while ((m = re.exec(text)) !== null) {\n'
        + '  console.log(m[0], m[1], m.groups && m.groups.name);\n'
        + '  if (m[0] === "") re.lastIndex++;\n'
        + '}';
    } else {
      js += '\nconst m = re.exec(text);\n'
        + 'if (m) {\n'
        + '  console.log(m[0], m[1], m.groups && m.groups.name);\n'
        + '}';
    }

    var java = 'import java.util.regex.*;\n'
      + '\nPattern re = Pattern.compile("' + backslashEscape(pattern) + '", ' + javaFlags(flags) + ');\n'
      + 'Matcher m = re.matcher(text);\n'
      + 'while (m.find()) {\n'
      + '    System.out.println(m.group()); // m.group(1) / m.group("name")\n'
      + '}';

    var pyFlags = pythonFlags(flags);
    var python = 'import re\n'
      + '\ntext = ' + JSON.stringify(source) + '\n'
      + 'pattern = re.compile(' + pythonLiteral(pattern) + (pyFlags ? ', ' + pyFlags : '') + ')\n'
      + 'for m in pattern.finditer(text):\n'
      + '    print(m.group(0))  # m.group(1) / m.group("name")';

    var go = 'import "regexp"\n'
      + '\nre := regexp.MustCompile(' + goPattern(pattern, flags) + ')\n'
      + 'for _, m := range re.FindAllStringSubmatch(text, -1) {\n'
      + '    fmt.Println(m[0]) // m[1..] 为捕获组\n'
      + '}';

    return {
      javascript: js,
      java: java,
      python: python,
      go: go
    };
  }

  /* ---------------- 视图 ---------------- */

  function build() {
    var state = {
      tab: 'match',
      flags: { g: true, i: false, m: false, s: false, u: false, y: false },
      expandAll: false,
      currentIndex: -1,
      currentMark: null,
      markMap: {},
      replaceText: ''
    };

    var lastResult = null;
    var finder = null;

    var root = ui.el('section', 't-page');
    root.appendChild(ui.head({
      icon: 'i-search',
      title: '正则测试',
      desc: '实时高亮全部匹配，列出捕获组与命名组；支持替换、拆分、速查与代码生成。',
      search: true
    }));

    /* ---------------- 工具栏 ---------------- */

    var toolbar = ui.el('div', 't-toolbar');
    var options = ui.el('div', 't-options');

    var patternInput = ui.el('input', 't-input');
    patternInput.type = 'text';
    patternInput.placeholder = '输入正则，例如 \\d+ 或 /(?<user>\\w+)@\\w+/gi';
    patternInput.setAttribute('aria-label', '正则表达式');
    patternInput.setAttribute('autocomplete', 'off');
    patternInput.setAttribute('spellcheck', 'false');
    patternInput.style.minWidth = '300px';
    patternInput.style.flex = '1';

    /* 完整表达式预览（只读小字） */
    var preview = ui.el('span', 't-hint');
    preview.style.fontFamily = 'var(--font-mono)';
    preview.style.maxWidth = '280px';
    preview.style.overflow = 'hidden';
    preview.style.textOverflow = 'ellipsis';
    preview.style.whiteSpace = 'nowrap';

    var patternWrap = ui.el('div', 't-inline');
    patternWrap.appendChild(patternInput);
    patternWrap.appendChild(preview);
    options.appendChild(ui.field('正则', patternWrap));

    var flagBoxes = ui.el('div', 't-inline');
    var flagButtons = {};

    FLAGS.forEach(function (item) {
      var button = ui.el('button', 'find-opt', item.flag);
      button.type = 'button';
      button.title = item.title;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', item.flag + '：' + item.title);
      button.addEventListener('click', function () { toggleFlag(item.flag); });

      flagButtons[item.flag] = button;
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
        state.flags = { g: true, i: false, m: false, s: false, u: false, y: false };
        state.expandAll = false;
        syncFlagButtons('g');
        compute();
        patternInput.focus();
      }
    });

    actions.appendChild(sampleBtn);
    actions.appendChild(clearBtn);
    toolbar.appendChild(actions);
    root.appendChild(toolbar);

    /* ---------------- 示例库（与正则、修饰符同一工具栏，省一行高度） ---------------- */

    var presetBox = ui.el('div', 't-presets');
    presetBox.style.flex = '1';
    presetBox.style.minWidth = '0';

    PRESETS.forEach(function (preset) {
      var button = ui.el('button', 't-preset', preset.name);
      button.type = 'button';
      button.title = '/' + preset.pattern + '/' + preset.flags;
      button.addEventListener('click', function () { applyPreset(preset); });
      presetBox.appendChild(button);
    });

    var presetField = ui.field('示例库', presetBox);
    presetField.style.flexBasis = '100%';
    options.appendChild(presetField);

    /* ---------------- 标签页 ---------------- */

    var TABS = [
      { value: 'match', label: '匹配' },
      { value: 'replace', label: '替换' },
      { value: 'split', label: '拆分' },
      { value: 'syntax', label: '速查' },
      { value: 'code', label: '代码' }
    ];

    var tabRow = ui.el('div', 't-tabs-row');
    var tabBar = ui.el('div', 'tabs');
    tabBar.setAttribute('role', 'tablist');
    tabBar.setAttribute('aria-label', '正则工作台视图');

    var tabButtons = {};

    TABS.forEach(function (tab) {
      var button = ui.el('button', 'tab' + (tab.value === state.tab ? ' is-active' : ''), tab.label);
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', tab.value === state.tab ? 'true' : 'false');
      button.addEventListener('click', function () { setTab(tab.value); });

      tabButtons[tab.value] = button;
      tabBar.appendChild(button);
    });

    tabRow.appendChild(tabBar);
    tabRow.appendChild(ui.el('span', 't-hint', 'Ctrl+Enter 重新匹配 · Ctrl+F 查找替换'));
    root.appendChild(tabRow);

    /* ---------------- 匹配面板 ---------------- */

    var matchPanel = ui.el('div', 't-cols');

    /* 左：测试文本 */
    var textCol = ui.el('section', 't-col');
    var textArea = ui.textarea('在此输入要匹配的文本…', { label: '测试文本' });
    textArea.classList.add('is-mono-big');

    textCol.appendChild(ui.colHead('测试文本', {
      actions: [
        ui.miniButton('粘贴', {
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
        }),
        ui.copyButton(function () { return textArea.value; }, '复制')
      ]
    }));

    var textBody = ui.el('div', 't-col-body');
    textBody.appendChild(textArea);
    var textStats = ui.el('div', 't-stats');
    textBody.appendChild(textStats);
    textCol.appendChild(textBody);

    /* 右：匹配结果 */
    var resultCol = ui.el('section', 't-col');
    resultCol.appendChild(ui.colHead('匹配结果', { badge: '—' }));
    var resultBadge = resultCol.querySelector('.badge');

    var resultBody = ui.el('div', 't-col-body');
    var resultScroll = ui.el('div', 't-scroll');

    var errorText = ui.el('p', 't-error');
    resultScroll.appendChild(errorText);

    var highlight = ui.el('pre', 't-highlight');
    highlight.style.flex = 'none';
    highlight.style.maxHeight = '340px';
    resultScroll.appendChild(highlight);

    var resultStats = ui.el('div', 't-stats');
    resultScroll.appendChild(resultStats);

    var listBox = ui.el('div', 't-rows');
    resultScroll.appendChild(listBox);

    var moreBox = ui.el('div', 't-inline');
    resultScroll.appendChild(moreBox);

    resultBody.appendChild(resultScroll);
    resultCol.appendChild(resultBody);

    matchPanel.appendChild(textCol);
    matchPanel.appendChild(resultCol);
    root.appendChild(matchPanel);

    /* ---------------- 替换面板 ---------------- */

    var replacePanel = ui.el('div', 't-cols');
    replacePanel.hidden = true;

    var replaceCol = ui.el('section', 't-col');
    replaceCol.appendChild(ui.colHead('查找替换'));

    var replaceBody = ui.el('div', 't-col-body');

    var replaceInput = ui.el('input', 't-input');
    replaceInput.type = 'text';
    replaceInput.placeholder = '替换为（留空即删除匹配）';
    replaceInput.setAttribute('aria-label', '替换内容');
    replaceInput.setAttribute('autocomplete', 'off');
    replaceInput.style.flex = '1';
    replaceInput.style.minWidth = '220px';
    replaceBody.appendChild(ui.field('替换为', replaceInput));

    var replaceActions = ui.el('div', 't-inline');

    var replaceOneBtn = ui.el('button', 'btn btn-ghost btn-sm');
    replaceOneBtn.type = 'button';
    replaceOneBtn.appendChild(ui.icon('i-replace'));
    replaceOneBtn.appendChild(document.createTextNode('替换当前'));

    var replaceAllBtn = ui.el('button', 'btn btn-primary btn-sm');
    replaceAllBtn.type = 'button';
    replaceAllBtn.appendChild(ui.icon('i-sparkles'));
    replaceAllBtn.appendChild(document.createTextNode('全部替换'));

    var applyBtn = ui.el('button', 'btn btn-ghost btn-sm');
    applyBtn.type = 'button';
    applyBtn.appendChild(ui.icon('i-undo'));
    applyBtn.appendChild(document.createTextNode('应用到测试文本'));

    replaceActions.appendChild(replaceOneBtn);
    replaceActions.appendChild(replaceAllBtn);
    replaceActions.appendChild(applyBtn);
    replaceBody.appendChild(replaceActions);

    var replaceStats = ui.el('div', 't-stats');
    replaceBody.appendChild(replaceStats);

    replaceBody.appendChild(ui.note(
      '替换预览不会改动测试文本；点击「应用到测试文本」才会写回左侧。' +
      '$1..$99 为捕获组，$& 为整个匹配，$` 为匹配前文本，$\' 为匹配后文本，$$ 为字面量 $，$<name> 为命名组。',
      null,
      'i-alert'
    ));

    replaceCol.appendChild(replaceBody);

    var replaceResultCol = ui.el('section', 't-col');
    var replaceView = makeCodeView({ language: 'text', placeholder: '点击「全部替换」生成替换后的文本' });
    replaceResultCol.appendChild(ui.colHead('替换后的文本', {
      actions: [ui.copyButton(function () { return replaceView.getValue(); }, '复制')]
    }));
    var replaceResultBody = ui.el('div', 't-col-body');
    replaceResultBody.appendChild(replaceView.root);
    replaceResultCol.appendChild(replaceResultBody);

    replacePanel.appendChild(replaceCol);
    replacePanel.appendChild(replaceResultCol);
    root.appendChild(replacePanel);

    /* ---------------- 拆分面板 ---------------- */

    var splitPanel = ui.el('div', 't-stack');
    splitPanel.hidden = true;

    var splitCol = ui.el('section', 't-col');
    splitCol.style.flex = '1';
    splitCol.appendChild(ui.colHead('拆分结果', { badge: '—' }));
    var splitBadge = splitCol.querySelector('.badge');

    var splitBody = ui.el('div', 't-col-body');

    var splitOptions = ui.el('div', 't-inline');
    var splitDropEmpty = ui.checkbox('去掉空项', { checked: true });
    splitOptions.appendChild(splitDropEmpty.label);
    splitOptions.appendChild(ui.el('span', 't-hint', '按当前正则对测试文本执行 String.split'));
    splitBody.appendChild(splitOptions);

    var splitStats = ui.el('div', 't-stats');
    splitBody.appendChild(splitStats);

    var splitRows = ui.el('div', 't-rows');
    splitBody.appendChild(splitRows);

    splitCol.appendChild(splitBody);
    splitPanel.appendChild(splitCol);
    root.appendChild(splitPanel);

    /* ---------------- 速查面板 ---------------- */

    var syntaxPanel = ui.el('div', 't-stack');
    syntaxPanel.hidden = true;

    var syntaxCol = ui.el('section', 't-col');
    syntaxCol.style.flex = '1';
    syntaxCol.appendChild(ui.colHead('语法速查', { badge: REFERENCE.length + ' 条' }));
    var syntaxBody = ui.el('div', 't-col-body');
    var syntaxScroll = ui.el('div', 't-scroll');
    var refList = ui.el('ul', 't-ref');

    REFERENCE.forEach(function (item) {
      var row = ui.el('li');
      row.appendChild(ui.el('code', '', item[0]));
      row.appendChild(ui.el('span', '', item[1]));
      refList.appendChild(row);
    });

    syntaxScroll.appendChild(refList);
    syntaxBody.appendChild(syntaxScroll);
    syntaxCol.appendChild(syntaxBody);
    syntaxPanel.appendChild(syntaxCol);
    root.appendChild(syntaxPanel);

    /* ---------------- 代码生成面板 ---------------- */

    var codePanel = ui.el('div', 't-cols');
    codePanel.hidden = true;

    var codeViews = {
      javascript: makeCodeCard(codePanel, 'JavaScript', 'javascript', 'new RegExp(...)'),
      java: makeCodeCard(codePanel, 'Java', 'java', 'Pattern.compile(...)'),
      python: makeCodeCard(codePanel, 'Python', 'python', 're.compile(...)'),
      go: makeCodeCard(codePanel, 'Go', 'text', 'regexp.MustCompile(...)')
    };

    root.appendChild(codePanel);

    var panels = {
      match: matchPanel,
      replace: replacePanel,
      split: splitPanel,
      syntax: syntaxPanel,
      code: codePanel
    };

    /* ---------------- 视图辅助 ---------------- */

    function makeCodeView(options) {
      var view = ui.codeView(options);

      if (view) {
        view.setWrap(true);
        return view;
      }

      /* 没有 CodeView 时的降级实现，保证工具仍可使用 */
      var pre = ui.el('pre', 't-result');
      pre.textContent = options && options.placeholder ? options.placeholder : '';
      return {
        root: pre,
        pre: pre,
        setValue: function (text) { pre.textContent = text || ''; },
        getValue: function () { return pre.textContent; },
        setWrap: function () {}
      };
    }

    function makeCodeCard(host, title, language, placeholder) {
      var col = ui.el('section', 't-col');
      var view = makeCodeView({ language: language, placeholder: placeholder });

      col.appendChild(ui.colHead(title, {
        actions: [ui.copyButton(function () { return view.getValue(); }, '复制')]
      }));

      var body = ui.el('div', 't-col-body');
      body.appendChild(view.root);
      col.appendChild(body);
      host.appendChild(col);

      return view;
    }

    function addStat(parent, label, value) {
      var span = ui.el('span', 't-stat');
      span.appendChild(document.createTextNode(label + ' '));
      span.appendChild(ui.el('b', '', value));
      parent.appendChild(span);
      return span;
    }

    /* ---------------- 修饰符与预览 ---------------- */

    function activeFlags() {
      var out = '';
      FLAGS.forEach(function (item) {
        if (state.flags[item.flag]) out += item.flag;
      });
      return out;
    }

    function syncFlagButtons(flags) {
      FLAGS.forEach(function (item) {
        var button = flagButtons[item.flag];
        if (!button) return;
        button.setAttribute('aria-pressed', flags.indexOf(item.flag) >= 0 ? 'true' : 'false');
      });
    }

    /** 把修饰符回写到内部状态，保证切回纯 pattern 写法时按钮仍然一致 */
    function syncFlagState(flags) {
      FLAGS.forEach(function (item) {
        state.flags[item.flag] = flags.indexOf(item.flag) >= 0;
      });
    }

    function toggleFlag(flag) {
      var parsed = parseSlash(patternInput.value);

      if (parsed) {
        /* 斜杠写法：直接改写结尾的修饰符，保持输入与按钮一致 */
        var flags = parsed.flags;

        if (flags.indexOf(flag) >= 0) flags = flags.replace(flag, '');
        else flags += flag;

        patternInput.value = '/' + parsed.pattern + '/' + normalizeFlags(flags);
      } else {
        state.flags[flag] = !state.flags[flag];
      }

      compute();
    }

    function updatePreview(pattern, flags, parsed) {
      if (!pattern) {
        preview.textContent = '（空）';
        preview.title = '输入正则后显示完整表达式';
        return;
      }

      preview.textContent = '/' + pattern + '/' + flags;
      preview.title = parsed ? '已按 /pattern/flags 斜杠写法解析' : '当前完整表达式';
    }

    /* ---------------- 匹配 ---------------- */

    function makeMatch(text, match) {
      var position = lineColumnAt(text, match.index);

      return {
        index: match.index,
        end: match.index + match[0].length,
        text: match[0],
        groups: match.slice(1),
        named: match.groups || {},
        line: position.line,
        column: position.column
      };
    }

    function compute() {
      var text = textArea.value;
      var parsed = parseSlash(patternInput.value);
      var pattern = parsed ? parsed.pattern : patternInput.value;
      var flags = parsed ? parsed.flags : activeFlags();

      if (parsed) syncFlagState(flags);
      syncFlagButtons(flags);
      updatePreview(pattern, flags, !!parsed);

      errorText.textContent = '';
      patternInput.classList.remove('is-invalid');
      state.currentIndex = -1;
      state.currentMark = null;
      state.replaceText = '';

      if (state.tab === 'replace') {
        replaceView.setValue('');
        replaceStats.textContent = '';
      }

      textStats.textContent = '';
      textStats.appendChild(ui.el('span', 't-stat',
        '字符 ' + text.length + ' · 行 ' + (text ? text.split('\n').length : 0)));

      var result = {
        pattern: pattern,
        flags: flags,
        text: text,
        matches: [],
        truncated: false,
        elapsed: 0,
        regex: null,
        error: ''
      };

      if (text.length > MAX_TEXT) {
        errorText.textContent = '测试文本超过 ' + MAX_TEXT + ' 字符，请缩短后再测试（避免页面卡死）。';
        result.error = '文本过长';
        lastResult = result;
        renderMatch(result);
        refreshAux();
        return;
      }

      if (!pattern) {
        lastResult = result;
        renderMatch(result);
        refreshAux();
        return;
      }

      var regex;

      try {
        regex = new RegExp(pattern, flags);
      } catch (err) {
        result.error = describeRegexError(err, pattern);
        patternInput.classList.add('is-invalid');
        errorText.textContent = result.error;
        lastResult = result;
        renderMatch(result);
        refreshAux();
        return;
      }

      result.regex = regex;

      var started = now();
      var isUnicode = flags.indexOf('u') >= 0;
      var isGlobal = flags.indexOf('g') >= 0;
      var match;

      if (isGlobal) {
        while ((match = regex.exec(text)) !== null) {
          result.matches.push(makeMatch(text, match));

          if (match[0].length === 0) {
            /* 零宽匹配必须手动前进，否则 exec 会原地死循环 */
            var next = match.index + 1;
            if (isUnicode && isHighSurrogate(text.charCodeAt(match.index))) next++;
            regex.lastIndex = next;
          }

          if (result.matches.length >= MAX_MATCHES) {
            result.truncated = true;
            break;
          }

          if (now() - started > MAX_MS) {
            result.truncated = true;
            break;
          }

          if (regex.lastIndex > text.length) break;
        }
      } else {
        match = regex.exec(text);
        if (match) result.matches.push(makeMatch(text, match));
      }

      result.elapsed = Math.round(now() - started);

      lastResult = result;
      renderMatch(result);
      refreshAux();

      /* 查找条打开时同步刷新命中数，避免统计与文本不一致 */
      if (finder && finder.open) {
        try {
          finder.execute(true);
        } catch (err) {
          /* 查找条刷新失败不影响主流程 */
        }
      }
    }

    /* ---------------- 匹配渲染 ---------------- */

    function renderHighlight(result) {
      state.markMap = {};
      state.currentMark = null;

      var text = result ? result.text : textArea.value;
      var matches = result ? result.matches : [];

      highlight.textContent = '';

      if (!matches.length) {
        highlight.textContent = text;
        return;
      }

      var html = '';
      var cursor = 0;

      matches.forEach(function (item, index) {
        if (!item.text.length) return;
        if (item.index < cursor) return;

        html += escapeHtml(text.slice(cursor, item.index));
        html += '<mark data-i="' + index + '">' + escapeHtml(item.text) + '</mark>';
        cursor = item.index + item.text.length;
      });

      html += escapeHtml(text.slice(cursor));
      highlight.innerHTML = html;

      var marks = highlight.querySelectorAll('mark');
      for (var i = 0; i < marks.length; i++) {
        state.markMap[Number(marks[i].getAttribute('data-i'))] = marks[i];
      }
    }

    function markCurrent(index) {
      if (state.currentMark) state.currentMark.classList.remove('is-current');

      var mark = state.markMap[index] || null;
      state.currentMark = mark;
      if (mark) mark.classList.add('is-current');
    }

    function renderMatch(result) {
      renderHighlight(result);
      renderList(result);

      resultStats.textContent = '';

      if (!result) return;

      if (!result.pattern) {
        resultBadge.textContent = '—';
        resultStats.appendChild(ui.el('span', 't-stat', '输入正则表达式后开始匹配'));
        return;
      }

      if (!result.regex) {
        resultBadge.textContent = result.error ? '未执行' : '无效';
        resultStats.appendChild(ui.el('span', 't-stat', result.error || '正则表达式无效，未执行匹配'));
        return;
      }

      resultBadge.textContent = result.matches.length + ' 处';
      addStat(resultStats, '匹配', result.matches.length + ' 处');
      addStat(resultStats, '耗时', result.elapsed + ' ms');
      addStat(resultStats, '修饰符', result.flags || '无');

      if (result.truncated) {
        resultStats.appendChild(ui.el('span', 't-stat',
          '已截断（上限 ' + MAX_MATCHES + ' 处 / ' + MAX_MS + ' ms）'));
      }

      if (!result.matches.length) {
        resultStats.appendChild(ui.el('span', 't-stat', '没有匹配'));
        return;
      }

      /* 默认把第一处匹配标为「当前匹配」，方便直接点「替换当前」 */
      if (state.currentIndex < 0) state.currentIndex = 0;
      markCurrent(state.currentIndex);
    }

    function buildGroups(item) {
      var parts = [];
      var groups = item.groups || [];
      var limit = Math.min(9, groups.length);

      for (var i = 0; i < limit; i++) {
        parts.push({ name: '$' + (i + 1), value: groups[i] });
      }

      var named = item.named || {};
      Object.keys(named).forEach(function (name) {
        parts.push({ name: name, value: named[name] });
      });

      if (!parts.length) return null;

      var box = ui.el('div', 't-groups');

      parts.forEach(function (part) {
        var span = ui.el('span');
        span.appendChild(ui.el('b', '', part.name));

        var text = part.value === undefined
          ? '（未参与匹配）'
          : String(part.value);

        if (text.length > 80) text = text.slice(0, 80) + '…';

        span.appendChild(document.createTextNode(' = ' + text));
        box.appendChild(span);
      });

      return box;
    }

    function buildRow(item, index, text) {
      var row = ui.el('div', 't-row');
      row.style.cursor = 'pointer';
      row.title = '点击跳到测试文本第 ' + item.line + ' 行第 ' + item.column + ' 列';

      row.appendChild(ui.el('div', 't-row-key', '#' + (index + 1) + ' ' + item.line + ':' + item.column));

      var val = ui.el('div', 't-row-val');
      var main = ui.el('div', 't-row-main');

      if (!item.text.length) {
        main.textContent = '（零宽匹配）';
        main.classList.add('is-muted');
      } else {
        var previewText = item.text.length > 180 ? item.text.slice(0, 180) + '…' : item.text;
        main.textContent = previewText;
      }

      val.appendChild(main);

      var groups = buildGroups(item);
      if (groups) val.appendChild(groups);

      row.appendChild(val);

      var act = ui.el('div', 't-row-act');
      act.appendChild(ui.miniButton('', {
        icon: 'i-copy',
        title: '复制命中文本',
        onClick: function (event) {
          if (event && event.stopPropagation) event.stopPropagation();
          ui.copyText(item.text).then(function (ok) {
            ui.toast(ok ? '已复制' : '复制失败');
          });
        }
      }));
      row.appendChild(act);

      row.addEventListener('click', function () { jumpTo(index); });

      return row;
    }

    function renderList(result) {
      listBox.textContent = '';
      moreBox.textContent = '';

      if (!result) return;

      if (!result.pattern) {
        listBox.appendChild(ui.empty('输入正则表达式后开始匹配', 'i-search'));
        return;
      }

      if (result.error && !result.regex) {
        listBox.appendChild(ui.empty('修正正则表达式后才能列出匹配', 'i-alert'));
        return;
      }

      var matches = result.matches;

      if (!matches.length) {
        listBox.appendChild(ui.empty('没有匹配到内容', 'i-search'));
        return;
      }

      var limit = state.expandAll ? matches.length : Math.min(matches.length, MAX_LIST);
      var frag = document.createDocumentFragment();

      for (var i = 0; i < limit; i++) {
        frag.appendChild(buildRow(matches[i], i, result.text));
      }

      listBox.appendChild(frag);

      if (matches.length > MAX_LIST) {
        var label = state.expandAll
          ? '只看前 ' + MAX_LIST + ' 条'
          : '展开全部（共 ' + matches.length + ' 条）';

        moreBox.appendChild(ui.miniButton(label, {
          icon: state.expandAll ? 'i-shrink' : 'i-expand',
          title: state.expandAll ? '折叠列表' : '展开全部匹配',
          onClick: function () {
            state.expandAll = !state.expandAll;
            renderList(lastResult);
          }
        }));
      }
    }

    function jumpTo(index) {
      if (!lastResult || !lastResult.matches[index]) return;

      var item = lastResult.matches[index];
      state.currentIndex = index;

      textArea.focus();
      textArea.setSelectionRange(item.index, item.index + item.text.length);

      /* setSelectionRange 不保证可见，按行号手动滚动到中间 */
      var before = textArea.value.slice(0, item.index);
      var line = before.split('\n').length - 1;
      var lineHeight = parseFloat(window.getComputedStyle(textArea).lineHeight) || 20;
      textArea.scrollTop = Math.max(0, line * lineHeight - textArea.clientHeight / 2 + lineHeight);

      markCurrent(index);
    }

    /* ---------------- 替换 ---------------- */

    function renderReplaceStats(count, note) {
      replaceStats.textContent = '';
      addStat(replaceStats, '替换', count + ' 处' + (note ? ' ' + note : ''));
    }

    function doReplaceOne() {
      if (!lastResult || !lastResult.regex || !lastResult.matches.length) {
        ui.toast('当前没有可替换的匹配');
        return;
      }

      var index = state.currentIndex;

      if (index < 0 || index >= lastResult.matches.length) index = 0;

      var item = lastResult.matches[index];
      var expanded = expandReplacement(item, replaceInput.value, lastResult.text);

      state.replaceText = lastResult.text.slice(0, item.index) + expanded
        + lastResult.text.slice(item.index + item.text.length);

      replaceView.setValue(state.replaceText);
      renderReplaceStats(1, '（第 ' + (index + 1) + ' 处，共 ' + lastResult.matches.length + ' 处）');
      markCurrent(index);
      ui.toast('已生成替换结果（第 ' + (index + 1) + ' 处）');
    }

    function doReplaceAll() {
      if (!lastResult || !lastResult.regex || !lastResult.matches.length) {
        ui.toast('当前没有可替换的匹配');
        return;
      }

      var flags = lastResult.flags;
      if (flags.indexOf('g') < 0) flags += 'g';

      var regex;

      try {
        regex = new RegExp(lastResult.pattern, flags);
      } catch (err) {
        ui.toast('替换失败：' + err.message);
        return;
      }

      /* 手动展开模板，替换次数与结果严格一致，也便于给出精确计数 */
      var text = lastResult.text;
      var template = replaceInput.value;
      var unicode = flags.indexOf('u') >= 0;
      var started = now();
      var output = '';
      var cursor = 0;
      var count = 0;
      var truncated = false;
      var match;

      while ((match = regex.exec(text)) !== null) {
        if (count >= MAX_REPLACE) {
          truncated = true;
          break;
        }

        output += text.slice(cursor, match.index);
        output += expandReplacement({
          index: match.index,
          text: match[0],
          groups: match.slice(1),
          named: match.groups || {}
        }, template, text);

        cursor = match.index + match[0].length;
        count++;

        if (match[0].length === 0) {
          var next = match.index + 1;
          if (unicode && isHighSurrogate(text.charCodeAt(match.index))) next++;
          regex.lastIndex = next;
        }

        if (now() - started > MAX_MS) {
          truncated = true;
          break;
        }

        if (regex.lastIndex > text.length) break;
      }

      output += text.slice(cursor);

      state.replaceText = output;
      replaceView.setValue(output);
      renderReplaceStats(count, truncated ? '（已截断）' : undefined);

      if (truncated) {
        ui.toast('匹配过多，只替换了前 ' + count + ' 处');
      } else {
        ui.toast('已替换 ' + count + ' 处');
      }
    }

    function doApplyReplace() {
      if (!state.replaceText) {
        ui.toast('请先生成替换结果');
        return;
      }

      textArea.value = state.replaceText;
      state.replaceText = '';
      replaceView.setValue('');
      replaceStats.textContent = '';
      compute();
      ui.toast('已写回测试文本');
    }

    /* ---------------- 拆分 ---------------- */

    function renderSplit() {
      splitRows.textContent = '';
      splitStats.textContent = '';
      splitBadge.textContent = '—';

      if (!lastResult || !lastResult.regex) {
        splitRows.appendChild(ui.empty('输入合法正则后查看拆分结果', 'i-shrink'));
        return;
      }

      var pieces;

      try {
        pieces = lastResult.text.split(lastResult.regex);
      } catch (err) {
        splitRows.appendChild(ui.note('拆分失败：' + err.message, 'error'));
        return;
      }

      var drop = splitDropEmpty.input.checked;
      var list = [];

      pieces.forEach(function (piece) {
        if (drop && !piece.length) return;
        list.push(piece);
      });

      splitBadge.textContent = list.length + ' 段';
      addStat(splitStats, '片段', list.length + ' 段');
      addStat(splitStats, '原始', pieces.length + ' 段');

      if (!list.length) {
        splitRows.appendChild(ui.empty('拆分结果为空（全部是空项）', 'i-shrink'));
        return;
      }

      var frag = document.createDocumentFragment();
      var limit = Math.min(list.length, MAX_SPLIT);

      for (var i = 0; i < limit; i++) {
        frag.appendChild(buildSplitRow(i, list[i]));
      }

      splitRows.appendChild(frag);

      if (list.length > MAX_SPLIT) {
        splitRows.appendChild(ui.note('共 ' + list.length + ' 段，只显示前 ' + MAX_SPLIT + ' 段。', 'warn'));
      }
    }

    /** 单行拆分结果（独立函数，避免闭包共享循环变量） */
    function buildSplitRow(index, piece) {
      var row = ui.el('div', 't-row');
      row.appendChild(ui.el('div', 't-row-key', '#' + (index + 1)));

      var val = ui.el('div', 't-row-val');
      var main = ui.el('div', 't-row-main');

      if (!piece.length) {
        main.textContent = '（空）';
        main.classList.add('is-muted');
      } else {
        main.textContent = piece.length > 240 ? piece.slice(0, 240) + '…' : piece;
      }

      val.appendChild(main);
      row.appendChild(val);

      var act = ui.el('div', 't-row-act');
      act.appendChild(ui.miniButton('', {
        icon: 'i-copy',
        title: '复制这一段',
        onClick: function () {
          ui.copyText(piece).then(function (ok) {
            ui.toast(ok ? '已复制' : '复制失败');
          });
        }
      }));
      row.appendChild(act);

      return row;
    }

    /* ---------------- 代码生成 ---------------- */

    function renderCode() {
      if (!lastResult || !lastResult.pattern || !lastResult.regex) {
        var placeholder = '# 输入合法的正则表达式后生成代码';
        codeViews.javascript.setValue(placeholder);
        codeViews.java.setValue(placeholder);
        codeViews.python.setValue(placeholder);
        codeViews.go.setValue(placeholder);
        return;
      }

      var sample = lastResult.text.split('\n')[0] || '';
      if (sample.length > 40) sample = sample.slice(0, 40) + '…';

      var snippets = buildSnippets(lastResult.pattern, lastResult.flags, sample);

      codeViews.javascript.setValue(snippets.javascript);
      codeViews.java.setValue(snippets.java);
      codeViews.python.setValue(snippets.python);
      codeViews.go.setValue(snippets.go);
    }

    /* ---------------- 标签页切换 ---------------- */

    function setTab(name) {
      if (!panels[name]) return;

      state.tab = name;

      TABS.forEach(function (tab) {
        var button = tabButtons[tab.value];
        if (!button) return;
        var active = tab.value === name;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      Object.keys(panels).forEach(function (key) {
        panels[key].hidden = key !== name;
      });

      if (name === 'split') renderSplit();
      else if (name === 'code') renderCode();
    }

    function refreshAux() {
      /* 只在对应面板可见时重绘，避免每次按键都做无用的着色 / 拆分 */
      if (state.tab === 'code') renderCode();
      if (state.tab === 'split') renderSplit();
    }

    /* ---------------- 示例 ---------------- */

    function applyPreset(preset) {
      patternInput.value = preset.pattern;

      state.flags = { g: false, i: false, m: false, s: false, u: false, y: false };
      (preset.flags || '').split('').forEach(function (flag) {
        if (state.flags.hasOwnProperty(flag)) state.flags[flag] = true;
      });

      state.expandAll = false;
      textArea.value = preset.sample;
      syncFlagButtons(activeFlags());
      compute();
    }

    /* ---------------- 查找 ---------------- */

    function ensureFinder() {
      if (finder) return finder;
      if (!window.Finder) return null;

      finder = window.Finder.attach(root, {
        label: '正则查找',
        scope: '测试文本 + 匹配结果',
        targets: [textArea, highlight],
        getText: function () { return textArea.value; },
        onReplace: function (next) {
          textArea.value = next;
          compute();
        }
      });

      return finder;
    }

    /* ---------------- 事件 ---------------- */

    patternInput.addEventListener('input', ui.debounce(compute, 160));
    textArea.addEventListener('input', ui.debounce(compute, 160));

    splitDropEmpty.input.addEventListener('change', renderSplit);
    replaceOneBtn.addEventListener('click', doReplaceOne);
    replaceAllBtn.addEventListener('click', doReplaceAll);
    applyBtn.addEventListener('click', doApplyReplace);

    sampleBtn.addEventListener('click', function () {
      var preset = null;

      for (var i = 0; i < PRESETS.length; i++) {
        if (PRESETS[i].name === '邮箱') {
          preset = PRESETS[i];
          break;
        }
      }

      applyPreset(preset || PRESETS[0]);
    });

    /* 首屏：默认 \d+，直接出结果 */
    patternInput.value = '\\d+';
    textArea.value = '订单 2026 年共 128 笔，金额 45600 元。';
    syncFlagButtons(activeFlags());
    compute();

    return {
      root: root,
      compute: compute,
      find: function (options) {
        var controller = ensureFinder();
        if (!controller) return false;
        return controller.show(options && options.replace);
      }
    };
  }

  var instance = null;

  TB.register({
    id: 'regex',
    group: '文本',
    title: '正则测试',
    desc: '实时高亮全部匹配，列出捕获组与命名组，支持替换 / 拆分 / 速查 / 代码生成',
    icon: 'i-search',
    keywords: ['regex', 'regexp', '正则', 'match', '捕获组', 'replace', '替换'],
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], label: '重新匹配' },
      { keys: ['Ctrl', 'F'], label: '查找替换' }
    ],
    run: function () {
      if (instance) instance.compute();
    },
    find: function (options) {
      return instance ? instance.find(options) : false;
    },
    mount: function (host) {
      instance = build();
      host.appendChild(instance.root);
    }
  });
})();
