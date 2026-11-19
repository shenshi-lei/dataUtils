/* =========================================================
 * 开发工具箱 — 任意进制整数（BigInt）
 * 不使用 Number，超过 2^53 的整数也不会丢精度。
 * ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Radix = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';
  var MAX_INPUT = 10000;

  function normalizeBase(baseOption) {
    if (baseOption === 'auto' || baseOption === undefined || baseOption === null || baseOption === '') {
      return { base: 10, auto: true };
    }

    var base = Number(baseOption);
    if (!isFinite(base) || Math.floor(base) !== base || base < 2 || base > 36) {
      throw new Error('进制需在 2–36 之间的整数');
    }

    return { base: base, auto: false };
  }

  /**
   * 解析任意进制整数。
   * @param {string} text 允许正负号与 0x / 0b / 0o 前缀
   * @param {string|number} baseOption 2–36 或 'auto'
   * @returns {bigint|null} 空输入返回 null
   */
  function parse(text, baseOption) {
    var source = String(text === null || text === undefined ? '' : text).trim();
    if (!source) return null;
    if (source.length > MAX_INPUT) throw new Error('输入过长（超过 ' + MAX_INPUT + ' 字符）');

    var sign = BigInt(1);

    if (source.charAt(0) === '-' || source.charAt(0) === '+') {
      if (source.charAt(0) === '-') sign = BigInt(-1);
      source = source.slice(1).trim();
      if (!source) throw new Error('请输入有效数字');
    }

    var config = normalizeBase(baseOption);
    var base = config.base;
    var body = source;

    var prefix = /^0[xXbBoO]/.exec(source);

    if (prefix) {
      body = source.slice(2);

      /* 只在「自动」模式下用前缀推断进制；显式选择进制时前缀仅被忽略 */
      if (config.auto) {
        var marker = source.charAt(1).toLowerCase();
        if (marker === 'x') base = 16;
        else if (marker === 'b') base = 2;
        else base = 8;
      }
    }

    if (!body) throw new Error('请输入有效数字');

    var bigBase = BigInt(base);
    var value = BigInt(0);

    for (var i = 0; i < body.length; i++) {
      var char = body.charAt(i).toLowerCase();
      var digit = DIGITS.indexOf(char);

      if (digit < 0) throw new Error('字符 “' + body.charAt(i) + '” 不是合法的数字');
      if (digit >= base) throw new Error('字符 “' + body.charAt(i) + '” 超出 ' + base + ' 进制的范围');

      value = value * bigBase + BigInt(digit);
    }

    return sign * value;
  }

  function format(value, base) {
    var target = Number(base);

    if (!isFinite(target) || Math.floor(target) !== target || target < 2 || target > 36) {
      throw new Error('输出进制需在 2–36 之间');
    }

    return value.toString(target);
  }

  /**
   * 一次性把输入转换成常用进制。
   * @returns {{value: bigint, results: Array<{base:number, text:string}>}}
   */
  function convert(text, baseOption, bases) {
    var value = parse(text, baseOption);
    if (value === null) return { value: null, results: [] };

    var list = bases && bases.length ? bases : [2, 8, 10, 16, 36];

    return {
      value: value,
      results: list.map(function (base) {
        return { base: base, text: format(value, base) };
      })
    };
  }

  return {
    DIGITS: DIGITS,
    MAX_INPUT: MAX_INPUT,
    parse: parse,
    format: format,
    convert: convert
  };
});
