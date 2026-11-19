/* =========================================================
 * 开发工具箱 — SQL 格式化 / 压缩
 * 自研 tokenizer：正确处理字符串、引号标识符、行/块注释、参数占位符、
 * 美元引用字符串；格式化只改变空白与关键字大小写，不改动 token 序列。
 * ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SQLFormat = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var KEYWORDS = toSet(
    'SELECT FROM WHERE GROUP BY HAVING ORDER LIMIT OFFSET FETCH NEXT ROWS ONLY PERCENT TIES ' +
    'INSERT INTO VALUES UPDATE SET DELETE WITH RECURSIVE UNION ALL DISTINCT INTERSECT EXCEPT RETURNING WINDOW ' +
    'AS ON USING JOIN LEFT RIGHT FULL INNER OUTER CROSS NATURAL LATERAL APPLY ' +
    'AND OR NOT NULL IS IN BETWEEN LIKE ILIKE EXISTS ANY SOME ' +
    'CASE WHEN THEN ELSE END ASC DESC NULLS FIRST LAST ' +
    'CREATE TABLE ALTER DROP INDEX VIEW TRIGGER PROCEDURE FUNCTION DATABASE SCHEMA ' +
    'PRIMARY KEY FOREIGN REFERENCES DEFAULT CHECK UNIQUE CONSTRAINT IF ADD COLUMN MODIFY CHANGE RENAME ' +
    'TYPE TRUNCATE GRANT REVOKE BEGIN COMMIT ROLLBACK TRANSACTION START SAVEPOINT EXPLAIN ANALYZE VACUUM ' +
    'OVER PARTITION RANGE GROUPS CURRENT ROW PRECEDING FOLLOWING UNBOUNDED ' +
    'CAST TRY_CAST CONVERT COLLATE TOP WITHIN FILTER ' +
    'MERGE MATCHED SOURCE TARGET REPLACE IGNORE DUPLICATE ' +
    'UNSIGNED ZEROFILL CHARSET CHARACTER VARYING COLLATE ENGINE COMMENT AUTO_INCREMENT ' +
    'INT INTEGER BIGINT SMALLINT TINYINT DECIMAL NUMERIC FLOAT DOUBLE REAL BOOLEAN BOOL ' +
    'DATE TIME TIMESTAMP DATETIME INTERVAL YEAR MONTH DAY HOUR MINUTE SECOND ' +
    'TRUE FALSE UNKNOWN ARRAY JSON JSONB UUID SERIAL BIGSERIAL BLOB CLOB ' +
    'COUNT SUM AVG MIN MAX COALESCE NULLIF GREATEST LEAST NOW CURRENT_DATE CURRENT_TIME CURRENT_TIMESTAMP ' +
    'LENGTH SUBSTRING SUBSTR TRIM LTRIM RTRIM UPPER LOWER ROUND ABS CEIL FLOOR MOD POWER CONCAT GROUP_CONCAT ' +
    'ROW_NUMBER RANK DENSE_RANK LAG LEAD FIRST_VALUE LAST_VALUE NTILE STRING_AGG JSON_EXTRACT JSON_OBJECT ' +
    'EXISTS EXTRACT POSITION OVERLAY'
  );

  var CLAUSE_PHRASES = [
    ['GROUP', 'BY'],
    ['ORDER', 'BY'],
    ['INSERT', 'INTO'],
    ['DELETE', 'FROM'],
    ['UNION', 'ALL'],
    ['UNION', 'DISTINCT'],
    ['ON', 'CONFLICT'],
    ['ON', 'DUPLICATE']
  ];

  var JOIN_PHRASES = [
    ['LEFT', 'OUTER', 'JOIN'],
    ['RIGHT', 'OUTER', 'JOIN'],
    ['FULL', 'OUTER', 'JOIN'],
    ['NATURAL', 'LEFT', 'JOIN'],
    ['NATURAL', 'RIGHT', 'JOIN'],
    ['NATURAL', 'FULL', 'JOIN'],
    ['LEFT', 'JOIN'],
    ['RIGHT', 'JOIN'],
    ['FULL', 'JOIN'],
    ['INNER', 'JOIN'],
    ['CROSS', 'JOIN'],
    ['NATURAL', 'JOIN'],
    ['STRAIGHT_JOIN'],
    ['JOIN']
  ];

  var CLAUSE_WORDS = toSet(
    'SELECT FROM WHERE HAVING LIMIT OFFSET FETCH VALUES SET RETURNING WINDOW UPDATE WITH ' +
    'UNION INTERSECT EXCEPT INSERT DELETE'
  );

  /* 这些关键字后面的左括号需要保留空格，其余按函数调用处理 */
  var PAREN_SPACE_WORDS = toSet(
    'IN EXISTS VALUES SELECT WHERE ON AND OR NOT BY AS RETURNING SET JOIN USING OVER PARTITION ' +
    'WHEN THEN ELSE CASE FROM DISTINCT ALL ANY SOME'
  );

  var MULTI_OPERATORS = ['->>', '!~*', '::', ':=', '=>', '<=', '>=', '<>', '!=', '||', '&&', '<<', '>>', '->', '!~', '~*'];

  function toSet(text) {
    var map = Object.create(null);
    text.split(/\s+/).forEach(function (word) {
      if (word) map[word] = true;
    });
    return map;
  }

  function locate(text, position) {
    var line = 1;
    var lineStart = 0;
    var end = Math.min(Math.max(position, 0), text.length);

    for (var i = 0; i < end; i++) {
      if (text.charCodeAt(i) === 10) {
        line++;
        lineStart = i + 1;
      }
    }

    return { line: line, column: end - lineStart + 1 };
  }

  function fail(text, message, position) {
    var loc = locate(text, position);
    var error = new Error(message + '（第 ' + loc.line + ' 行，第 ' + loc.column + ' 列）');
    error.name = 'SQLFormatError';
    error.line = loc.line;
    error.column = loc.column;
    error.position = position;
    throw error;
  }

  function isWordStart(ch) {
    if (!ch) return false;
    var code = ch.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 95 || code >= 128;
  }

  function isWordPart(ch) {
    if (!ch) return false;
    var code = ch.charCodeAt(0);
    return (
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122) ||
      (code >= 48 && code <= 57) ||
      code === 95 ||
      code === 36 ||
      code >= 128
    );
  }

  function isDigit(ch) {
    return ch >= '0' && ch <= '9';
  }

  /* ---------------- 词法分析 ---------------- */

  function tokenize(sql) {
    var text = String(sql === null || sql === undefined ? '' : sql);
    var tokens = [];
    var index = 0;
    var line = 1;
    var lineStart = 0;

    function bump(count) {
      var end = Math.min(index + count, text.length);
      for (; index < end; index++) {
        if (text.charCodeAt(index) === 10) {
          line++;
          lineStart = index + 1;
        }
      }
    }

    function push(type, value, start, startLine, startColumn, extra) {
      var token = {
        type: type,
        value: value,
        start: start,
        end: index,
        line: startLine,
        column: startColumn
      };

      if (extra) {
        for (var key in extra) {
          if (Object.prototype.hasOwnProperty.call(extra, key)) token[key] = extra[key];
        }
      }

      if (type === 'word') token.upper = value.toUpperCase();

      tokens.push(token);
      return token;
    }

    function readQuoted(quote, doubled, type) {
      var startIndex = index;
      bump(1);

      while (index < text.length) {
        var ch = text.charAt(index);

        if (ch === '\\' && type === 'string' && index + 1 < text.length) {
          bump(2);
          continue;
        }

        if (ch === quote) {
          if (doubled && text.charAt(index + 1) === quote) {
            bump(2);
            continue;
          }
          bump(1);
          return text.slice(startIndex, index);
        }

        bump(1);
      }

      fail(text, type === 'string' ? '字符串未闭合（缺少结束引号）' : '引号标识符未闭合', startIndex);
    }

    while (index < text.length) {
      var ch = text.charAt(index);
      var start = index;
      var startLine = line;
      var startColumn = index - lineStart + 1;

      /* 空白 */
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '\f' || ch === '\v') {
        bump(1);
        continue;
      }

      /* 行注释 -- */
      if (ch === '-' && text.charAt(index + 1) === '-') {
        var lineEnd = text.indexOf('\n', index);
        if (lineEnd < 0) lineEnd = text.length;
        var lineRaw = text.slice(index, lineEnd);
        bump(lineRaw.length);
        push('comment', lineRaw, start, startLine, startColumn, { kind: 'line' });
        continue;
      }

      /* 块注释 */
      if (ch === '/' && text.charAt(index + 1) === '*') {
        var close = text.indexOf('*/', index + 2);
        if (close < 0) fail(text, '块注释未闭合（缺少 */）', index);
        var blockRaw = text.slice(index, close + 2);
        bump(blockRaw.length);
        push('comment', blockRaw, start, startLine, startColumn, { kind: 'block' });
        continue;
      }

      /* MySQL # 注释：仅行首或后跟空白时生效，避免与 PostgreSQL 的 # 运算符冲突 */
      if (ch === '#') {
        var beforeOnLine = text.slice(lineStart, index).replace(/\s+$/, '');
        var nextChar = text.charAt(index + 1);
        if (beforeOnLine === '' || nextChar === '' || nextChar === ' ' || nextChar === '\t') {
          var hashEnd = text.indexOf('\n', index);
          if (hashEnd < 0) hashEnd = text.length;
          var hashRaw = text.slice(index, hashEnd);
          bump(hashRaw.length);
          push('comment', hashRaw, start, startLine, startColumn, { kind: 'line' });
          continue;
        }
      }

      /* 字符串 */
      if (ch === "'") {
        var stringRaw = readQuoted("'", true, 'string');
        push('string', stringRaw, start, startLine, startColumn);
        continue;
      }

      /* 引号标识符 */
      if (ch === '"') {
        var doubleRaw = readQuoted('"', true, 'ident');
        push('ident', doubleRaw, start, startLine, startColumn);
        continue;
      }

      if (ch === '`') {
        var backRaw = readQuoted('`', true, 'ident');
        push('ident', backRaw, start, startLine, startColumn);
        continue;
      }

      if (ch === '[') {
        var bracketStart = index;
        bump(1);
        var closed = false;
        while (index < text.length) {
          var bracketCh = text.charAt(index);
          if (bracketCh === ']') {
            if (text.charAt(index + 1) === ']') {
              bump(2);
              continue;
            }
            bump(1);
            closed = true;
            break;
          }
          bump(1);
        }
        if (!closed) fail(text, '方括号标识符未闭合（缺少 ]）', bracketStart);
        push('ident', text.slice(bracketStart, index), start, startLine, startColumn);
        continue;
      }

      /* 美元引用字符串与 $1 参数 */
      if (ch === '$') {
        var dollarMatch = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(text.slice(index));

        if (dollarMatch) {
          var delimiter = dollarMatch[0];
          var closeAt = text.indexOf(delimiter, index + delimiter.length);
          if (closeAt < 0) fail(text, '美元引用字符串未闭合', index);
          var dollarRaw = text.slice(index, closeAt + delimiter.length);
          bump(dollarRaw.length);
          push('string', dollarRaw, start, startLine, startColumn);
          continue;
        }

        var positional = /^\$\d+/.exec(text.slice(index));
        if (positional) {
          bump(positional[0].length);
          push('param', positional[0], start, startLine, startColumn);
          continue;
        }
      }

      /* 数字 */
      if (isDigit(ch) || (ch === '.' && isDigit(text.charAt(index + 1)))) {
        var numberMatch = /^(?:0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/.exec(text.slice(index));
        if (numberMatch) {
          bump(numberMatch[0].length);
          push('number', numberMatch[0], start, startLine, startColumn);
          continue;
        }
      }

      /* 标识符 / 关键字 */
      if (isWordStart(ch)) {
        var wordStart = index;
        while (index < text.length && isWordPart(text.charAt(index))) bump(1);
        var word = text.slice(wordStart, index);

        /* E'..' / N'..' / X'..' / B'..' 前缀字符串：必须合并为一个 token */
        var upperWord = word.toUpperCase();
        if ((upperWord === 'E' || upperWord === 'N' || upperWord === 'X' || upperWord === 'B') && text.charAt(index) === "'") {
          var prefixed = readQuoted("'", true, 'string');
          push('string', word + prefixed, start, startLine, startColumn);
          continue;
        }

        push('word', word, start, startLine, startColumn);
        continue;
      }

      /* 参数占位符 */
      if (ch === '?') {
        bump(1);
        push('param', '?', start, startLine, startColumn);
        continue;
      }

      if (ch === ':') {
        if (text.charAt(index + 1) === ':') {
          bump(2);
          push('punct', '::', start, startLine, startColumn);
          continue;
        }
        if (isWordStart(text.charAt(index + 1))) {
          bump(1);
          while (index < text.length && isWordPart(text.charAt(index))) bump(1);
          push('param', text.slice(start, index), start, startLine, startColumn);
          continue;
        }
      }

      if (ch === '@') {
        bump(1);
        if (text.charAt(index) === '@') bump(1);
        while (index < text.length && isWordPart(text.charAt(index))) bump(1);
        push('param', text.slice(start, index), start, startLine, startColumn);
        continue;
      }

      /* 多字符运算符 */
      var matched = null;
      for (var m = 0; m < MULTI_OPERATORS.length; m++) {
        var operator = MULTI_OPERATORS[m];
        if (text.substr(index, operator.length) === operator) {
          matched = operator;
          break;
        }
      }

      if (matched) {
        bump(matched.length);
        push('punct', matched, start, startLine, startColumn);
        continue;
      }

      /* 单字符标点 */
      if ('()[],.;+-*/%=<>!|&^~:'.indexOf(ch) >= 0) {
        bump(1);
        push('punct', ch, start, startLine, startColumn);
        continue;
      }

      fail(text, '无法识别的字符 “' + ch + '”', index);
    }

    return tokens;
  }

  /* ---------------- 关键字与短语 ---------------- */

  function applyCase(word, mode) {
    if (mode === 'lower') return word.toLowerCase();
    if (mode === 'upper') return word.toUpperCase();
    return word;
  }

  function casedValue(token, mode) {
    if (token.type === 'word' && KEYWORDS[token.upper]) return applyCase(token.value, mode);
    return token.value;
  }

  function phraseAt(tokens, index, phrases) {
    for (var i = 0; i < phrases.length; i++) {
      var phrase = phrases[i];
      var ok = true;

      for (var k = 0; k < phrase.length; k++) {
        var token = tokens[index + k];
        if (!token || token.type !== 'word' || token.upper !== phrase[k]) {
          ok = false;
          break;
        }
      }

      if (ok) return phrase;
    }

    return null;
  }

  /* ---------------- 格式化 ---------------- */

  function indentUnit(options) {
    var indent = options && options.indent;
    if (typeof indent === 'string') return indent;
    if (typeof indent === 'number' && indent > 0) return new Array(Math.min(10, Math.floor(indent)) + 1).join(' ');
    return '  ';
  }

  function format(sql, options) {
    options = options || {};

    var tokens = tokenize(sql);
    var unit = indentUnit(options);
    var caseMode = options.keywordCase || 'upper';
    var commaBefore = options.commaPosition === 'before';
    var keepComments = options.removeComments !== true;

    var lines = [];
    var buffer = '';
    var indent = 0;
    var parens = [];
    var cases = [];
    var removedComments = 0;

    function pad(level) {
      var out = '';
      for (var i = 0; i < level; i++) out += unit;
      return out;
    }

    function flush() {
      if (!buffer) return;
      lines.push(pad(indent) + buffer.replace(/\s+$/, ''));
      buffer = '';
    }

    function newline(level) {
      flush();
      indent = Math.max(0, level);
    }

    function append(text, spaceBefore) {
      if (!buffer) {
        buffer = text;
        return;
      }
      buffer += (spaceBefore ? ' ' : '') + text;
    }

    function inInlineParen() {
      return parens.length > 0 && !parens[parens.length - 1].subquery;
    }

    function baseIndent() {
      for (var i = parens.length - 1; i >= 0; i--) {
        if (parens[i].subquery) return parens[i].openIndent + 1;
      }
      return 0;
    }

    function canBreak() {
      return !inInlineParen();
    }

    function bufferIsClauseHead() {
      return /^(SELECT|WHERE|SET|VALUES|HAVING|RETURNING|ON|AND|OR|BY)$/i.test(buffer.trim());
    }

    function isSubqueryStart(position) {
      for (var i = position; i < tokens.length; i++) {
        var token = tokens[i];
        if (token.type === 'comment') continue;
        if (token.type !== 'word') return false;
        return token.upper === 'SELECT' || token.upper === 'WITH' || token.upper === 'VALUES';
      }
      return false;
    }

    function needsSpace(previous, token) {
      if (!previous) return false;

      var value = token.type === 'punct' ? token.value : token.type === 'word' ? token.upper : '';

      if (value === ')' || value === ',' || value === ';' || value === '.' || value === '::') return false;
      if (previous.value === '(' || previous.value === '.' || previous.value === '::') return false;
      if (value === '[') return false;

      if (token.type === 'punct' && token.value === '(') {
        if (previous.type === 'word') return !!PAREN_SPACE_WORDS[previous.upper];
        return previous.value !== '(';
      }

      return true;
    }

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      var previous = i > 0 ? tokens[i - 1] : null;

      /* 注释 */
      if (token.type === 'comment') {
        if (!keepComments) {
          removedComments++;
          continue;
        }

        if (token.kind === 'line') {
          append(token.value, !!buffer);
          newline(indent);
          continue;
        }

        /* 块注释整体保留（多行注释内部换行不参与缩进计算） */
        append(token.value, !!buffer);
        continue;
      }

      /* 分号 */
      if (token.type === 'punct' && token.value === ';') {
        append(';', false);
        newline(0);
        cases.length = 0;
        continue;
      }

      /* 左括号 */
      if (token.type === 'punct' && token.value === '(') {
        var subquery = isSubqueryStart(i + 1);
        append('(', needsSpace(previous, token));

        if (subquery) {
          parens.push({ subquery: true, openIndent: indent });
          newline(baseIndent());
        } else {
          parens.push({ subquery: false, openIndent: indent });
        }
        continue;
      }

      /* 右括号 */
      if (token.type === 'punct' && token.value === ')') {
        var entry = parens.pop();

        if (entry && entry.subquery) {
          newline(entry.openIndent);
        }

        append(')', false);
        continue;
      }

      /* 逗号 */
      if (token.type === 'punct' && token.value === ',') {
        if (canBreak()) {
          if (commaBefore) {
            newline(baseIndent() + 1);
            append(',', false);
          } else {
            append(',', false);
            newline(baseIndent() + 1);
          }
        } else {
          append(',', false);
        }
        continue;
      }

      /* 点号 / 类型转换：两侧紧贴 */
      if (token.type === 'punct' && (token.value === '.' || token.value === '::')) {
        append(token.value, false);
        continue;
      }

      /* 运算符 */
      if (token.type === 'punct') {
        append(token.value, needsSpace(previous, token));
        continue;
      }

      /* 关键字短语 */
      var clausePhrase = phraseAt(tokens, i, CLAUSE_PHRASES);
      var joinPhrase = phraseAt(tokens, i, JOIN_PHRASES);

      if (clausePhrase || joinPhrase) {
        var phraseTokens = clausePhrase || joinPhrase;
        var phraseText = phraseTokens.map(function (word, offset) {
          return applyCase(tokens[i + offset].value, caseMode);
        }).join(' ');

        if (canBreak()) newline(baseIndent());
        append(phraseText, !!buffer);

        i += phraseTokens.length - 1;
        continue;
      }

      /* 单词 */
      if (token.type === 'word') {
        var upper = token.upper;

        if (upper === 'CASE') {
          if (canBreak() && bufferIsClauseHead()) newline(baseIndent() + 1);
          cases.push({ indent: indent });
          append(casedValue(token, caseMode), !!buffer);
          continue;
        }

        if (upper === 'WHEN' || upper === 'ELSE') {
          if (canBreak()) {
            newline(cases.length ? cases[cases.length - 1].indent + 1 : baseIndent() + 1);
          }
          append(applyCase(token.value, caseMode), !!buffer);
          continue;
        }

        if (upper === 'END') {
          var closedCase = cases.pop();
          if (canBreak() && closedCase) newline(closedCase.indent);
          append(applyCase(token.value, caseMode), !!buffer);
          continue;
        }

        if (upper === 'AND' || upper === 'OR') {
          if (canBreak()) newline(baseIndent() + 1);
          append(applyCase(token.value, caseMode), !!buffer);
          continue;
        }

        if (CLAUSE_WORDS[upper] && canBreak()) {
          newline(baseIndent());
          append(applyCase(token.value, caseMode), false);
          continue;
        }

        append(casedValue(token, caseMode), needsSpace(previous, token));
        continue;
      }

      /* 字符串 / 标识符 / 数字 / 参数 */
      append(token.value, needsSpace(previous, token));
    }

    flush();

    var text = lines.join('\n');
    return { text: text, removedComments: removedComments };
  }

  /* ---------------- 压缩 ---------------- */

  function minify(sql, options) {
    options = options || {};

    var tokens = tokenize(sql);
    var caseMode = options.keywordCase || 'keep';
    var removeComments = options.removeComments !== false;
    var removedComments = 0;
    var out = '';
    var previous = null;

    function wordLike(token) {
      return token.type === 'word' || token.type === 'number' || token.type === 'string' || token.type === 'ident' || token.type === 'param';
    }

    function needSpace(prev, token) {
      if (!prev) return false;

      if (token.type === 'punct' && (token.value === ',' || token.value === ')' || token.value === ';' || token.value === '.' || token.value === '::')) return false;
      if (prev.type === 'punct' && (prev.value === '(' || prev.value === '.' || prev.value === '::')) return false;
      if (token.type === 'punct' && token.value === '(') return false;
      if (prev.type === 'punct' && prev.value === ')') return wordLike(token);
      if (wordLike(prev) && wordLike(token)) return true;

      return false;
    }

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (token.type === 'comment') {
        if (removeComments) {
          removedComments++;
          continue;
        }

        if (token.kind === 'line') {
          /* 行注释必须独占一行，否则会把后续 SQL 注释掉 */
          out += (out ? ' ' : '') + token.value + '\n';
          previous = null;
          continue;
        }

        out += (out ? ' ' : '') + token.value;
        previous = null;
        continue;
      }

      var text = token.type === 'word' ? casedValue(token, caseMode) : token.value;

      if (needSpace(previous, token)) out += ' ';

      /* 防止拼出注释起始符：a - -1 → a--1、a / * b → a/*b */
      if (out.slice(-1) === '-' && text.charAt(0) === '-') out += ' ';
      if (out.slice(-1) === '/' && text.charAt(0) === '*') out += ' ';
      if (out.slice(-1) === '*' && text.charAt(0) === '/') out += ' ';

      out += text;
      previous = token;
    }

    return { text: out.trim(), removedComments: removedComments };
  }

  /* ---------------- 测试辅助 ---------------- */

  function signature(tokens) {
    return tokens
      .filter(function (token) { return token.type !== 'comment'; })
      .map(function (token) {
        if (token.type === 'word') return 'w:' + token.upper;
        return token.type + ':' + token.value;
      })
      .join('|');
  }

  return {
    tokenize: tokenize,
    format: format,
    minify: minify,
    signature: signature,
    KEYWORDS: KEYWORDS
  };
});
