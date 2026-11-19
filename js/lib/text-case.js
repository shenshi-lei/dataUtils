/* =========================================================
 * 开发工具箱 — 文本命名风格与行级整理
 * ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TextCase = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * 按空白、下划线、中划线、驼峰边界切词。
   * 保留中文等非 ASCII 字母（它们不会成为分隔符）。
   */
  function splitWords(text) {
    return String(text === null || text === undefined ? '' : text)
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .replace(/[_\-\s]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);
  }

  function capitalize(word) {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function lowerFirst(word) {
    if (!word) return '';
    return word.charAt(0).toLowerCase() + word.slice(1);
  }

  function camel(text) {
    var words = splitWords(text);
    if (!words.length) return '';
    return lowerFirst(words[0].toLowerCase()) + words.slice(1).map(function (word) {
      return capitalize(word.toLowerCase());
    }).join('');
  }

  function pascal(text) {
    return splitWords(text).map(function (word) {
      return capitalize(word.toLowerCase());
    }).join('');
  }

  function snake(text) {
    return splitWords(text).map(function (word) { return word.toLowerCase(); }).join('_');
  }

  function kebab(text) {
    return splitWords(text).map(function (word) { return word.toLowerCase(); }).join('-');
  }

  function constant(text) {
    return splitWords(text).map(function (word) { return word.toUpperCase(); }).join('_');
  }

  function title(text) {
    return String(text).replace(/\S+/g, function (word) {
      return capitalize(word.toLowerCase());
    });
  }

  function trimLines(text) {
    return String(text).split('\n').map(function (line) { return line.trim(); }).join('\n');
  }

  function removeBlank(text) {
    return String(text).split('\n').filter(function (line) { return line.trim() !== ''; }).join('\n');
  }

  function dedupeLines(text) {
    var seen = Object.create(null);
    return String(text).split('\n').filter(function (line) {
      if (seen[line]) return false;
      seen[line] = true;
      return true;
    }).join('\n');
  }

  function sortLines(text) {
    return String(text).split('\n').sort(function (a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
    }).join('\n');
  }

  function reverseLines(text) {
    return String(text).split('\n').reverse().join('\n');
  }

  var OPERATIONS = {
    camel: camel,
    pascal: pascal,
    snake: snake,
    kebab: kebab,
    constant: constant,
    upper: function (text) { return String(text).toUpperCase(); },
    lower: function (text) { return String(text).toLowerCase(); },
    title: title,
    trim: trimLines,
    blank: removeBlank,
    dedupe: dedupeLines,
    sort: sortLines,
    reverse: reverseLines
  };

  function apply(text, operation) {
    var handler = OPERATIONS[operation];
    if (!handler) throw new Error('未知的文本操作：' + operation);
    return handler(text);
  }

  return {
    splitWords: splitWords,
    capitalize: capitalize,
    camel: camel,
    pascal: pascal,
    snake: snake,
    kebab: kebab,
    constant: constant,
    title: title,
    trimLines: trimLines,
    removeBlank: removeBlank,
    dedupeLines: dedupeLines,
    sortLines: sortLines,
    reverseLines: reverseLines,
    apply: apply,
    OPERATIONS: OPERATIONS
  };
});
