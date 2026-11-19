/* =========================================================
 * JSON 格式化 — 核心工具
 * 自研解析器：在格式化的同时保留原始字面量（大整数、1.0 等
 * 不会被 JSON.parse/stringify 改写），并提供精确的错误位置。
 * ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JSONTools = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MAX_DEPTH = 1000;

  function JSONParseError(message, position, line, column, source) {
    this.name = 'JSONParseError';
    this.message = message;
    this.position = position;
    this.line = line;
    this.column = column;
    this.source = source;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JSONParseError);
    } else {
      this.stack = new Error(message).stack;
    }
  }

  JSONParseError.prototype = Object.create(Error.prototype);
  JSONParseError.prototype.constructor = JSONParseError;

  function locate(text, position) {
    var line = 1;
    var lineStart = 0;
    var end = Math.min(Math.max(position, 0), text.length);
    for (var i = 0; i < end; i++) {
      var code = text.charCodeAt(i);
      if (code === 10) {
        line++;
        lineStart = i + 1;
      } else if (code === 13) {
        if (i + 1 < end && text.charCodeAt(i + 1) === 10) i++;
        line++;
        lineStart = i + 1;
      }
    }
    return { line: line, column: end - lineStart + 1 };
  }

  function isDigit(ch) {
    return ch >= '0' && ch <= '9';
  }

  function parse(text) {
    if (typeof text !== 'string') {
      throw new TypeError('JSON 内容必须是字符串');
    }

    var len = text.length;
    var i = 0;
    var depth = 0;

    // 允许文件开头的 BOM
    if (text.charCodeAt(0) === 0xfeff) i = 1;

    function fail(message, position) {
      var pos = typeof position === 'number' ? position : i;
      var loc = locate(text, pos);
      throw new JSONParseError(message, pos, loc.line, loc.column, text);
    }

    function skipWhitespace() {
      while (i < len) {
        var code = text.charCodeAt(i);
        if (code === 32 || code === 9 || code === 10 || code === 13) {
          i++;
        } else {
          break;
        }
      }
    }

    function parseString() {
      var start = i;
      i++; // 开头的引号
      var value = '';

      while (i < len) {
        var ch = text.charAt(i);

        if (ch === '"') {
          i++;
          return { type: 'string', raw: text.slice(start, i), value: value };
        }

        if (ch === '\\') {
          var esc = text.charAt(i + 1);
          if (esc === '') fail('字符串未闭合（缺少结束引号）', start);

          if (esc === 'u') {
            var hex = text.slice(i + 2, i + 6);
            if (hex.length !== 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) {
              fail('无效的 Unicode 转义，格式应为 \\uXXXX', i);
            }
            value += String.fromCharCode(parseInt(hex, 16));
            i += 6;
          } else {
            var map = {
              '"': '"',
              '\\': '\\',
              '/': '/',
              'b': '\b',
              'f': '\f',
              'n': '\n',
              'r': '\r',
              't': '\t'
            };
            if (!Object.prototype.hasOwnProperty.call(map, esc)) {
              fail('无效的转义字符 “\\' + esc + '”', i);
            }
            value += map[esc];
            i += 2;
          }
          continue;
        }

        if (ch.charCodeAt(0) < 0x20) {
          fail('字符串中不能包含未转义的控制字符', i);
        }

        value += ch;
        i++;
      }

      fail('字符串未闭合（缺少结束引号）', start);
    }

    function parseNumber() {
      var start = i;

      if (text.charAt(i) === '-') i++;

      if (i >= len) fail('数字格式不完整', start);

      var first = text.charAt(i);
      if (first === '0') {
        i++;
        if (isDigit(text.charAt(i))) fail('数字不能以 0 开头', i);
      } else if (first >= '1' && first <= '9') {
        i++;
        while (isDigit(text.charAt(i))) i++;
      } else {
        fail('无效的数字', i);
      }

      if (text.charAt(i) === '.') {
        i++;
        if (!isDigit(text.charAt(i))) fail('小数点后缺少数字', i);
        while (isDigit(text.charAt(i))) i++;
      }

      var exp = text.charAt(i);
      if (exp === 'e' || exp === 'E') {
        i++;
        var sign = text.charAt(i);
        if (sign === '+' || sign === '-') i++;
        if (!isDigit(text.charAt(i))) fail('指数部分缺少数字', i);
        while (isDigit(text.charAt(i))) i++;
      }

      return { type: 'number', raw: text.slice(start, i) };
    }

    function parseObject() {
      var start = i;
      i++; // {
      var entries = [];
      skipWhitespace();

      if (text.charAt(i) === '}') {
        i++;
        return { type: 'object', entries: entries };
      }

      while (true) {
        skipWhitespace();

        if (i >= len) fail('对象未闭合，缺少 “}”', start);
        if (text.charAt(i) === '}') fail('对象末尾不允许尾随逗号', i);
        if (text.charAt(i) !== '"') fail('对象的键必须是双引号字符串', i);

        var keyNode = parseString();

        skipWhitespace();
        if (text.charAt(i) !== ':') fail('键名后面缺少冒号 “:”', i);
        i++; // :

        var value = parseValue();

        entries.push({ key: keyNode.value, keyRaw: keyNode.raw, value: value });

        skipWhitespace();

        if (text.charAt(i) === ',') {
          i++;
          skipWhitespace();
          if (text.charAt(i) === '}') fail('对象末尾不允许尾随逗号', i);
          continue;
        }

        if (text.charAt(i) === '}') {
          i++;
          break;
        }

        if (i >= len) fail('对象未闭合，缺少 “}”', start);
        fail('对象成员之间缺少逗号 “,”', i);
      }

      return { type: 'object', entries: entries };
    }

    function parseArray() {
      var start = i;
      i++; // [
      var items = [];
      skipWhitespace();

      if (text.charAt(i) === ']') {
        i++;
        return { type: 'array', items: items };
      }

      while (true) {
        var value = parseValue();
        items.push(value);
        skipWhitespace();

        if (text.charAt(i) === ',') {
          i++;
          skipWhitespace();
          if (text.charAt(i) === ']') fail('数组末尾不允许尾随逗号', i);
          continue;
        }

        if (text.charAt(i) === ']') {
          i++;
          break;
        }

        if (i >= len) fail('数组未闭合，缺少 “]”', start);
        fail('数组元素之间缺少逗号 “,”', i);
      }

      return { type: 'array', items: items };
    }

    function parseLiteral() {
      var start = i;
      var rest = text.slice(i, i + 5);

      if (rest.slice(0, 4) === 'true') {
        i += 4;
        return { type: 'literal', raw: 'true' };
      }
      if (rest.slice(0, 5) === 'false') {
        i += 5;
        return { type: 'literal', raw: 'false' };
      }
      if (rest.slice(0, 4) === 'null') {
        i += 4;
        return { type: 'literal', raw: 'null' };
      }

      fail('无效的字面量，只能是 true、false 或 null', start);
    }

    function parseValue() {
      skipWhitespace();

      if (i >= len) fail('意外的输入结束，缺少 JSON 值', i);

      var ch = text.charAt(i);

      if (ch === '{') {
        if (depth >= MAX_DEPTH) {
          fail('嵌套层级过深（超过 ' + MAX_DEPTH + ' 层）', i);
        }
        depth++;
        var object = parseObject();
        depth--;
        return object;
      }

      if (ch === '[') {
        if (depth >= MAX_DEPTH) {
          fail('嵌套层级过深（超过 ' + MAX_DEPTH + ' 层）', i);
        }
        depth++;
        var array = parseArray();
        depth--;
        return array;
      }

      if (ch === '"') return parseString();

      if (ch === '-' || isDigit(ch)) return parseNumber();

      if (ch === 't' || ch === 'f' || ch === 'n') return parseLiteral();

      fail('意外的字符 “' + ch + '”', i);
    }

    var node = parseValue();
    skipWhitespace();

    if (i < len) {
      fail('JSON 值结束后存在多余内容', i);
    }

    return node;
  }

  function indentUnitOf(indent) {
    if (typeof indent === 'number') {
      return new Array(Math.max(0, Math.min(10, Math.floor(indent))) + 1).join(' ');
    }
    if (typeof indent === 'string') return indent;
    return '  ';
  }

  function serialize(node, options) {
    options = options || {};
    var unit = indentUnitOf(options.indent);
    var pretty = unit.length > 0;
    var newline = pretty ? '\n' : '';
    var colon = pretty ? ': ' : ':';
    var sortKeys = !!options.sortKeys;

    function pad(depth) {
      return pretty ? new Array(depth + 1).join(unit) : '';
    }

    function walk(current, level) {
      if (level > MAX_DEPTH) {
        throw new RangeError('嵌套层级过深（超过 ' + MAX_DEPTH + ' 层）');
      }

      switch (current.type) {
        case 'object': {
          var entries = current.entries;
          if (!entries.length) return '{}';

          if (sortKeys) {
            entries = entries
              .map(function (entry, index) {
                return { entry: entry, index: index };
              })
              .sort(function (a, b) {
                if (a.entry.key === b.entry.key) return a.index - b.index;
                return a.entry.key < b.entry.key ? -1 : 1;
              })
              .map(function (item) {
                return item.entry;
              });
          }

          var properties = entries.map(function (entry) {
            return pad(level + 1) + entry.keyRaw + colon + walk(entry.value, level + 1);
          });

          return '{' + newline + properties.join(',' + newline) + newline + pad(level) + '}';
        }

        case 'array': {
          if (!current.items.length) return '[]';
          var values = current.items.map(function (item) {
            return pad(level + 1) + walk(item, level + 1);
          });
          return '[' + newline + values.join(',' + newline) + newline + pad(level) + ']';
        }

        case 'string':
        case 'number':
        case 'literal':
          return current.raw;

        default:
          throw new TypeError('未知的 JSON 节点类型：' + current.type);
      }
    }

    return walk(node, 0);
  }

  function analyze(node) {
    var stats = {
      nodes: 0,
      objects: 0,
      arrays: 0,
      keys: 0,
      strings: 0,
      numbers: 0,
      booleans: 0,
      nulls: 0,
      maxDepth: 0,
      duplicates: 0
    };

    function walk(current, depth) {
      stats.nodes++;
      if (depth + 1 > stats.maxDepth) stats.maxDepth = depth + 1;

      switch (current.type) {
        case 'object': {
          stats.objects++;
          stats.keys += current.entries.length;
          var seen = Object.create(null);
          for (var i = 0; i < current.entries.length; i++) {
            var entry = current.entries[i];
            if (seen[entry.key]) {
              stats.duplicates++;
            } else {
              seen[entry.key] = true;
            }
            walk(entry.value, depth + 1);
          }
          break;
        }

        case 'array':
          stats.arrays++;
          for (var j = 0; j < current.items.length; j++) {
            walk(current.items[j], depth + 1);
          }
          break;

        case 'string':
          stats.strings++;
          break;

        case 'number':
          stats.numbers++;
          break;

        case 'literal':
          if (current.raw === 'null') stats.nulls++;
          else stats.booleans++;
          break;
      }
    }

    walk(node, 0);
    return stats;
  }

  function format(text, options) {
    var node = parse(text);
    return {
      node: node,
      output: serialize(node, options),
      stats: analyze(node)
    };
  }

  function minify(text, options) {
    options = options || {};
    var node = parse(text);
    return {
      node: node,
      output: serialize(node, { indent: 0, sortKeys: !!options.sortKeys }),
      stats: analyze(node)
    };
  }

  function escapeString(text) {
    return JSON.stringify(String(text));
  }

  function unescapeString(text) {
    var input = String(text).trim();
    if (!input) return '';

    // 已经是带引号的 JSON 字符串字面量
    if (input.charAt(0) === '"') {
      var parsed = parse(input);
      if (parsed.type !== 'string') {
        throw new Error('输入不是 JSON 字符串字面量');
      }
      return parsed.value;
    }

    // 裸转义文本：把未转义的引号补上转义，再按 JSON 字符串解析
    var body = '';
    for (var i = 0; i < input.length; i++) {
      var ch = input.charAt(i);

      if (ch === '"') {
        var slashes = 0;
        for (var j = body.length - 1; j >= 0 && body.charAt(j) === '\\'; j--) {
          slashes++;
        }
        body += slashes % 2 === 1 ? '"' : '\\"';
      } else if (ch === '\n') {
        body += '\\n';
      } else if (ch === '\r') {
        body += '\\r';
      } else if (ch === '\t') {
        body += '\\t';
      } else if (ch.charCodeAt(0) < 0x20) {
        body += '\\u' + ('000' + ch.charCodeAt(0).toString(16)).slice(-4);
      } else {
        body += ch;
      }
    }

    try {
      return JSON.parse('"' + body + '"');
    } catch (err) {
      throw new Error('无法去转义：' + (err && err.message ? err.message : '转义序列无效'));
    }
  }

  return {
    MAX_DEPTH: MAX_DEPTH,
    JSONParseError: JSONParseError,
    parse: parse,
    serialize: serialize,
    analyze: analyze,
    format: format,
    minify: minify,
    escapeString: escapeString,
    unescapeString: unescapeString
  };
});
