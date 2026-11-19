/* =========================================================
 * 开发工具箱 — WebCrypto 封装
 * 只做参数组装与错误归一化；算法实现来自浏览器内置 crypto.subtle。
 * ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CryptoKit = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function getSubtle() {
    if (typeof crypto === 'undefined' || !crypto) return null;
    return crypto.subtle || null;
  }

  function available() {
    return !!getSubtle();
  }

  function unavailableReason() {
    if (available()) return '';

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      return '当前页面不是安全上下文，浏览器禁止使用加密接口。请通过 http://localhost 或 https 打开本页面。';
    }

    return '当前浏览器不支持 Web Crypto（crypto.subtle），请升级浏览器或改用 Chrome / Edge。';
  }

  function toUint8(input) {
    if (input instanceof Uint8Array) return input;
    if (typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer) return new Uint8Array(input);
    if (Array.isArray(input)) return new Uint8Array(input);
    return new Uint8Array(0);
  }

  function digest(name, bytes) {
    var subtle = getSubtle();
    if (!subtle) return Promise.reject(new Error(unavailableReason()));

    return subtle.digest(name, toUint8(bytes)).then(function (buffer) {
      return new Uint8Array(buffer);
    });
  }

  function hmac(hashName, keyBytes, messageBytes) {
    var subtle = getSubtle();
    if (!subtle) return Promise.reject(new Error(unavailableReason()));

    return subtle
      .importKey('raw', toUint8(keyBytes), { name: 'HMAC', hash: { name: hashName } }, false, ['sign'])
      .then(function (key) {
        return subtle.sign('HMAC', key, toUint8(messageBytes));
      })
      .then(function (buffer) {
        return new Uint8Array(buffer);
      });
  }

  var MODES = ['CBC', 'CTR', 'GCM'];

  function normalizeMode(mode) {
    var upper = String(mode || '').toUpperCase();
    if (MODES.indexOf(upper) < 0) throw new Error('不支持的 AES 模式：' + mode);
    return upper;
  }

  function algorithmOf(mode, ivBytes, extra) {
    var name = 'AES-' + normalizeMode(mode);

    if (name === 'AES-CBC') return { name: name, iv: toUint8(ivBytes) };
    if (name === 'AES-CTR') return { name: name, counter: toUint8(ivBytes), length: 64 };
    return { name: name, iv: toUint8(ivBytes), tagLength: (extra && extra.tagLength) || 128 };
  }

  function importAesKey(keyBytes, mode, usage) {
    var subtle = getSubtle();
    if (!subtle) return Promise.reject(new Error(unavailableReason()));

    return subtle.importKey('raw', toUint8(keyBytes), { name: 'AES-' + normalizeMode(mode) }, false, usage);
  }

  function aesEncrypt(options) {
    var opts = options || {};
    var subtle = getSubtle();
    if (!subtle) return Promise.reject(new Error(unavailableReason()));

    var mode = normalizeMode(opts.mode);
    var algorithm = algorithmOf(mode, opts.iv, { tagLength: opts.tagLength });

    return importAesKey(opts.key, mode, ['encrypt']).then(function (key) {
      return subtle.encrypt(algorithm, key, toUint8(opts.data));
    }).then(function (buffer) {
      return new Uint8Array(buffer);
    });
  }

  function aesDecrypt(options) {
    var opts = options || {};
    var subtle = getSubtle();
    if (!subtle) return Promise.reject(new Error(unavailableReason()));

    var mode = normalizeMode(opts.mode);
    var algorithm = algorithmOf(mode, opts.iv, { tagLength: opts.tagLength });

    return importAesKey(opts.key, mode, ['decrypt']).then(function (key) {
      return subtle.decrypt(algorithm, key, toUint8(opts.data));
    }).then(function (buffer) {
      return new Uint8Array(buffer);
    });
  }

  /* 把浏览器原始的 DOMException 文本换成可读中文提示 */
  function describeError(error, action) {
    var raw = error && error.message ? String(error.message) : '';
    var lower = raw.toLowerCase();

    if (lower.indexOf('operationerror') >= 0 || lower.indexOf('operation error') >= 0) {
      if (action === 'decrypt') return '解密失败：密钥或 IV 不正确，或数据已被篡改（GCM 校验不通过）';
      return '加密失败：请检查密钥与 IV 是否符合所选模式的要求';
    }

    if (lower.indexOf('dataerror') >= 0 || lower.indexOf('data error') >= 0) {
      return '数据格式不合法：长度必须符合所选模式的分组要求';
    }

    if (lower.indexOf('invalidaccess') >= 0 || lower.indexOf('invalid access') >= 0) {
      return '密钥长度不符合要求：AES 只接受 16 / 24 / 32 字节';
    }

    if (lower.indexOf('not supported') >= 0 || lower.indexOf('notsupported') >= 0) {
      return '当前浏览器不支持该算法或参数';
    }

    return raw || '加解密失败';
  }

  return {
    available: available,
    unavailableReason: unavailableReason,
    digest: digest,
    hmac: hmac,
    aesEncrypt: aesEncrypt,
    aesDecrypt: aesDecrypt,
    describeError: describeError,
    MODES: MODES
  };
});
