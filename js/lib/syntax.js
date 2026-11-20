/* =========================================================
 * 开发工具箱 — 多语言语法着色
 * 纯正则粘性扫描（sticky flag），不依赖任何第三方库。
 * 输出已转义的 HTML，可直接赋值给 innerHTML。
 * ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Syntax = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* 超过这个长度不再着色，避免长文本着色卡顿 */
  var MAX_LENGTH = 180000;

  var LANGUAGES = [
    { id: 'text', label: '纯文本' },
    { id: 'sql', label: 'SQL' },
    { id: 'json', label: 'JSON' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'java', label: 'Java' },
    { id: 'python', label: 'Python' },
    { id: 'xml', label: 'XML / HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'markdown', label: 'Markdown' },
    { id: 'shell', label: 'Shell / 命令' },
    { id: 'properties', label: 'Properties / YAML' }
  ];

  function escapeHtml(text) {
    return String(text === null || text === undefined ? '' : text).replace(/[&<>]/g, function (ch) {
      if (ch === '&') return '&amp;';
      if (ch === '<') return '&lt;';
      return '&gt;';
    });
  }

  function toSet(text) {
    var map = Object.create(null);
    String(text).split(/\s+/).forEach(function (word) {
      if (word) map[word] = true;
    });
    return map;
  }

  /* ---------------- SQL ---------------- */

  var SQL_KEYWORDS = toSet(
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
    'UNSIGNED ZEROFILL CHARSET CHARACTER VARYING ENGINE COMMENT AUTO_INCREMENT ' +
    'TRUE FALSE UNKNOWN ' +
    'ON CONFLICT DO NOTHING LOCK SHARE MODE'
  );

  var SQL_TYPES = toSet(
    'INT INTEGER BIGINT SMALLINT TINYINT DECIMAL NUMERIC FLOAT DOUBLE REAL BOOLEAN BOOL ' +
    'DATE TIME TIMESTAMP DATETIME INTERVAL YEAR MONTH DAY HOUR MINUTE SECOND ' +
    'ARRAY JSON JSONB UUID SERIAL BIGSERIAL BLOB CLOB TEXT VARCHAR CHAR NVARCHAR NCHAR ' +
    'NUMBER BINARY VARBINARY BIT MONEY SMALLMONEY XML GEOMETRY'
  );

  var SQL_FUNCTIONS = toSet(
    'COUNT SUM AVG MIN MAX COALESCE NULLIF GREATEST LEAST NOW CURRENT_DATE CURRENT_TIME CURRENT_TIMESTAMP ' +
    'LENGTH SUBSTRING SUBSTR TRIM LTRIM RTRIM UPPER LOWER ROUND ABS CEIL FLOOR MOD POWER CONCAT GROUP_CONCAT ' +
    'ROW_NUMBER RANK DENSE_RANK LAG LEAD FIRST_VALUE LAST_VALUE NTILE STRING_AGG JSON_EXTRACT JSON_OBJECT ' +
    'EXTRACT POSITION OVERLAY IFNULL ISNULL DATE_FORMAT STR_TO_DATE UNIX_TIMESTAMP FROM_UNIXTIME ' +
    'TO_CHAR TO_DATE TO_TIMESTAMP NVL DECODE LISTAGG WM_CONCAT'
  );

  /* ---------------- 方言词表 ---------------- */

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

  var SQL_SET_CACHE = Object.create(null);

  /**
   * 取某个 SQL 方言的词表。传不进方言时用内置的通用表，
   * 这样即使没加载 sql-dialects.js，着色也不会失灵。
   */
  function sqlSetsFor(dialectId) {
    var id = String(dialectId || 'ansi');
    if (SQL_SET_CACHE[id]) return SQL_SET_CACHE[id];

    var mod = getDialects();
    var pack = null;

    if (mod && typeof mod.byId === 'function') {
      var dialect = mod.byId(id);
      if (dialect) {
        pack = {
          keywords: toSet(dialect.keywords),
          types: toSet(dialect.types),
          functions: toSet(dialect.functions)
        };
      }
    }

    if (!pack) {
      pack = { keywords: SQL_KEYWORDS, types: SQL_TYPES, functions: SQL_FUNCTIONS };
    }

    SQL_SET_CACHE[id] = pack;
    return pack;
  }

  function sqlWordClass(word, ctx) {
    var upper = word.toUpperCase();
    var sets = (ctx && ctx.sets) || SQL_KEYWORDS_ALL;

    if (sets.keywords[upper]) return 'syn-kw';
    if (sets.types[upper]) return 'syn-type';
    if (sets.functions[upper]) return 'syn-fn';
    if (ctx && /^\s*\(/.test(ctx.code.slice(ctx.end, ctx.end + 8))) return 'syn-fn';
    return 'syn-ident';
  }

  var SQL_KEYWORDS_ALL = {
    keywords: SQL_KEYWORDS,
    types: SQL_TYPES,
    functions: SQL_FUNCTIONS
  };

  var SQL_RULES = [
    { re: /--[^\n]*/, cls: 'syn-com' },
    { re: /\/\*[\s\S]*?(?:\*\/|$)/, cls: 'syn-com' },
    { re: /'(?:''|\\[\s\S]|[^'\\])*'?/, cls: 'syn-str' },
    { re: /"(?:""|[^"])*"?/, cls: 'syn-quote' },
    { re: /`(?:``|[^`])*`?/, cls: 'syn-quote' },
    { re: /\$\d+/, cls: 'syn-var' },
    { re: /@[A-Za-z_][\w$]*/, cls: 'syn-var' },
    { re: /:[A-Za-z_]\w*/, cls: 'syn-var' },
    { re: /0[xX][0-9a-fA-F]+/, cls: 'syn-num' },
    { re: /\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, cls: 'syn-num' },
    { re: /[A-Za-z_][A-Za-z0-9_$]*/, cls: sqlWordClass },
    { re: /[(),.;\[\]{}]/, cls: 'syn-punct' },
    { re: /->>|::|:=|=>|<=|>=|<>|!=|\|\||&&|<<|>>|[-+*/%=<>!|&^~?:]/, cls: 'syn-op' },
    { re: /\s+/, cls: null }
  ];

  /* ---------------- JSON ---------------- */

  var JSON_RULES = [
    { re: /"(?:\\.|[^"\\])*"(?=\s*:)/, cls: 'syn-key' },
    { re: /"(?:\\.|[^"\\])*"/, cls: 'syn-str' },
    { re: /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, cls: 'syn-num' },
    { re: /\b(?:true|false)\b/, cls: 'syn-bool' },
    { re: /\bnull\b/, cls: 'syn-null' },
    { re: /[{}[\],:]/, cls: 'syn-punct' },
    { re: /\s+/, cls: null }
  ];

  /* ---------------- JavaScript ---------------- */

  var JS_KEYWORDS = toSet(
    'break case catch class const continue debugger default delete do else export extends finally for ' +
    'function if import in instanceof let new return super switch this throw try typeof var void while with ' +
    'yield async await of get set static from as'
  );

  var JS_LITERALS = toSet('true false null undefined NaN Infinity this');

  function jsWordClass(word) {
    if (JS_KEYWORDS[word]) return 'syn-kw';
    if (JS_LITERALS[word]) return 'syn-bool';
    return 'syn-ident';
  }

  var JS_RULES = [
    { re: /\/\/[^\n]*/, cls: 'syn-com' },
    { re: /\/\*[\s\S]*?(?:\*\/|$)/, cls: 'syn-com' },
    { re: /`(?:\\[\s\S]|[^`\\])*`?/, cls: 'syn-str' },
    { re: /'(?:\\[\s\S]|[^'\\\n])*'?/, cls: 'syn-str' },
    { re: /"(?:\\[\s\S]|[^"\\\n])*"?/, cls: 'syn-str' },
    { re: /0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, cls: 'syn-num' },
    { re: /[A-Za-z_$][\w$]*/, cls: jsWordClass },
    { re: /[{}()[\];,.]/, cls: 'syn-punct' },
    { re: /=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|\?\?=|\*\*|[-+*/%=<>!&|^~?:]/, cls: 'syn-op' },
    { re: /\s+/, cls: null }
  ];

  /* ---------------- Java ---------------- */

  var JAVA_KEYWORDS = toSet(
    'abstract assert break case catch class const continue default do else enum extends final finally for ' +
    'goto if implements import instanceof interface native new package private protected public return ' +
    'static strictfp super switch synchronized this throw throws transient try volatile while var record sealed ' +
    'permits yield'
  );

  var JAVA_LITERALS = toSet('true false null');

  function javaWordClass(word) {
    if (JAVA_KEYWORDS[word]) return 'syn-kw';
    if (JAVA_LITERALS[word]) return 'syn-bool';
    if (/^[A-Z][A-Za-z0-9_]*$/.test(word)) return 'syn-type';
    return 'syn-ident';
  }

  var JAVA_RULES = [
    { re: /\/\/[^\n]*/, cls: 'syn-com' },
    { re: /\/\*[\s\S]*?(?:\*\/|$)/, cls: 'syn-com' },
    { re: /"(?:\\[\s\S]|[^"\\\n])*"?/, cls: 'syn-str' },
    { re: /'(?:\\[\s\S]|[^'\\\n])*'?/, cls: 'syn-str' },
    { re: /@[A-Za-z_]\w*/, cls: 'syn-meta' },
    { re: /0[xX][0-9a-fA-F]+[lL]?|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[fFdDlL]?/, cls: 'syn-num' },
    { re: /[A-Za-z_$][\w$]*/, cls: javaWordClass },
    { re: /[{}()[\];,.]/, cls: 'syn-punct' },
    { re: /->|::|==|!=|<=|>=|&&|\|\||[-+*/%=<>!&|^~?:]/, cls: 'syn-op' },
    { re: /\s+/, cls: null }
  ];

  /* ---------------- Python ---------------- */

  var PY_KEYWORDS = toSet(
    'and as assert async await break class continue def del elif else except finally for from global if ' +
    'import in is lambda nonlocal not or pass raise return try while with yield match case'
  );

  var PY_BUILTINS = toSet(
    'print len range str int float bool list dict set tuple open enumerate zip map filter sorted sum min max ' +
    'abs round type isinstance super self cls'
  );

  function pyWordClass(word) {
    if (PY_KEYWORDS[word]) return 'syn-kw';
    if (PY_BUILTINS[word]) return 'syn-fn';
    if (word === 'True' || word === 'False' || word === 'None') return 'syn-bool';
    return 'syn-ident';
  }

  var PY_RULES = [
    { re: /#[^\n]*/, cls: 'syn-com' },
    { re: /[rRbBuUfF]{0,2}"""[\s\S]*?(?:"""|$)/, cls: 'syn-str' },
    { re: /[rRbBuUfF]{0,2}'''[\s\S]*?(?:'''|$)/, cls: 'syn-str' },
    { re: /[rRbBuUfF]{0,2}"(?:\\[\s\S]|[^"\\\n])*"?/, cls: 'syn-str' },
    { re: /[rRbBuUfF]{0,2}'(?:\\[\s\S]|[^'\\\n])*'?/, cls: 'syn-str' },
    { re: /@[A-Za-z_]\w*/, cls: 'syn-meta' },
    { re: /0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[jJ]?/, cls: 'syn-num' },
    { re: /[A-Za-z_]\w*/, cls: pyWordClass },
    { re: /[{}()[\];,.]/, cls: 'syn-punct' },
    { re: /==|!=|<=|>=|\*\*|\/\/|:=|[-+*/%=<>!&|^~]/, cls: 'syn-op' },
    { re: /\s+/, cls: null }
  ];

  /* ---------------- XML / HTML ---------------- */

  var XML_RULES = [
    { re: /<!--[\s\S]*?(?:-->|$)/, cls: 'syn-com' },
    { re: /<!\[CDATA\[[\s\S]*?(?:\]\]>|$)/, cls: 'syn-code' },
    { re: /<!DOCTYPE[^>]*>?/i, cls: 'syn-meta' },
    { re: /<\?[\s\S]*?(?:\?>|$)/, cls: 'syn-meta' },
    { re: /<\/?[A-Za-z][\w:.-]*/, cls: 'syn-tag' },
    { re: /[A-Za-z_:][\w:.-]*(?=\s*=)/, cls: 'syn-attr' },
    { re: /"(?:[^"<])*"?|'(?:[^'<])*'?/, cls: 'syn-str' },
    { re: /\/?>/, cls: 'syn-tag' },
    { re: /&#?\w+;/, cls: 'syn-var' },
    { re: /\s+/, cls: null }
  ];

  /* ---------------- CSS ---------------- */

  var CSS_RULES = [
    { re: /\/\*[\s\S]*?(?:\*\/|$)/, cls: 'syn-com' },
    { re: /@[A-Za-z-]+/, cls: 'syn-kw' },
    { re: /"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?/, cls: 'syn-str' },
    { re: /#[0-9a-fA-F]{3,8}\b/, cls: 'syn-num' },
    { re: /[A-Za-z-]+(?=\s*:)/, cls: 'syn-key' },
    { re: /-?\d+(?:\.\d+)?(?:px|em|rem|vh|vw|vmin|vmax|%|s|ms|deg|fr|ch|ex|pt|cm|mm|in|dpi)?/, cls: 'syn-num' },
    { re: /[{}();:,]/, cls: 'syn-punct' },
    { re: /[A-Za-z_-]+/, cls: 'syn-ident' },
    { re: /\s+/, cls: null }
  ];

  /* ---------------- Markdown ---------------- */

  var MD_RULES = [
    { re: /^```[\s\S]*?(?:```|$)/m, cls: 'syn-code' },
    { re: /^#{1,6}[^\n]*/m, cls: 'syn-head' },
    { re: /^[ \t]*>[^\n]*/m, cls: 'syn-quote' },
    { re: /^\s*(?:[-*+]|\d+\.)\s/m, cls: 'syn-kw' },
    { re: /\*\*(?:[^*\n]|\*(?!\*))+\*\*/, cls: 'syn-bold' },
    { re: /__(?:[^_\n]|_(?!_))+__/, cls: 'syn-bold' },
    { re: /\*(?:[^*\n])+\*/, cls: 'syn-em' },
    { re: /`[^`\n]+`/, cls: 'syn-code' },
    { re: /!?\[[^\]\n]*\]\([^)\n]*\)/, cls: 'syn-link' },
    { re: /(?:https?:\/\/|mailto:)[^\s)]+/, cls: 'syn-link' },
    { re: /\s+/, cls: null }
  ];

  /* ---------------- Shell ---------------- */

  var SH_KEYWORDS = toSet(
    'if then else elif fi for while do done case esac function return exit export local readonly declare ' +
    'set unset shift source alias eval exec trap'
  );

  function shWordClass(word) {
    if (SH_KEYWORDS[word]) return 'syn-kw';
    return 'syn-ident';
  }

  var SH_RULES = [
    { re: /#[^\n]*/, cls: 'syn-com' },
    { re: /"(?:\\[\s\S]|[^"\\])*"?|'[^']*'?/, cls: 'syn-str' },
    { re: /\$\{[^}]*\}|\$[A-Za-z_]\w*|\$[0-9@*#?$!]/, cls: 'syn-var' },
    { re: /\b\d+\b/, cls: 'syn-num' },
    { re: /[A-Za-z_][\w-]*/, cls: shWordClass },
    { re: /\|\||&&|[|&;<>()]/, cls: 'syn-op' },
    { re: /\s+/, cls: null }
  ];

  /* ---------------- Properties / YAML ---------------- */

  var PROP_RULES = [
    { re: /(?:^|\n)[ \t]*#[^\n]*/, cls: 'syn-com' },
    { re: /^[ \t-]*[A-Za-z_][\w.-]*(?=\s*[:=])/m, cls: 'syn-key' },
    { re: /"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?/, cls: 'syn-str' },
    { re: /\b(?:true|false|yes|no|on|off|null|~)\b/i, cls: 'syn-bool' },
    { re: /\b\d+(?:\.\d+)?\b/, cls: 'syn-num' },
    { re: /[-:=[\]{},]/, cls: 'syn-punct' },
    { re: /[A-Za-z_][\w.-]*/, cls: 'syn-ident' },
    { re: /\s+/, cls: null }
  ];

  var RULE_MAP = {
    sql: SQL_RULES,
    json: JSON_RULES,
    javascript: JS_RULES,
    java: JAVA_RULES,
    python: PY_RULES,
    xml: XML_RULES,
    css: CSS_RULES,
    markdown: MD_RULES,
    shell: SH_RULES,
    properties: PROP_RULES
  };

  var KEYWORD_MAP = {
    text: null,
    sql: SQL_KEYWORDS
  };

  var INSTANCES = Object.create(null);

  function compile(rules) {
    return rules.map(function (rule) {
      var flags = 'y';
      var source = rule.re.source;
      var rawFlags = rule.re.flags || '';
      if (rawFlags.indexOf('i') >= 0) flags += 'i';
      if (rawFlags.indexOf('m') >= 0) flags += 'm';
      if (rawFlags.indexOf('s') >= 0) flags += 's';
      return { re: new RegExp(source, flags), cls: rule.cls };
    });
  }

  function rulesFor(language) {
    if (!INSTANCES[language]) {
      var sets = RULE_MAP[language];
      INSTANCES[language] = sets ? compile(sets) : null;
    }
    return INSTANCES[language];
  }

  /**
   * 把源码着色为 HTML。
   * @param {string} language 语言 id，未知语言按纯文本处理
   * @param {string} code
   * @param {{dialect?: string}} [options] SQL 方言 id（其它语言忽略）
   * @returns {string} 已转义的 HTML
   */
  function highlight(language, code, options) {
    var text = String(code === null || code === undefined ? '' : code);
    var name = String(language || 'text');
    var rules = rulesFor(name);

    if (!rules || !text) return escapeHtml(text);
    if (text.length > MAX_LENGTH) return escapeHtml(text);

    var context = {
      code: text,
      sets: name === 'sql' ? sqlSetsFor(options && options.dialect) : SQL_KEYWORDS_ALL
    };

    var out = '';
    var index = 0;
    var length = text.length;

    while (index < length) {
      var matched = false;

      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        rule.re.lastIndex = index;
        var match = rule.re.exec(text);

        if (!match || !match[0]) continue;

        var value = match[0];
        var cls = typeof rule.cls === 'function'
          ? rule.cls(value, {
            code: text,
            sets: context.sets,
            index: index,
            end: index + value.length
          })
          : rule.cls;

        out += cls ? '<span class="' + cls + '">' + escapeHtml(value) + '</span>' : escapeHtml(value);
        index += value.length;
        matched = true;
        break;
      }

      if (!matched) {
        out += escapeHtml(text.charAt(index));
        index++;
      }
    }

    return out;
  }

  /**
   * 把源码渲染进某个元素（自动使用 <code> 子节点）。
   */
  function render(element, language, code, options) {
    if (!element) return;
    element.innerHTML = highlight(language, code, options);
  }

  function detect(text) {
    var source = String(text || '').trim();
    if (!source) return 'text';

    if (/^[\[{]/.test(source)) {
      try {
        JSON.parse(source);
        return 'json';
      } catch (err) {
        /* 不是 JSON，继续判断 */
      }
    }

    if (/^\s*</.test(source) && /<\/[A-Za-z]/.test(source)) return 'xml';

    /* SQL：出现两个以上典型关键字（大小写不敏感）就认定是 SQL */
    var sqlHits = source.match(/\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN|GROUP\s+BY|ORDER\s+BY|VALUES|SET)\b/gi);
    if (sqlHits && sqlHits.length >= 2) return 'sql';
    if (sqlHits && sqlHits.length === 1 && /;/.test(source)) return 'sql';

    if (/(?:^|\n)\s*(?:public|private|protected)\s+(?:static\s+)?(?:class|void|final)\b/.test(source)) return 'java';
    if (/(?:^|\n)\s*(?:def|class)\s+\w+.*:/.test(source)) return 'python';
    if (/(?:^|\n)\s*(?:function|const|let|var|import|export)\b/.test(source)) return 'javascript';
    if (/^\s*[#\[\]{}]/.test(source) || /^\s*#\s+\S/m.test(source)) return 'markdown';

    return 'text';
  }

  function labelOf(id) {
    for (var i = 0; i < LANGUAGES.length; i++) {
      if (LANGUAGES[i].id === id) return LANGUAGES[i].label;
    }
    return id;
  }

  return {
    LANGUAGES: LANGUAGES,
    MAX_LENGTH: MAX_LENGTH,
    escapeHtml: escapeHtml,
    highlight: highlight,
    render: render,
    detect: detect,
    detectDialect: function (sql) {
      var mod = getDialects();
      if (!mod || typeof mod.detect !== 'function') return 'ansi';
      try {
        return mod.detect(sql);
      } catch (err) {
        return 'ansi';
      }
    },
    sqlSetsFor: sqlSetsFor,
    labelOf: labelOf
  };
});
