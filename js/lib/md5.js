/* =========================================================
 * 开发工具箱 — MD5（RFC 1321）
 * WebCrypto 不提供 MD5，这里给出纯 JS 实现；支持 UTF-8 文本与任意字节。
 * ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MD5 = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SHIFT = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  var TABLE = (function () {
    var table = new Int32Array(64);
    for (var i = 0; i < 64; i++) {
      table[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
    }
    return table;
  })();

  function toBytes(input) {
    if (input instanceof Uint8Array) return input;
    if (typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer) return new Uint8Array(input);
    if (Array.isArray(input)) return new Uint8Array(input);
    throw new TypeError('MD5 只接受字节数组');
  }

  function encodeUtf8(text) {
    var value = String(text === null || text === undefined ? '' : text);

    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(value);
    }

    var out = [];
    for (var i = 0; i < value.length; i++) {
      var code = value.charCodeAt(i);

      if (code < 0x80) {
        out.push(code);
      } else if (code < 0x800) {
        out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < value.length) {
        var next = value.charCodeAt(i + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          var point = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
          out.push(
            0xf0 | (point >> 18),
            0x80 | ((point >> 12) & 0x3f),
            0x80 | ((point >> 6) & 0x3f),
            0x80 | (point & 0x3f)
          );
          i++;
          continue;
        }
        out.push(0xef, 0xbf, 0xbd);
      } else {
        out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      }
    }

    return new Uint8Array(out);
  }

  function digestBytes(input) {
    var message = toBytes(input);
    var length = message.length;

    /* 填充：0x80 + 若干 0x00，使长度 ≡ 56 (mod 64)，再补 8 字节小端比特长度 */
    var blocks = ((length + 8) >>> 6) + 1;
    var padded = new Uint8Array(blocks * 64);
    padded.set(message, 0);
    padded[length] = 0x80;

    var bitLow = (length << 3) >>> 0;
    var bitHigh = Math.floor(length / 536870912) >>> 0;
    var tail = blocks * 64 - 8;

    padded[tail] = bitLow & 0xff;
    padded[tail + 1] = (bitLow >>> 8) & 0xff;
    padded[tail + 2] = (bitLow >>> 16) & 0xff;
    padded[tail + 3] = (bitLow >>> 24) & 0xff;
    padded[tail + 4] = bitHigh & 0xff;
    padded[tail + 5] = (bitHigh >>> 8) & 0xff;
    padded[tail + 6] = (bitHigh >>> 16) & 0xff;
    padded[tail + 7] = (bitHigh >>> 24) & 0xff;

    var a0 = 0x67452301;
    var b0 = 0xefcdab89 | 0;
    var c0 = 0x98badcfe | 0;
    var d0 = 0x10325476;

    var words = new Int32Array(16);
    var offset = 0;

    while (offset < padded.length) {
      for (var i = 0; i < 16; i++) {
        var base = offset + i * 4;
        words[i] = padded[base] | (padded[base + 1] << 8) | (padded[base + 2] << 16) | (padded[base + 3] << 24);
      }

      var a = a0;
      var b = b0;
      var c = c0;
      var d = d0;

      for (var step = 0; step < 64; step++) {
        var f;
        var g;

        if (step < 16) {
          f = (b & c) | (~b & d);
          g = step;
        } else if (step < 32) {
          f = (d & b) | (~d & c);
          g = (5 * step + 1) & 15;
        } else if (step < 48) {
          f = b ^ c ^ d;
          g = (3 * step + 5) & 15;
        } else {
          f = c ^ (b | ~d);
          g = (7 * step) & 15;
        }

        var temp = (a + f + TABLE[step] + words[g]) | 0;
        temp = (temp << SHIFT[step]) | (temp >>> (32 - SHIFT[step]));

        a = d;
        d = c;
        c = b;
        b = (b + temp) | 0;
      }

      a0 = (a0 + a) | 0;
      b0 = (b0 + b) | 0;
      c0 = (c0 + c) | 0;
      d0 = (d0 + d) | 0;
      offset += 64;
    }

    var out = new Uint8Array(16);
    var state = [a0, b0, c0, d0];

    for (var s = 0; s < 4; s++) {
      var value = state[s];
      out[s * 4] = value & 0xff;
      out[s * 4 + 1] = (value >>> 8) & 0xff;
      out[s * 4 + 2] = (value >>> 16) & 0xff;
      out[s * 4 + 3] = (value >>> 24) & 0xff;
    }

    return out;
  }

  function toHex(bytes) {
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
      hex += ('0' + bytes[i].toString(16)).slice(-2);
    }
    return hex;
  }

  function hex(text) {
    return toHex(digestBytes(encodeUtf8(text)));
  }

  function digest(input) {
    if (typeof input === 'string') return digestBytes(encodeUtf8(input));
    return digestBytes(input);
  }

  function base64(text) {
    var bytes = digestBytes(encodeUtf8(text));
    var binary = '';
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  return {
    digest: digest,
    digestBytes: digestBytes,
    hex: hex,
    base64: base64,
    encodeUtf8: encodeUtf8
  };
});
