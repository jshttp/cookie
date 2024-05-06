/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module exports.
 * @public
 */

exports.parse = parse;
exports.serialize = serialize;

/**
 * Module variables.
 * @private
 */

var __toString = Object.prototype.toString

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @public
 */

function parse(str, options) {
  if (typeof str !== 'string') {
    var parseError = new TypeError('argument str must be a string')
    parseError.code = 'ERR_INVALID_ARG_TYPE'
    throw parseError
  }

  var obj = {}
  var opt = options || {};
  var dec = opt.decode || decode;

  var index = 0
  while (index < str.length) {
    var eqIdx = str.indexOf('=', index)

    // no more cookie pairs
    if (eqIdx === -1) {
      break
    }

    var endIdx = str.indexOf(';', index)

    if (endIdx === -1) {
      endIdx = str.length
    } else if (endIdx < eqIdx) {
      // backtrack on prior semicolon
      index = str.lastIndexOf(';', eqIdx - 1) + 1
      continue
    }

    var key = str.slice(index, eqIdx).trim()

    // only assign once
    if (undefined === obj[key]) {
      var val = str.slice(eqIdx + 1, endIdx).trim()

      // quoted values
      if (val.charCodeAt(0) === 0x22) {
        val = val.slice(1, -1)
      }

      obj[key] = tryDecode(val, dec);
    }

    index = endIdx + 1
  }

  return obj;
}

/**
 * Serialize data into a cookie header.
 *
 * Serialize a name value pair into a cookie string suitable for
 * http headers. An optional options object specifies cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 *
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @return {string}
 * @public
 */

function serialize(name, val, options) {
  var opt = options || {};
  var enc = opt.encode || encode;

  if (typeof enc !== 'function') {
    var encodeError = new TypeError('option encode is invalid')
    encodeError.code = 'ERR_INVALID_ARG_TYPE'
    throw encodeError
  }

  if (!fieldContentRegExp.test(name)) {
    var nameError = new TypeError('argument name is invalid')
    nameError.code = 'ERR_INVALID_ARG_VALUE'
    throw nameError;
  }

  var value = enc(val);

  if (value && !fieldContentRegExp.test(value)) {
    var returnError = new TypeError('argument val is invalid')
    returnError.code = 'ERR_INVALID_RETURN_VALUE'
    throw returnError;
  }

  var str = name + '=' + value;

  if (null != opt.maxAge) {
    var maxAge = opt.maxAge - 0;

    if (isNaN(maxAge) || !isFinite(maxAge)) {
      var maxAgeError = new TypeError('option maxAge is invalid')
      maxAgeError.code = 'ERR_INVALID_ARG_VALUE'
      throw maxAgeError;
    }

    str += '; Max-Age=' + Math.floor(maxAge);
  }

  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      var domainError = new TypeError('option domain is invalid')
      domainError.code = 'ERR_INVALID_ARG_VALUE'
      throw domainError;
    }

    str += '; Domain=' + opt.domain;
  }

  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      var pathError = new TypeError('option path is invalid')
      pathError.code = 'ERR_INVALID_ARG_VALUE'
      throw pathError;
    }

    str += '; Path=' + opt.path;
  }

  if (opt.expires) {
    var expires = opt.expires
    var expiresError = new TypeError('option expires is invalid')

    if (!isDate(expires)) {
      expiresError.code = 'ERR_INVALID_ARG_TYPE'
      throw expiresError;
    } else if (isNaN(expires.valueOf())) {
      expiresError.code = 'ERR_INVALID_ARG_VALUE'
      throw expiresError;
    }

    str += '; Expires=' + expires.toUTCString()
  }

  if (opt.httpOnly) {
    str += '; HttpOnly';
  }

  if (opt.secure) {
    str += '; Secure';
  }

  if (opt.partitioned) {
    str += '; Partitioned'
  }

  if (opt.priority) {
    var priorityError = new TypeError('option priority is invalid')
    if (typeof opt.priority !== 'string') {
      priorityError.code = 'ERR_INVALID_ARG_TYPE'
      throw priorityError;
    }

    var priority = opt.priority.toLowerCase()

    switch (priority) {
      case 'low':
        str += '; Priority=Low'
        break
      case 'medium':
        str += '; Priority=Medium'
        break
      case 'high':
        str += '; Priority=High'
        break
      default:
        priorityError.code = 'ERR_INVALID_ARG_VALUE'
        throw priorityError;
    }
  }

  if (opt.sameSite) {
    var sameSite = typeof opt.sameSite === 'string'
      ? opt.sameSite.toLowerCase() : opt.sameSite;

    switch (sameSite) {
      case true:
        str += '; SameSite=Strict';
        break;
      case 'lax':
        str += '; SameSite=Lax';
        break;
      case 'strict':
        str += '; SameSite=Strict';
        break;
      case 'none':
        str += '; SameSite=None';
        break;
      default:
        var sameSiteError = new TypeError('option sameSite is invalid')
        sameSiteError.code = typeof opt.sameSite === 'string'
          ? 'ERR_INVALID_ARG_VALUE'
          : 'ERR_INVALID_ARG_TYPE'
        throw sameSiteError;
    }
  }

  return str;
}

/**
 * URL-decode string value. Optimized to skip native call when no %.
 *
 * @param {string} str
 * @returns {string}
 */

function decode (str) {
  return str.indexOf('%') !== -1
    ? decodeURIComponent(str)
    : str
}

/**
 * URL-encode value.
 *
 * @param {string} val
 * @returns {string}
 */

function encode (val) {
  return encodeURIComponent(val)
}

/**
 * Determine if value is a Date.
 *
 * @param {*} val
 * @private
 */

function isDate (val) {
  return __toString.call(val) === '[object Date]' ||
    val instanceof Date
}

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */

function tryDecode(str, decode) {
  try {
    return decode(str);
  } catch (e) {
    return str;
  }
}
