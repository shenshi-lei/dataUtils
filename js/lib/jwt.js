/* =========================================================
 * 开发工具箱 — JWT 解码（不验签）
 * ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./bytes.js'));
  } else {
    root.JWT = factory(root.Bytes);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Bytes) {
  'use strict';

  function decodePart(part, label) {
    if (!part) throw new Error(label + ' 段为空');

    var bytes;
    try {
      bytes = Bytes.base64UrlToBytes(part);
    } catch (err) {
      throw new Error(label + ' 段不是合法的 Base64URL 编码');
    }

    var text = Bytes.utf8Decode(bytes);

    var json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      throw new Error(label + ' 段不是合法 JSON，原文：' + text.slice(0, 120));
    }

    return { json: json, text: text };
  }

  function normalize(token) {
    return String(token === null || token === undefined ? '' : token)
      .trim()
      .replace(/^Bearer\s+/i, '')
      .replace(/\s+/g, '');
  }

  /**
   * 解码 JWT。
   * @returns {{token:string, header:object, payload:object, signatureBytes:number}}
   */
  function decode(token) {
    var value = normalize(token);
    if (!value) throw new Error('请输入 JWT');

    var parts = value.split('.');

    if (parts.length !== 3) {
      throw new Error('JWT 应由三段组成（header.payload.signature），当前为 ' + parts.length + ' 段');
    }

    var header = decodePart(parts[0], 'Header');
    var payload = decodePart(parts[1], 'Payload');

    var signatureBytes = 0;
    try {
      signatureBytes = Bytes.base64UrlToBytes(parts[2]).length;
    } catch (err) {
      signatureBytes = 0;
    }

    return {
      token: value,
      header: header.json,
      payload: payload.json,
      signatureBytes: signatureBytes
    };
  }

  function sample() {
    var header = Bytes.bytesToBase64Url(Bytes.utf8Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
    var payload = Bytes.bytesToBase64Url(Bytes.utf8Encode(JSON.stringify({
      sub: '1234567890',
      name: '张三',
      iat: 1700000000,
      exp: 1900000000
    })));
    var signature = Bytes.bytesToBase64Url(Bytes.utf8Encode('demo-signature-not-verified'));

    return header + '.' + payload + '.' + signature;
  }

  return {
    decode: decode,
    normalize: normalize,
    sample: sample
  };
});
