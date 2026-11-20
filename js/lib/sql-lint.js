/* =========================================================
 * 开发工具箱 — SQL 语法检查
 * 不依赖真正的语法分析器：用一个宽松的 tokenizer + 一轮启发式
 * 结构检查，找出「一定错」和「很可疑」的写法，并给出可点击定位的
 * 行 / 列。方言差异全部由 sql-dialects.js 提供的数据驱动。
 *
 *   SQLLint.lint(sql, { dialect: 'mysql' }) -> { diagnostics, stats, tokens }
 *   SQLLint.summary(result)                 -> { ok, errors, warnings, hints, text }
 * ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SQLLint = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* 超过这个长度只检查前 200k 字符，避免页面卡死 */
  var MAX_LENGTH = 200000;
  /* 单次检查最多返回多少条诊断 */
  var MAX_DIAGNOSTICS = 200;

  var LABELS = { error: '错误', warning: '警告', hint: '提示' };

  /* 无法取到 sql-dialects.js 时的兜底关键字表 */
  var FALLBACK = {
    keywords: 'SELECT FROM WHERE GROUP BY HAVING ORDER LIMIT OFFSET INSERT INTO VALUES UPDATE SET DELETE ' +
      'CREATE TABLE ALTER DROP INDEX VIEW WITH UNION ALL DISTINCT JOIN LEFT RIGHT FULL INNER OUTER CROSS ' +
      'AND OR NOT NULL IS IN BETWEEN LIKE EXISTS CASE WHEN THEN ELSE END AS ON USING PRIMARY KEY FOREIGN ' +
      'REFERENCES DEFAULT CHECK UNIQUE CONSTRAINT ADD COLUMN',
    types: 'INT INTEGER BIGINT SMALLINT TINYINT DECIMAL NUMERIC FLOAT DOUBLE REAL BOOLEAN BOOL DATE TIME ' +
      'TIMESTAMP DATETIME VARCHAR CHAR TEXT BLOB CLOB',
    functions: 'COUNT SUM AVG MIN MAX COALESCE NULLIF NOW LOWER UPPER LENGTH SUBSTRING TRIM ROUND ABS',
    operators: '',
    identifierChars: '"`',
    quoteChar: '`',
    supportsHashComment: true,
    supportsDollarQuote: true
  };

  function toSet(text) {
    var map = Object.create(null);
    String(text || '').split(/\s+/).forEach(function (word) {
      if (word) map[word.toUpperCase()] = true;
    });
    return map;
  }

  function getDialects() {
    if (typeof module === 'object' && module.exports) {
      try {
        return require('./sql-dialects.js');
      } catch (err) {
        return null;
      }
    }
    var scope = typeof globalThis !== 'undefined' ? globalThis : this;
    return scope.SQLDialects || null;
  }

  var SET_CACHE = Object.create(null);

  function setsOf(dialect) {
    var id = (dialect && dialect.id) || 'ansi';
    if (SET_CACHE[id]) return SET_CACHE[id];

    var pack = {
      keywords: toSet(dialect ? dialect.keywords : FALLBACK.keywords),
      types: toSet(dialect ? dialect.types : FALLBACK.types),
      functions: toSet(dialect ? dialect.functions : FALLBACK.functions)
    };

    SET_CACHE[id] = pack;
    return pack;
  }

  function resolveDialect(options) {
    var mod = getDialects();
    var wanted = options && options.dialect;

    if (mod && typeof mod.byId === 'function') {
      if (wanted) return mod.byId(String(wanted));
      if (typeof mod.detect === 'function') {
        try {
          return mod.byId(mod.detect(options && options.sql ? options.sql : ''));
        } catch (err) {
          return mod.byId('ansi');
        }
      }
      return mod.byId('ansi');
    }

    return {
      id: 'ansi',
      label: '标准 SQL',
      keywords: FALLBACK.keywords,
      types: FALLBACK.types,
      functions: FALLBACK.functions,
      operators: FALLBACK.operators,
      identifierChars: FALLBACK.identifierChars,
      quoteChar: FALLBACK.quoteChar,
      supportsHashComment: FALLBACK.supportsHashComment,
      supportsDollarQuote: FALLBACK.supportsDollarQuote
    };
  }

  /* ---------------- 定位 ---------------- */

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

  /* ---------------- 宽松词法分析 ---------------- */

  function isWordStart(ch) {
    if (!ch) return false;
    var code = ch.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) ||
      code === 95 || code === 64 || code === 35 || code === 36 || code >= 128;
  }

  function isWordPart(ch) {
    if (!ch) return false;
    var code = ch.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) ||
      (code >= 48 && code <= 57) || code === 95 || code === 36 || code === 35 || code >= 128;
  }

  function isDigit(ch) {
    return ch >= '0' && ch <= '9';
  }

  var MULTI = ['->>', '!~*', '#>>', '||/', '::', ':=', '=>', '<=', '>=', '<>', '!=', '||', '&&',
    '<<', '>>', '->', '#>', '@>', '<@', '!~', '~*', '**', '+=', '-=', '*=', '/=', '%='];

  /**
   * 宽松 tokenizer：遇到坏输入不抛异常，而是记一条诊断继续扫描。
   * token 类型与 sql-format.js 保持一致，另有 'bad' 表示无法识别的字符。
   */
  function lex(text, dialect, push) {
    var tokens = [];
    var index = 0;
    var length = text.length;

    var identChars = (dialect.identifierChars || '') + (dialect.quoteChar || '');
    var bracketIdent = dialect.quoteChar === '[' || dialect.quoteClose === ']' ||
      (dialect.identifierChars || '').indexOf('[') >= 0;
    var hashComment = dialect.supportsHashComment !== false;
    var dollarQuote = dialect.supportsDollarQuote !== false;
    var operators = MULTI.slice();

    if (dialect.operators) {
      String(dialect.operators).split(/\s+/).forEach(function (item) {
        if (item && operators.indexOf(item) < 0) operators.push(item);
      });
      operators.sort(function (a, b) { return b.length - a.length; });
    }

    function add(type, start, extra) {
      var token = {
        type: type,
        value: text.slice(start, index),
        start: start,
        end: index
      };

      if (extra) {
        for (var key in extra) {
          if (Object.prototype.hasOwnProperty.call(extra, key)) token[key] = extra[key];
        }
      }

      if (type === 'word') token.upper = token.value.toUpperCase();
      tokens.push(token);
      return token;
    }

    function readQuoted(quote, label) {
      var startIndex = index;
      index++;

      while (index < length) {
        var ch = text.charAt(index);

        if (ch === '\\' && quote === "'") {
          index += 2;
          continue;
        }

        if (ch === quote) {
          if (text.charAt(index + 1) === quote) {
            index += 2;
            continue;
          }
          index++;
          return text.slice(startIndex, index);
        }

        index++;
      }

      /* 未闭合：整体作为 token 返回，由调用方记诊断 */
      index = length;
      add(quote === "'" ? 'string' : 'ident', startIndex, { unclosed: true });
      push({
        code: quote === "'" ? 'E_UNCLOSED_STRING' : 'E_UNCLOSED_IDENT',
        severity: 'error',
        message: label + '未闭合',
        start: startIndex,
        end: length,
        hint: '补上结束符号 ' + quote
      });
      return null;
    }

    while (index < length) {
      var ch = text.charAt(index);
      var start = index;

      /* 空白 */
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '\f' || ch === '\v') {
        index++;
        continue;
      }

      /* 行注释 -- */
      if (ch === '-' && text.charAt(index + 1) === '-') {
        var lineEnd = text.indexOf('\n', index);
        index = lineEnd < 0 ? length : lineEnd;
        add('comment', start, { kind: 'line' });
        continue;
      }

      /* 块注释 */
      if (ch === '/' && text.charAt(index + 1) === '*') {
        var close = text.indexOf('*/', index + 2);
        if (close < 0) {
          index = length;
          add('comment', start, { kind: 'block', unclosed: true });
          push({
            code: 'E_UNCLOSED_COMMENT',
            severity: 'error',
            message: '块注释未闭合',
            start: start,
            end: length,
            hint: '补上 */'
          });
          continue;
        }
        index = close + 2;
        add('comment', start, { kind: 'block' });
        continue;
      }

      /* MySQL # 注释（行首或后跟空白） */
      if (ch === '#' && hashComment) {
        var beforeOnLine = text.slice(text.lastIndexOf('\n', index - 1) + 1, index);
        var nextChar = text.charAt(index + 1);
        if (beforeOnLine.replace(/\s+$/, '') === '' || nextChar === '' || nextChar === ' ' || nextChar === '\t') {
          var hashEnd = text.indexOf('\n', index);
          index = hashEnd < 0 ? length : hashEnd;
          add('comment', start, { kind: 'line' });
          continue;
        }
      }

      /* 字符串 */
      if (ch === "'") {
        if (readQuoted("'", '字符串')) add('string', start, { quote: "'" });
        continue;
      }

      /* 引号标识符 */
      if (ch === '"' && identChars.indexOf('"') >= 0) {
        if (readQuoted('"', '引号标识符')) add('ident', start, { quote: '"' });
        continue;
      }

      if (ch === '`' && identChars.indexOf('`') >= 0) {
        if (readQuoted('`', '引号标识符')) add('ident', start, { quote: '`' });
        continue;
      }

      if (ch === '[' && bracketIdent) {
        var bracketStart = index;
        index++;
        var closed = false;

        while (index < length) {
          var bracketCh = text.charAt(index);
          if (bracketCh === ']') {
            if (text.charAt(index + 1) === ']') {
              index += 2;
              continue;
            }
            index++;
            closed = true;
            break;
          }
          index++;
        }

        if (!closed) {
          index = length;
          add('ident', bracketStart, { quote: '[', unclosed: true });
          push({
            code: 'E_UNCLOSED_IDENT',
            severity: 'error',
            message: '方括号标识符未闭合',
            start: bracketStart,
            end: length,
            hint: '补上 ]'
          });
          continue;
        }

        add('ident', bracketStart, { quote: '[' });
        continue;
      }

      /* 美元引用 / $1 参数 */
      if (ch === '$') {
        var dollar = dollarQuote ? /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(text.slice(index)) : null;

        if (dollar) {
          var delimiter = dollar[0];
          var closeAt = text.indexOf(delimiter, index + delimiter.length);
          if (closeAt < 0) {
            start = index;
            index = length;
            add('string', start, { unclosed: true });
            push({
              code: 'E_UNCLOSED_STRING',
              severity: 'error',
              message: '美元引用字符串未闭合',
              start: start,
              end: length,
              hint: '补上 ' + delimiter
            });
            continue;
          }
          index = closeAt + delimiter.length;
          add('string', start, { quote: '$' });
          continue;
        }

        var positional = /^\$\d+/.exec(text.slice(index));
        if (positional) {
          index += positional[0].length;
          add('param', start);
          continue;
        }
      }

      /* 数字 */
      if (isDigit(ch) || (ch === '.' && isDigit(text.charAt(index + 1)))) {
        var numberMatch = /^(?:0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/.exec(text.slice(index));
        if (numberMatch) {
          index += numberMatch[0].length;
          add('number', start);
          continue;
        }
      }

      /* 单词 */
      if (isWordStart(ch)) {
        var wordStart = index;
        while (index < length && isWordPart(text.charAt(index))) index++;
        var word = text.slice(wordStart, index);
        var upper = word.toUpperCase();

        /* E'..' / N'..' / X'..' / B'..' / Q'..' 前缀字符串 */
        if (/^(E|N|X|B|Q)$/.test(upper) && text.charAt(index) === "'") {
          var prefixedStart = wordStart;
          readQuoted("'", '字符串');
          add('string', prefixedStart, { quote: "'", prefixed: true });
          continue;
        }

        add('word', wordStart);
        continue;
      }

      /* 参数占位符 */
      if (ch === '?') {
        index++;
        add('param', start);
        continue;
      }

      if (ch === ':') {
        if (text.charAt(index + 1) === ':') {
          index += 2;
          add('punct', start);
          continue;
        }
        if (isWordStart(text.charAt(index + 1))) {
          index++;
          while (index < length && isWordPart(text.charAt(index))) index++;
          add('param', start);
          continue;
        }
      }

      if (ch === '@') {
        index++;
        if (text.charAt(index) === '@') index++;
        while (index < length && isWordPart(text.charAt(index))) index++;
        add('param', start);
        continue;
      }

      /* 多字符运算符 */
      var matchedOp = null;
      for (var m = 0; m < operators.length; m++) {
        if (text.substr(index, operators[m].length) === operators[m]) {
          matchedOp = operators[m];
          break;
        }
      }

      if (matchedOp) {
        index += matchedOp.length;
        add('punct', start);
        continue;
      }

      if ('()[],.;+-*/%=<>!|&^~:'.indexOf(ch) >= 0) {
        index++;
        add('punct', start);
        continue;
      }

      index++;
      add('bad', start);
      push({
        code: 'E_BAD_CHAR',
        severity: 'error',
        message: '无法识别的字符 “' + ch + '”',
        start: start,
        end: index,
        hint: '检查是否混入了全角符号或不可见字符'
      });
    }

    return tokens;
  }

  /* ---------------- 关键字集合 ---------------- */

  var CLAUSE_ORDER = {
    FROM: 1,
    WHERE: 2,
    'GROUP BY': 3,
    HAVING: 4,
    WINDOW: 5,
    'ORDER BY': 6,
    LIMIT: 7,
    OFFSET: 8,
    FETCH: 9
  };

  var CLAUSE_LABELS = {
    FROM: 'FROM',
    WHERE: 'WHERE',
    'GROUP BY': 'GROUP BY',
    HAVING: 'HAVING',
    'ORDER BY': 'ORDER BY',
    LIMIT: 'LIMIT',
    OFFSET: 'OFFSET',
    FETCH: 'FETCH'
  };

  /* 跨方言误用：这个关键字只在 allowed 里的方言有意义 */
  var DIALECT_TELLS = [
    { upper: 'TOP', allowed: ['sqlserver', 'ansi'], hint: 'Oracle / 达梦用 FETCH FIRST n ROWS ONLY，MySQL / PostgreSQL 用 LIMIT' },
    { upper: 'ROWNUM', allowed: ['oracle', 'dm', 'kingbase', 'opengauss'], hint: 'MySQL / PostgreSQL 用 LIMIT，SQL Server 用 TOP' },
    { upper: 'LIMIT', allowed: ['mysql', 'mariadb', 'tidb', 'oceanbase', 'postgresql', 'opengauss', 'kingbase', 'sqlite', 'hive', 'spark', 'clickhouse', 'ansi'], hint: 'Oracle / 达梦用 FETCH FIRST n ROWS ONLY，SQL Server 用 TOP' },
    { upper: 'ILIKE', allowed: ['postgresql', 'opengauss', 'kingbase', 'dm', 'hive', 'spark', 'clickhouse', 'ansi'], hint: 'MySQL 没有 ILIKE，请用 LIKE（或按排序规则忽略大小写）' },
    { upper: 'NVL', allowed: ['oracle', 'dm', 'kingbase', 'opengauss', 'hive', 'spark', 'db2', 'ansi'], hint: 'MySQL / PostgreSQL 用 IFNULL / COALESCE' },
    { upper: 'AUTO_INCREMENT', allowed: ['mysql', 'mariadb', 'tidb', 'oceanbase'], hint: 'PostgreSQL 用 GENERATED ALWAYS AS IDENTITY 或 SERIAL，SQL Server 用 IDENTITY' },
    { upper: 'AUTOINCREMENT', allowed: ['sqlite'], hint: 'SQLite 用 AUTOINCREMENT，其它数据库写法不同' },
    { upper: 'VARCHAR2', allowed: ['oracle', 'dm', 'kingbase', 'opengauss'], hint: '标准写法是 VARCHAR' },
    { upper: 'NVARCHAR2', allowed: ['oracle', 'dm'], hint: '标准写法是 NVARCHAR' },
    { upper: 'GO', allowed: ['sqlserver'], hint: 'GO 是 SQL Server 的批次分隔符，其它数据库用 ;' },
    { upper: 'PIVOT', allowed: ['sqlserver', 'oracle', 'dm', 'kingbase', 'opengauss'], hint: '该方言没有 PIVOT，考虑用 CASE WHEN 聚合' },
    { upper: 'UNPIVOT', allowed: ['sqlserver', 'oracle', 'dm', 'kingbase', 'opengauss'], hint: '该方言没有 UNPIVOT' },
    { upper: 'CONNECT', allowed: ['oracle', 'dm', 'kingbase', 'opengauss', 'db2'], hint: '层次查询 CONNECT BY 是 Oracle 系语法；MySQL 8 用 WITH RECURSIVE' },
    { upper: 'MERGE', allowed: ['oracle', 'dm', 'kingbase', 'opengauss', 'sqlserver', 'db2', 'postgresql', 'hive', 'spark', 'ansi'], hint: 'MySQL 的 MERGE 请改用 INSERT ... ON DUPLICATE KEY UPDATE，SQLite 用 INSERT OR REPLACE' },
    { upper: 'PREWHERE', allowed: ['clickhouse'], hint: 'PREWHERE 是 ClickHouse 独有的优化子句' }
  ];

  /* 这些关键字后面必须跟表达式或子句，直接遇上结束符就是写漏了 */
  var DANGLING_WORDS = toSet(
    'AND OR NOT WHERE FROM JOIN ON HAVING BY SET VALUES INTO SELECT AS IN LIKE BETWEEN IS'
  );

  /* ---------------- 主流程 ---------------- */

  function lint(sql, options) {
    options = options || {};

    var text = String(sql === null || sql === undefined ? '' : sql);
    var diagnostics = [];
    var stats = {
      statements: 0,
      keywords: 0,
      identifiers: 0,
      functions: 0,
      tables: 0,
      comments: 0,
      strings: 0,
      numbers: 0,
      lines: 0,
      unknownWords: []
    };

    if (!text.trim()) {
      return {
        dialectId: (resolveDialect(options) || {}).id || 'ansi',
        diagnostics: [],
        stats: stats,
        tokens: [],
        truncated: false
      };
    }

    var truncated = text.length > MAX_LENGTH;
    var source = truncated ? text.slice(0, MAX_LENGTH) : text;
    var dialect = resolveDialect({ dialect: options.dialect, sql: source });
    var limit = options.maxDiagnostics || MAX_DIAGNOSTICS;

    function push(diag) {
      if (diagnostics.length >= limit) return;

      var start = Math.max(0, Math.min(diag.start === undefined ? 0 : diag.start, text.length));
      var end = Math.max(start, Math.min(diag.end === undefined ? start + 1 : diag.end, text.length));
      var where = locate(source, start);

      diagnostics.push({
        severity: diag.severity || 'error',
        code: diag.code || 'E_UNKNOWN',
        message: diag.message || '',
        hint: diag.hint || '',
        line: where.line,
        column: where.column,
        start: start,
        end: end
      });
    }

    try {
      if (truncated) {
        push({
          severity: 'hint',
          code: 'H_TRUNCATED',
          message: '内容超过 ' + MAX_LENGTH + ' 字符，仅检查前面部分',
          start: 0,
          end: 1
        });
      }

      var tokens = lex(source, dialect, push);
      var sets = setsOf(dialect);

      checkStructure(source, tokens, dialect, sets, options, push, stats);
      checkTokens(tokens, dialect, sets, options, push, stats);
      checkStatements(tokens, push, stats);

      if (truncated) stats.truncated = true;
    } catch (error) {
      diagnostics.push({
        severity: 'error',
        code: 'E_INTERNAL',
        message: '语法检查内部出错：' + (error && error.message ? error.message : String(error)),
        hint: '这通常意味着输入里有极端的写法，请把这段 SQL 反馈出来',
        line: 1,
        column: 1,
        start: 0,
        end: Math.min(1, text.length)
      });
    }

    diagnostics.sort(function (a, b) {
      return a.start - b.start;
    });

    if (stats.unknownWords.length > 12) stats.unknownWords = stats.unknownWords.slice(0, 12);

    return {
      dialectId: (dialect && dialect.id) || 'ansi',
      dialectLabel: (dialect && dialect.label) || '',
      diagnostics: diagnostics,
      stats: stats,
      tokens: [],
      truncated: truncated
    };
  }

  /* ---------------- 结构检查 ---------------- */

  function isPunct(token, value) {
    return token && token.type === 'punct' && token.value === value;
  }

  function isWord(token, upper) {
    return token && token.type === 'word' && token.upper === upper;
  }

  /* 跳过注释，取下一个有意义的 token */
  function meaningful(tokens, from) {
    for (var i = from; i < tokens.length; i++) {
      if (tokens[i].type !== 'comment') return i;
    }
    return -1;
  }

  function previousMeaningful(tokens, from) {
    for (var i = from - 1; i >= 0; i--) {
      if (tokens[i].type !== 'comment') return i;
    }
    return -1;
  }

  function clauseAt(tokens, index) {
    var token = tokens[index];
    if (!token || token.type !== 'word') return null;

    if (token.upper === 'GROUP' || token.upper === 'ORDER') {
      var nextIndex = meaningful(tokens, index + 1);
      if (nextIndex >= 0 && isWord(tokens[nextIndex], 'BY')) {
        return { key: token.upper + ' BY', end: nextIndex };
      }
      return null;
    }

    if (CLAUSE_ORDER[token.upper]) return { key: token.upper, end: index };
    return null;
  }

  function checkStructure(source, tokens, dialect, sets, options, push, stats) {
    var parens = [];
    var caseDepth = 0;
    var lastClauseRank = 0;
    var lastClauseName = '';
    var lastClauseToken = null;
    var expectJoinCondition = null;
    var seenFrom = false;
    var selectIndex = -1;
    var selectClosed = false;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (token.type === 'comment') {
        stats.comments++;
        continue;
      }

      /* ---- 括号配对 ---- */
      if (isPunct(token, '(')) {
        parens.push(token);
        continue;
      }

      if (isPunct(token, ')')) {
        if (!parens.length) {
          push({
            code: 'E_UNBALANCED_PAREN',
            severity: 'error',
            message: '多了右括号 )',
            start: token.start,
            end: token.end,
            hint: '删除这个括号，或在前面补一个 ('
          });
          continue;
        }

        parens.pop();
        continue;
      }

      /* ---- 逗号位置 ---- */
      if (isPunct(token, ',')) {
        var nextIndex = meaningful(tokens, i + 1);
        var next = nextIndex >= 0 ? tokens[nextIndex] : null;

        if (!next) {
          push({
            code: 'E_TRAILING_COMMA',
            severity: 'error',
            message: '语句以逗号结尾',
            start: token.start,
            end: token.end,
            hint: '删掉最后的逗号'
          });
          continue;
        }

        if (isPunct(next, ')')) {
          push({
            code: 'E_TRAILING_COMMA',
            severity: 'error',
            message: '逗号后直接跟了 )',
            start: token.start,
            end: token.end,
            hint: '删掉这个多余的逗号'
          });
          continue;
        }

        if (next.type === 'word' && (CLAUSE_ORDER[next.upper] || next.upper === 'UNION' ||
          next.upper === 'EXCEPT' || next.upper === 'INTERSECT')) {
          push({
            code: 'E_TRAILING_COMMA',
            severity: 'error',
            message: '逗号后直接跟了子句 ' + next.upper,
            start: token.start,
            end: token.end,
            hint: '删掉逗号，或补上漏写的字段 / 表'
          });
          continue;
        }

        if (isPunct(next, ';')) {
          push({
            code: 'E_TRAILING_COMMA',
            severity: 'error',
            message: '语句以逗号接分号结尾',
            start: token.start,
            end: token.end,
            hint: '删掉最后的逗号'
          });
        }

        continue;
      }

      if (isPunct(token, ';')) {
        stats.statements++;

        if (seenFrom && selectClosed && expectJoinCondition) {
          /* 分句结束时仍未补上 ON，交给下面的 JOIN 检查 */
        }

        seenFrom = false;
        selectIndex = -1;
        selectClosed = false;
        lastClauseRank = 0;
        lastClauseName = '';
        caseDepth = 0;
        expectJoinCondition = null;
        continue;
      }

      if (token.type !== 'word') {
        if (token.type === 'string') stats.strings++;
        else if (token.type === 'number') stats.numbers++;
        continue;
      }

      /* ---- CASE ... END 配对 ---- */
      if (token.upper === 'CASE') {
        caseDepth++;
        continue;
      }

      if (token.upper === 'END') {
        if (caseDepth > 0) caseDepth--;
        else if (!inPlBlock(tokens, i)) {
          push({
            code: 'E_UNBALANCED_CASE',
            severity: 'warning',
            message: 'END 没有对应的 CASE',
            start: token.start,
            end: token.end,
            hint: '如果这是存储过程里的 BEGIN ... END，可以忽略这条'
          });
        }
        continue;
      }

      /* ---- SELECT / FROM / JOIN 结构 ---- */
      if (token.upper === 'SELECT') {
        selectIndex = i;
        selectClosed = false;
        seenFrom = false;
        lastClauseRank = 0;
        lastClauseName = '';
        continue;
      }

      if (token.upper === 'FROM') {
        seenFrom = true;
        lastClauseRank = CLAUSE_ORDER.FROM;
        lastClauseName = 'FROM';
        lastClauseToken = token;

        /* FROM 后面紧跟子句说明表名漏了 */
        var afterFrom = meaningful(tokens, i + 1);
        if (afterFrom >= 0) {
          var afterFromToken = tokens[afterFrom];
          if (afterFromToken.type === 'word' && CLAUSE_ORDER[afterFromToken.upper]) {
            push({
              code: 'E_MISSING_TABLE',
              severity: 'error',
              message: 'FROM 后面缺少表名',
              start: token.start,
              end: token.end,
              hint: '在 FROM 后面补上表名或子查询'
            });
          }
        }
        continue;
      }

      /* ---- JOIN 必须带 ON / USING ---- */
      if (token.upper === 'JOIN') {
        var prevIndex = previousMeaningful(tokens, i);
        var prev = prevIndex >= 0 ? tokens[prevIndex] : null;
        var isNatural = prev && prev.type === 'word' && prev.upper === 'NATURAL';
        var isCross = prev && prev.type === 'word' && (prev.upper === 'CROSS');

        if (!isNatural && !isCross) expectJoinCondition = token;
        else expectJoinCondition = null;

        continue;
      }

      if (token.upper === 'ON' || token.upper === 'USING') {
        /* 子句里的 ON 用于 ON CONFLICT / ON DUPLICATE KEY */
        var nextOnIndex = meaningful(tokens, i + 1);
        var nextOn = nextOnIndex >= 0 ? tokens[nextOnIndex] : null;

        if (nextOn && nextOn.type === 'word' &&
          (nextOn.upper === 'CONFLICT' || nextOn.upper === 'DUPLICATE')) {
          continue;
        }

        if (!expectJoinCondition && !seenFrom) {
          push({
            code: 'E_ON_WITHOUT_JOIN',
            severity: 'warning',
            message: 'ON 前面没有 JOIN',
            start: token.start,
            end: token.end,
            hint: 'ON 只能跟在 JOIN 后面'
          });
        }

        expectJoinCondition = null;
        continue;
      }

      /* ---- 悬空的关键字（必须先于子句处理，否则 WHERE 这类词轮不到） ---- */
      if (DANGLING_WORDS[token.upper]) {
        var afterIndex = meaningful(tokens, i + 1);
        var after = afterIndex >= 0 ? tokens[afterIndex] : null;

        if (!after || isPunct(after, ';') || isPunct(after, ')')) {
          push({
            code: 'E_DANGLING_KEYWORD',
            severity: 'error',
            message: token.upper + ' 后面缺少内容',
            start: token.start,
            end: token.end,
            hint: '补上 ' + token.upper + ' 后面的表达式或条件'
          });
        }
      }

      /* ---- 子句顺序 ---- */
      var clause = clauseAt(tokens, i);

      if (clause) {
        var rank = CLAUSE_ORDER[clause.key];

        if (rank && lastClauseRank && rank < lastClauseRank) {
          push({
            code: 'E_CLAUSE_ORDER',
            severity: 'error',
            message: clause.key + ' 出现在了 ' + lastClauseName + ' 之后',
            start: token.start,
            end: tokens[clause.end] ? tokens[clause.end].end : token.end,
            hint: '子句顺序应为 FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT'
          });
        }

        if (rank) {
          lastClauseRank = rank;
          lastClauseName = clause.key;
          lastClauseToken = token;
        }

        if (clause.key === 'GROUP BY' || clause.key === 'ORDER BY') i = clause.end;
        continue;
      }

      /* ---- 连续两个逻辑运算符 ---- */
      if (token.type === 'word' && (token.upper === 'AND' || token.upper === 'OR')) {
        var prevWordIndex = previousMeaningful(tokens, i);
        var prevWord = prevWordIndex >= 0 ? tokens[prevWordIndex] : null;

        if (prevWord && (isPunct(prevWord, '(') || isWord(prevWord, 'AND') || isWord(prevWord, 'OR') ||
          isWord(prevWord, 'WHERE') || isWord(prevWord, 'ON') || isWord(prevWord, 'BY'))) {
          /* WHERE AND ... 这种是明显的漏写条件 */
          if (!isPunct(prevWord, '(')) {
            push({
              code: 'E_DANGLING_KEYWORD',
              severity: 'error',
              message: prevWord.upper + ' 与 ' + token.upper + ' 之间缺少条件',
              start: token.start,
              end: token.end,
              hint: '补上中间缺失的条件表达式'
            });
          }
        }
      }
    }

    /* 收尾：未闭合的括号 */
    for (var p = parens.length - 1; p >= 0; p--) {
      push({
        code: 'E_UNBALANCED_PAREN',
        severity: 'error',
        message: '缺少右括号 )',
        start: parens[p].start,
        end: parens[p].end,
        hint: '在这里对应的位置补一个 )'
      });
    }

    if (caseDepth > 0) {
      push({
        code: 'E_UNBALANCED_CASE',
        severity: 'error',
        message: '有 ' + caseDepth + ' 个 CASE 没有配对的 END',
        start: source.length,
        end: source.length,
        hint: '为每个 CASE 补上 END'
      });
    }

    if (stats.statements === 0 && tokens.length) {
      stats.statements = 1;
    }
  }

  /* BEGIN ... END 块里的 END 不算悬空 */
  function inPlBlock(tokens, index) {
    for (var i = index - 1; i >= 0; i--) {
      var token = tokens[i];
      if (token.type !== 'word') continue;
      if (token.upper === 'BEGIN') return true;
      if (token.upper === 'CASE') return false;
      if (token.upper === 'SELECT') return false;
    }
    return false;
  }

  /* ---------------- token 级检查 ---------------- */

  function checkTokens(tokens, dialect, sets, options, push, stats) {
    var seen = Object.create(null);
    var unknown = Object.create(null);
    var tells = Object.create(null);
    var dialectId = dialect.id || 'ansi';

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (token.type === 'string') {
        stats.strings++;
        continue;
      }

      if (token.type === 'number') {
        stats.numbers++;
        continue;
      }

      if (token.type === 'comment') continue;
      if (token.type !== 'word') continue;

      var upper = token.upper;
      var isKeyword = !!sets.keywords[upper];
      var isType = !!sets.types[upper];
      var isFunction = !!sets.functions[upper];

      if (isKeyword) stats.keywords++;
      else if (isType) stats.keywords++;
      else if (isFunction) stats.functions++;

      /* 后面紧跟 ( 的单词按函数算 */
      var nextIndex = meaningful(tokens, i + 1);
      var next = nextIndex >= 0 ? tokens[nextIndex] : null;
      if (!isKeyword && !isType && !isFunction && next && isPunct(next, '(')) {
        isFunction = true;
        stats.functions++;
      }

      if (!isKeyword && !isType && !isFunction) {
        stats.identifiers++;
        if (!unknown[upper]) {
          unknown[upper] = true;
          if (stats.unknownWords.length < 40) stats.unknownWords.push(token.value);
        }
      }

      /* ---- 跨方言误用 ---- */
      if (!tells[upper]) {
        tells[upper] = true;

        for (var t = 0; t < DIALECT_TELLS.length; t++) {
          var tell = DIALECT_TELLS[t];
          if (tell.upper !== upper) continue;
          if (tell.allowed.indexOf(dialectId) >= 0) break;

          push({
            code: 'H_DIALECT_KEYWORD',
            severity: 'hint',
            message: upper + ' 不是 ' + (dialect.label || dialectId) + ' 的常见写法',
            start: token.start,
            end: token.end,
            hint: tell.hint
          });
          break;
        }
      }

      /* ---- 保留字直接当列名 ---- */
      if (isKeyword && seen[upper] !== 'reported') {
        var prevIndex = previousMeaningful(tokens, i - 1);
        var prevToken = prevIndex >= 0 ? tokens[prevIndex] : null;
        var inSelectList = prevToken && (isPunct(prevToken, ',') || isWord(prevToken, 'SELECT'));

        if (inSelectList && (next === null || isPunct(next, ',') || isPunct(next, ';') ||
          isWord(next, 'FROM') || isWord(next, 'AS'))) {
          seen[upper] = 'reported';
          push({
            code: 'W_RESERVED_WORD_IDENT',
            severity: 'warning',
            message: '关键字 ' + upper + ' 被当成列名使用',
            start: token.start,
            end: token.end,
            hint: '用引号包起来，或给该列起个别名'
          });
        }
      }

      /* ---- 类型参数合理性 ---- */
      if (isType && next && isPunct(next, '(')) {
        checkTypeArgs(tokens, nextIndex, token, push);
      }
    }

    /* stats.unknownWords 只作为统计展示，不产生诊断，避免满屏「未知词」 */
  }

  function checkTypeArgs(tokens, openIndex, typeToken, push) {
    var args = [];
    var depth = 0;

    for (var i = openIndex; i < tokens.length; i++) {
      var token = tokens[i];

      if (isPunct(token, '(')) {
        depth++;
        continue;
      }

      if (isPunct(token, ')')) {
        depth--;
        if (depth === 0) break;
        continue;
      }

      if (isPunct(token, ',')) {
        args.push(null);
        continue;
      }

      if (depth === 1 && token.type === 'number') {
        if (!args.length) args.push(token.value);
        else args[args.length - 1] = token.value;
      } else if (depth === 1 && token.type === 'word') {
        push({
          code: 'W_TYPE_ARG',
          severity: 'warning',
          message: typeToken.upper + ' 的长度参数应为数字',
          start: token.start,
          end: token.end,
          hint: '例如 VARCHAR(64)、NUMBER(10,2)'
        });
      }
    }

    var numeric = args.filter(function (item) { return item !== null && item !== undefined; });

    if (!numeric.length) return;

    var first = Number(numeric[0]);

    if (first <= 0 || first > 65535) {
      push({
        code: 'W_TYPE_ARG',
        severity: 'warning',
        message: typeToken.upper + '(' + numeric.join(',') + ') 的长度看起来不合理',
        start: typeToken.start,
        end: typeToken.end,
        hint: '常见长度在 1 到 65535 之间'
      });
    }
  }

  /* ---------------- 语句级检查 ---------------- */

  function checkStatements(tokens, push, stats) {
    var start = 0;

    for (var i = 0; i <= tokens.length; i++) {
      var token = tokens[i];
      var isEnd = !token || isPunct(token, ';');

      if (!isEnd) continue;

      var slice = tokens.slice(start, i);
      start = i + 1;
      if (!slice.length) continue;

      checkOneStatement(slice, push);
    }
  }

  function checkOneStatement(tokens, push) {
    var first = null;

    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'comment') {
        first = tokens[i];
        break;
      }
    }

    if (!first || first.type !== 'word') return;

    /* ---- UPDATE / DELETE 没有 WHERE ---- */
    if (first.upper === 'UPDATE' || first.upper === 'DELETE') {
      var hasWhere = tokens.some(function (token) {
        return token.type === 'word' && token.upper === 'WHERE';
      });

      var hasLimit = tokens.some(function (token) {
        return token.type === 'word' && (token.upper === 'LIMIT' || token.upper === 'TOP');
      });

      if (!hasWhere && !hasLimit) {
        push({
          code: 'W_NO_WHERE',
          severity: 'warning',
          message: first.upper + ' 语句没有 WHERE 条件',
          start: first.start,
          end: first.end,
          hint: first.upper === 'DELETE' ? '会删除整张表的数据，确认无误再执行' : '会更新整张表的数据，确认无误再执行'
        });
      }
    }

    /* ---- SELECT 概览 ---- */
    if (first.upper === 'SELECT' || first.upper === 'WITH') {
      var hasFrom = tokens.some(function (token) {
        return token.type === 'word' && token.upper === 'FROM';
      });

      /* 只有在投影位置裸写的 * 才提示，count(*) / a * b 都不算 */
      var hasStar = false;

      for (var s = 0; s < tokens.length; s++) {
        if (!isPunct(tokens[s], '*')) continue;

        var beforeStar = s > 0 ? tokens[s - 1] : null;
        var beforeParen = beforeStar && isPunct(beforeStar, '(');
        if (beforeParen) continue;

        if (beforeStar && (isWord(beforeStar, 'SELECT') || isPunct(beforeStar, ','))) {
          hasStar = true;
          break;
        }
      }

      if (hasStar && hasFrom) {
        push({
          code: 'H_SELECT_STAR',
          severity: 'hint',
          message: '建议显式列出需要的字段，而不是 SELECT *',
          start: first.start,
          end: first.end,
          hint: '避免表结构变化影响结果，也能用上覆盖索引'
        });
      }

      if (!hasFrom) checkSelectWithoutFrom(tokens, first, push);
    }

    /* ---- INSERT 缺少数据来源 ---- */
    if (first.upper === 'INSERT') {
      var hasSource = tokens.some(function (token) {
        return token.type === 'word' &&
          (token.upper === 'VALUES' || token.upper === 'SELECT' || token.upper === 'SET' ||
            token.upper === 'DEFAULT' || token.upper === 'VALUE');
      });

      if (!hasSource) {
        push({
          code: 'E_MISSING_VALUES',
          severity: 'error',
          message: 'INSERT 缺少 VALUES 或 SELECT',
          start: first.start,
          end: first.end,
          hint: '补上 VALUES (...) 或 INSERT ... SELECT'
        });
      }
    }

    /* ---- JOIN ... ON 是否漏了连接条件 ---- */
    for (var j = 0; j < tokens.length; j++) {
      var token = tokens[j];

      if (token.type !== 'word' || token.upper !== 'JOIN') continue;

      var hasCondition = false;

      for (var k = j + 1; k < tokens.length; k++) {
        var after = tokens[k];
        if (after.type !== 'word') continue;
        if (after.upper === 'ON' || after.upper === 'USING') {
          hasCondition = true;
          break;
        }
        if (after.upper === 'JOIN') break;
      }

      var prev = j > 0 ? tokens[j - 1] : null;
      var exempt = prev && prev.type === 'word' && (prev.upper === 'CROSS' || prev.upper === 'NATURAL');

      if (!hasCondition && !exempt) {
        push({
          code: 'E_JOIN_NO_ON',
          severity: 'warning',
          message: 'JOIN 后面缺少 ON / USING',
          start: token.start,
          end: token.end,
          hint: '补上连接条件，或改用 CROSS JOIN'
        });
      }
    }
  }

  function checkSelectWithoutFrom(tokens, first, push) {
    /* SELECT 1、SELECT NOW()、SELECT 'x' 都是合法的，只有裸列名才可疑 */
    var sawBareColumn = false;

    for (var i = 1; i < tokens.length; i++) {
      var token = tokens[i];
      if (token.type === 'comment') continue;

      if (token.type === 'word') {
        var nextIndex = meaningful(tokens, i + 1);
        var next = nextIndex >= 0 ? tokens[nextIndex] : null;

        /* 别名、AS、类型转换这类词不算列引用 */
        if (next && isWord(next, 'AS')) continue;

        if (!next || isPunct(next, ',') || next.type === 'word') {
          sawBareColumn = true;
          break;
        }
      }
    }

    if (sawBareColumn) {
      push({
        code: 'E_SELECT_NO_FROM',
        severity: 'warning',
        message: 'SELECT 引用了列但没有 FROM 子句',
        start: first.start,
        end: first.end,
        hint: '补上 FROM 表名；如果只是想算常量，可以忽略这条'
      });
    }
  }

  /* ---------------- 汇总 ---------------- */

  function summary(result) {
    var list = (result && result.diagnostics) || [];
    var errors = 0;
    var warnings = 0;
    var hints = 0;

    list.forEach(function (item) {
      if (item.severity === 'error') errors++;
      else if (item.severity === 'warning') warnings++;
      else hints++;
    });

    var parts = [];
    if (errors) parts.push(errors + ' 个错误');
    if (warnings) parts.push(warnings + ' 个警告');
    if (hints) parts.push(hints + ' 条提示');

    return {
      errors: errors,
      warnings: warnings,
      hints: hints,
      ok: errors === 0 && warnings === 0,
      text: parts.length ? parts.join(' · ') : '未发现问题'
    };
  }

  return {
    lint: lint,
    summary: summary,
    LABELS: LABELS,
    MAX_LENGTH: MAX_LENGTH
  };
});
