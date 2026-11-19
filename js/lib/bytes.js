/* =========================================================
 * 开发工具箱 — 字节级编解码基础
 * UTF-8 / Hex / Base64 / Base64URL、PKCS#7 填充、安全随机数。
 * 同时支持浏览器全局 Bytes 与 Node require。
 * ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Bytes = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var hasTextEncoder = typeof TextEncoder !== 'undefined';
  var encoder = hasTextEncoder ? new TextEncoder() : null;
  var decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: false }) : null;
  var HEX = '0123456789abcdef';

  function toBytes(input) {
    if (input instanceof Uint8Array) return input;
    if (typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer) return new Uint8Array(input);
    if (Array.isArray(input)) return new Uint8Array(input);
    if (input && input.buffer instanceof ArrayBuffer) {
      return new Uint8Array(input.buffer, input.byteOffset || 0, input.byteLength);
    }
    throw new TypeError('需要字节数组');
  }

  /* ---------------- UTF-8 ---------------- */

  function utf8Encode(text) {
    var value = String(text === null || text === undefined ? '' : text);
    if (encoder) return encoder.encode(value);
    return manualEncode(value);
  }

  function manualEncode(text) {
    var out = [];
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);

      if (code < 0x80) {
        out.push(code);
        continue;
      }

      if (code < 0x800) {
        out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        continue;
      }

      if (code >= 0xd800 && code <= 0xdbff) {
        var next = text.charCodeAt(i + 1);
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
        continue;
      }

      if (code >= 0xdc00 && code <= 0xdfff) {
        out.push(0xef, 0xbf, 0xbd);
        continue;
      }

      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }

    return new Uint8Array(out);
  }

  function utf8Decode(input, options) {
    var view = toBytes(input);
    if (decoder) {
      try {
        return decoder.decode(view);
      } catch (err) {
        /* 落到手动实现 */
      }
    }
    return manualDecode(view);
  }

  function manualDecode(view) {
    var out = '';
    var i = 0;

    while (i < view.length) {
      var byte = view[i];

      if (byte < 0x80) {
        out += String.fromCharCode(byte);
        i++;
        continue;
      }

      var extra = 0;
      var point = 0;

      if ((byte & 0xe0) === 0xc0) {
        extra = 1;
        point = byte & 0x1f;
      } else if ((byte & 0xf0) === 0xe0) {
        extra = 2;
        point = byte & 0x0f;
      } else if ((byte & 0xf8) === 0xf0) {
        extra = 3;
        point = byte & 0x07;
      } else {
        out += '\ufffd';
        i++;
        continue;
      }

      if (i + extra >= view.length) {
        out += '\ufffd';
        break;
      }

      var valid = true;
      for (var k = 1; k <= extra; k++) {
        var cont = view[i + k];
        if ((cont & 0xc0) !== 0x80) {
          valid = false;
          break;
        }
        point = (point << 6) | (cont & 0x3f);
      }

      if (!valid) {
        out += '\ufffd';
        i++;
        continue;
      }

      if (point > 0x10ffff) {
        out += '\ufffd';
        i += extra + 1;
        continue;
      }

      if (point > 0xffff) {
        point -= 0x10000;
        out += String.fromCharCode(0xd800 + (point >> 10), 0xdc00 + (point & 0x3ff));
      } else {
        out += String.fromCharCode(point);
      }

      i += extra + 1;
    }

    return out;
  }

  function isValidUtf8(input) {
    var view = toBytes(input);
    if (typeof TextDecoder === 'undefined') return true;

    try {
      new TextDecoder('utf-8', { fatal: true }).decode(view);
      return true;
    } catch (err) {
      return false;
    }
  }

  function utf8ByteLength(text) {
    return utf8Encode(text).length;
  }

  /* ---------------- Hex ---------------- */

  function bytesToHex(input) {
    var view = toBytes(input);
    var out = '';

    for (var i = 0; i < view.length; i++) {
      out += HEX.charAt(view[i] >> 4) + HEX.charAt(view[i] & 0x0f);
    }

    return out;
  }

  function hexToBytes(text) {
    var clean = String(text === null || text === undefined ? '' : text)
      .replace(/[\s:_-]/g, '')
      .replace(/^0x/i, '');

    if (!clean) return new Uint8Array(0);
    if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error('十六进制字符串含非法字符');
    if (clean.length % 2 !== 0) throw new Error('十六进制字符串长度必须为偶数');

    var out = new Uint8Array(clean.length / 2);
    for (var i = 0; i < out.length; i++) {
      out[i] = parseInt(clean.substr(i * 2, 2), 16);
    }

    return out;
  }

  /* ---------------- Base64 ---------------- */

  function bytesToBase64(input) {
    var view = toBytes(input);
    var chunks = [];

    for (var i = 0; i < view.length; i += 0x8000) {
      chunks.push(String.fromCharCode.apply(null, view.subarray(i, i + 0x8000)));
    }

    return btoa(chunks.join(''));
  }

  function base64ToBytes(text) {
    var clean = String(text === null || text === undefined ? '' : text).replace(/[\s\r\n]+/g, '');

    if (!clean) return new Uint8Array(0);
    if (!/^[A-Za-z0-9+/_=-]+$/.test(clean)) throw new Error('Base64 字符串含非法字符');

    clean = clean.replace(/-/g, '+').replace(/_/g, '/');

    var remainder = clean.length % 4;
    if (remainder === 1) throw new Error('Base64 字符串长度不合法');
    if (remainder) clean += '===='.slice(0, 4 - remainder);

    var binary;
    try {
      binary = atob(clean);
    } catch (err) {
      throw new Error('Base64 解码失败，请检查内容是否完整');
    }

    var out = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);

    return out;
  }

  function bytesToBase64Url(input) {
    return bytesToBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64UrlToBytes(text) {
    return base64ToBytes(String(text || '').replace(/-/g, '+').replace(/_/g, '/'));
  }

  function utf8ToBase64(text) {
    return bytesToBase64(utf8Encode(text));
  }

  function base64ToUtf8(text) {
    return utf8Decode(base64ToBytes(text));
  }

  /* ---------------- PKCS#7 ---------------- */

  function pkcs7Pad(input, blockSize) {
    var size = blockSize || 16;
    var view = toBytes(input);
    var pad = size - (view.length % size);
    var out = new Uint8Array(view.length + pad);

    out.set(view, 0);
    for (var i = 0; i < pad; i++) out[view.length + i] = pad;

    return out;
  }

  function pkcs7Unpad(input, blockSize) {
    var size = blockSize || 16;
    var view = toBytes(input);

    if (!view.length) throw new Error('数据为空，无法去除填充');
    if (view.length % size !== 0) throw new Error('数据长度不是分组长度的整数倍');

    var pad = view[view.length - 1];
    if (pad < 1 || pad > size) throw new Error('填充字节非法（密钥或模式可能不匹配）');

    for (var i = view.length - pad; i < view.length; i++) {
      if (view[i] !== pad) throw new Error('填充字节非法（密钥或模式可能不匹配）');
    }

    return view.subarray(0, view.length - pad);
  }

  /* ---------------- 随机与字节工具 ---------------- */

  function randomBytes(size) {
    var count = Math.max(0, Math.floor(Number(size) || 0));
    var out = new Uint8Array(count);
    var cryptoObj = typeof crypto !== 'undefined' ? crypto : null;

    if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
      throw new Error('当前环境不支持安全随机数（crypto.getRandomValues）');
    }

    cryptoObj.getRandomValues(out);
    return out;
  }

  function concatBytes() {
    var total = 0;
    var i;
    var parts = [];

    for (i = 0; i < arguments.length; i++) {
      var part = toBytes(arguments[i]);
      parts.push(part);
      total += part.length;
    }

    var out = new Uint8Array(total);
    var offset = 0;

    for (i = 0; i < parts.length; i++) {
      out.set(parts[i], offset);
      offset += parts[i].length;
    }

    return out;
  }

  function bytesEqual(a, b) {
    var left = toBytes(a);
    var right = toBytes(b);
    if (left.length !== right.length) return false;

    var diff = 0;
    for (var i = 0; i < left.length; i++) diff |= left[i] ^ right[i];

    return diff === 0;
  }

  return {
    toBytes: toBytes,
    utf8Encode: utf8Encode,
    utf8Decode: utf8Decode,
    isValidUtf8: isValidUtf8,
    utf8ByteLength: utf8ByteLength,
    bytesToHex: bytesToHex,
    hexToBytes: hexToBytes,
    bytesToBase64: bytesToBase64,
    base64ToBytes: base64ToBytes,
    bytesToBase64Url: bytesToBase64Url,
    base64UrlToBytes: base64UrlToBytes,
    utf8ToBase64: utf8ToBase64,
    base64ToUtf8: base64ToUtf8,
    pkcs7Pad: pkcs7Pad,
    pkcs7Unpad: pkcs7Unpad,
    randomBytes: randomBytes,
    concatBytes: concatBytes,
    bytesEqual: bytesEqual
  };
});
