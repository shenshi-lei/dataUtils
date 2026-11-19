/* =========================================================
 * 开发工具箱 — 日期与时间戳
 * 手写严格解析，避免 new Date('YYYY-MM-DD HH:mm:ss') 的浏览器差异。
 * ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DateFormat = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  var WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var ZONES = [
    { id: 'local', label: '本地时间', short: '本地' },
    { id: 'UTC', label: 'UTC', short: 'UTC' },
    { id: 'Asia/Shanghai', label: '北京时间 (UTC+8)', short: '北京' },
    { id: 'Asia/Tokyo', label: '东京 (UTC+9)', short: '东京' },
    { id: 'Asia/Kolkata', label: '印度 (UTC+5:30)', short: '印度' },
    { id: 'Europe/London', label: '伦敦', short: '伦敦' },
    { id: 'Europe/Berlin', label: '柏林', short: '柏林' },
    { id: 'America/New_York', label: '纽约', short: '纽约' },
    { id: 'America/Los_Angeles', label: '洛杉矶', short: '洛杉矶' },
    { id: 'Australia/Sydney', label: '悉尼', short: '悉尼' }
  ];

  var PLAIN_RE = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;
  var ISO_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})$/i;

  function pad(value, size) {
    var text = String(Math.abs(Math.trunc(value)));
    while (text.length < (size || 2)) text = '0' + text;
    return text;
  }

  function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
  }

  function parseOffset(text) {
    var upper = String(text).toUpperCase();
    if (upper === 'Z') return 0;

    var match = /^([+-])(\d{2}):?(\d{2})$/.exec(upper);
    if (!match) throw new Error('时区偏移格式不正确，应为 +08:00 或 Z');

    var hours = Number(match[2]);
    var minutes = Number(match[3]);
    if (hours > 23 || minutes > 59) throw new Error('时区偏移超出范围');

    var total = hours * 60 + minutes;
    return match[1] === '-' ? -total : total;
  }

  function normalizeZone(zone) {
    if (zone === undefined || zone === null || zone === '' || zone === 'local') return 'local';
    if (typeof zone === 'number' && isFinite(zone)) return zone;
    return String(zone);
  }

  /**
   * 解析日期文本。
   * @param {string} text
   * @param {{zone?: 'local'|'utc'|number}} [options]
   * @returns {{date: Date, epochMs: number, source: string}}
   */
  function parse(text, options) {
    options = options || {};
    var source = String(text === null || text === undefined ? '' : text).trim();

    if (!source) throw new Error('请输入日期或时间');

    var iso = ISO_RE.exec(source);
    var plain = iso ? null : PLAIN_RE.exec(source);

    if (!iso && !plain) {
      throw new Error('无法识别的时间格式，示例：2026-11-19 22:03:34 或 2026-11-19T14:03:34Z');
    }

    var match = iso || plain;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var hour = match[4] === undefined ? 0 : Number(match[4]);
    var minute = match[5] === undefined ? 0 : Number(match[5]);
    var second = match[6] === undefined ? 0 : Number(match[6]);
    var milli = match[7] === undefined ? 0 : Number(String(match[7]).padEnd(3, '0'));

    if (year < 1000 || year > 9999) throw new Error('年份需在 1000–9999 之间');
    if (month < 1 || month > 12) throw new Error('月份需在 1–12 之间');
    if (day < 1 || day > daysInMonth(year, month)) {
      throw new Error('该日期不存在：' + year + '-' + pad(month) + ' 只有 ' + daysInMonth(year, month) + ' 天');
    }
    if (hour > 23) throw new Error('小时需在 0–23 之间');
    if (minute > 59) throw new Error('分钟需在 0–59 之间');
    if (second > 59) throw new Error('秒需在 0–59 之间');

    var zone;
    var offsetMinutes;

    if (iso) {
      offsetMinutes = match[8] ? parseOffset(match[8]) : 0;
      zone = match[8] && String(match[8]).toUpperCase() !== 'Z' ? 'offset' : 'UTC';
    } else {
      zone = normalizeZone(options.zone);
      offsetMinutes = 0;
    }

    var date;

    if (zone === 'local') {
      date = new Date(year, month - 1, day, hour, minute, second, milli);

      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day ||
        date.getHours() !== hour ||
        date.getMinutes() !== minute
      ) {
        throw new Error('该时间在本地时区不存在（可能处于夏令时切换的空档）');
      }
    } else if (zone === 'UTC' || zone === 'offset') {
      var utcMs = Date.UTC(year, month - 1, day, hour, minute, second, milli) - offsetMinutes * 60000;
      date = new Date(utcMs);
    } else if (typeof zone === 'number') {
      date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, milli) - zone * 60000);
    } else {
      /* IANA 时区：按该时区相对 UTC 的偏移换算 */
      var probe = Date.UTC(year, month - 1, day, hour, minute, second, milli);
      var forward = offsetMinutesOf(new Date(probe), zone);
      var backward = offsetMinutesOf(new Date(probe - forward * 60000), zone);
      var chosen = forward === backward ? forward : backward;
      date = new Date(probe - chosen * 60000);

      var check = parts(date, { timeZone: zone });
      if (check.year !== year || check.month !== month || check.day !== day || check.hour !== hour) {
        throw new Error('该时间在 ' + zone + ' 时区不存在（可能处于夏令时切换的空档）');
      }
    }

    if (!isValidDate(date)) throw new Error('解析结果不是合法时间');

    return { date: date, epochMs: date.getTime(), source: source };
  }

  /**
   * 解析时间戳，自动识别秒 / 毫秒 / 微秒。
   * @param {string|number} value
   * @param {{unit?: 'auto'|'s'|'ms'|'us'}} [options]
   */
  function parseTimestamp(value, options) {
    options = options || {};
    var source = String(value === null || value === undefined ? '' : value).trim();

    if (!/^-?\d+$/.test(source)) throw new Error('时间戳必须是整数');

    var unit = options.unit && options.unit !== 'auto' ? options.unit : detectUnit(source);
    var ms;

    if (unit === 's') ms = Number(source) * 1000;
    else if (unit === 'us') ms = Number(source) / 1000;
    else ms = Number(source);

    if (!isFinite(ms)) throw new Error('时间戳数值超出范围');

    var date = new Date(ms);
    if (!isValidDate(date)) throw new Error('时间戳超出可表示范围');

    return { date: date, epochMs: date.getTime(), unit: unit, source: source };
  }

  function detectUnit(text) {
    var digits = text.replace('-', '').length;

    if (digits === 13) return 'ms';
    if (digits === 16) return 'us';
    if (digits === 10) return 's';

    var abs = Math.abs(Number(text));
    if (abs < 1e11) return 's';
    if (abs < 1e14) return 'ms';
    return 'us';
  }

  function offsetMinutesOf(date, timeZone) {
    if (timeZone === 'local') return -date.getTimezoneOffset();
    if (timeZone === 'UTC' || timeZone === 'utc') return 0;

    var current = zoneParts(date, timeZone);
    var asUtc = Date.UTC(
      current.year,
      current.month - 1,
      current.day,
      current.hour,
      current.minute,
      current.second,
      current.milli
    );

    return Math.round((asUtc - date.getTime()) / 60000);
  }

  function intlFormat(timeZone) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /* 只取时区字段，不含 UTC 偏移，避免与 offsetMinutesOf 相互递归 */
  function zoneParts(date, zone) {
    if (zone === 'local') {
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
        milli: date.getMilliseconds(),
        weekday: date.getDay()
      };
    }

    if (zone === 'UTC' || zone === 'utc') {
      return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds(),
        milli: date.getUTCMilliseconds(),
        weekday: date.getUTCDay()
      };
    }

    var bucket = {};
    var list = intlFormat(zone).formatToParts(date);

    for (var i = 0; i < list.length; i++) {
      if (list[i].type !== 'literal') bucket[list[i].type] = list[i].value;
    }

    var hour = Number(bucket.hour);
    if (hour === 24) hour = 0;

    return {
      year: Number(bucket.year),
      month: Number(bucket.month),
      day: Number(bucket.day),
      hour: hour,
      minute: Number(bucket.minute),
      second: Number(bucket.second),
      milli: date.getMilliseconds(),
      weekday: new Date(
        Date.UTC(Number(bucket.year), Number(bucket.month) - 1, Number(bucket.day))
      ).getUTCDay()
    };
  }

  /**
   * 取某个时刻在指定时区下的字段（含 UTC 偏移分钟数）。
   * @param {Date} date
   * @param {{timeZone?: string}} [options]
   */
  function parts(date, options) {
    options = options || {};
    var zone = options.timeZone || 'local';
    var fields = zoneParts(date, zone);

    fields.offsetMinutes = zone === 'local' ? -date.getTimezoneOffset() : offsetMinutesOf(date, zone);
    return fields;
  }

  /**
   * 格式化。
   * 支持 YYYY MM DD HH mm ss SSS、M D H、Z / ZZ（时区偏移）。
   */
  function format(date, pattern, options) {
    var opts = options || {};
    var zone = opts.timeZone || 'local';
    var current = parts(date, { timeZone: zone });
    var template = pattern === undefined || pattern === null ? 'YYYY-MM-DD HH:mm:ss' : String(pattern);

    var offset = current.offsetMinutes;
    var sign = offset < 0 ? '-' : '+';
    var abs = Math.abs(offset);
    var offsetText = sign + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60);
    var compactOffset = sign + pad(Math.floor(abs / 60)) + pad(abs % 60);

    return template.replace(/YYYY|MM|DD|HH|mm|ss|SSS|ZZ|Z|M|D|H/g, function (token) {
      switch (token) {
        case 'YYYY': return pad(current.year, 4);
        case 'MM': return pad(current.month);
        case 'M': return String(current.month);
        case 'DD': return pad(current.day);
        case 'D': return String(current.day);
        case 'HH': return pad(current.hour);
        case 'H': return String(current.hour);
        case 'mm': return pad(current.minute);
        case 'ss': return pad(current.second);
        case 'SSS': return pad(current.milli, 3);
        case 'ZZ': return offsetText;
        case 'Z': return compactOffset;
        default: return token;
      }
    });
  }

  function iso(date, options) {
    var opts = options || {};
    var zone = opts.timeZone || 'local';
    var current = parts(date, { timeZone: zone });
    var offset = current.offsetMinutes;
    var sign = offset < 0 ? '-' : '+';
    var abs = Math.abs(offset);
    var suffix = zone === 'UTC' || zone === 'utc' ? 'Z' : sign + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60);

    return (
      pad(current.year, 4) + '-' + pad(current.month) + '-' + pad(current.day) +
      'T' + pad(current.hour) + ':' + pad(current.minute) + ':' + pad(current.second) +
      '.' + pad(current.milli, 3) + suffix
    );
  }

  function rfc2822(date) {
    var weekday = WEEKDAYS_EN[date.getUTCDay()];
    var month = MONTHS_EN[date.getUTCMonth()];

    return (
      weekday + ', ' + pad(date.getUTCDate()) + ' ' + month + ' ' + date.getUTCFullYear() +
      ' ' + pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ':' + pad(date.getUTCSeconds()) +
      ' +0000'
    );
  }

  function relative(target, now) {
    var from = target instanceof Date ? target.getTime() : Number(target);
    var base = now instanceof Date ? now.getTime() : Number(now === undefined ? Date.now() : now);
    var diff = from - base;
    var future = diff > 0;
    var abs = Math.abs(diff);
    var suffix = future ? '后' : '前';

    if (abs < 10000) return '刚刚';
    if (abs < 60000) return Math.round(abs / 1000) + ' 秒' + suffix;
    if (abs < 3600000) return Math.round(abs / 60000) + ' 分钟' + suffix;
    if (abs < 86400000) return Math.round(abs / 3600000) + ' 小时' + suffix;
    if (abs < 2592000000) return Math.round(abs / 86400000) + ' 天' + suffix;
    if (abs < 31536000000) return Math.round(abs / 2592000000) + ' 个月' + suffix;
    return Math.round(abs / 31536000000) + ' 年' + suffix;
  }

  function weekday(date, options) {
    var zone = (options && options.timeZone) || 'local';
    return WEEKDAYS[parts(date, { timeZone: zone }).weekday];
  }

  return {
    ZONES: ZONES,
    WEEKDAYS: WEEKDAYS,
    pad: pad,
    daysInMonth: daysInMonth,
    isLeapYear: isLeapYear,
    isValidDate: isValidDate,
    parse: parse,
    parseTimestamp: parseTimestamp,
    detectUnit: detectUnit,
    parts: parts,
    offsetMinutesOf: offsetMinutesOf,
    format: format,
    iso: iso,
    rfc2822: rfc2822,
    relative: relative,
    weekday: weekday
  };
});
