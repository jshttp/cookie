/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * MIT Licensed
 */

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

var decode = decodeURIComponent;
var encode = encodeURIComponent;

/**
 * RegExp to match cookie-name in RFC 6265 sec 4.1.1
 *
 * cookie-name = token (as defined in RFC 2616 sec 2.2)
 *
 * token = 1*<any CHAR except CTLs or separators>
 *
 * Character classes:
 *  \x21: !
 *  \x23-\x27: # to ' (excluding " which is \x22).
 *  \x2A-\x2B: * and +.
 *  \x2D-\x2E: - and ..
 *  \x30-\x39: 0 to 9 (digits).
 *  \x41-\x5A: A to Z (uppercase letters).
 *  \x5E-\x7A: ^ to z (excluding backslash and a few separators).
 *  \x7C: |
 *  \x7E: ~.
 *
 * separators     = "(" | ")" | "<" | ">" | "@"
 *                | "," | ";" | ":" | "\" | <">
 *                | "/" | "[" | "]" | "?" | "="
 *                | "{" | "}" | SP | HT
 * CTLs defined as:
 *  Octets 0-31 (ASCII values \x00 to \x1F)
 *  DEL (ASCII value 127, \x7F)
 */

var cookieNameRegExp =
  /^[\x21\x23-\x27\x2A-\x2B\x2D-\x2E\x30-\x39\x41-\x5A\x5E-\x7A\x7C\x7E]+$/;

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {string}
 * @public
 */

function parse(str, options) {
  var obj = {}
  var opt = options || {};
  var pairs = str.split(/; */);
  var dec = opt.decode || decode;

  pairs.forEach(function(pair) {
    var eq_idx = pair.indexOf('=')

    // skip things that don't look like key=value
    if (eq_idx < 0) {
      return;
    }

    var key = pair.substr(0, eq_idx).trim()
    var val = pair.substr(++eq_idx, pair.length).trim();

    // quoted values
    if ('"' == val[0]) {
      val = val.slice(1, -1);
    }

    // only assign once
    if (undefined == obj[key]) {
      obj[key] = tryDecode(val, dec);
    }
  });

  return obj;
}

/**
 * Serialize data into a cookie header.
 *
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
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

  // NES: Added check for valid cookie name to avoid vulnerabilities
  if (!cookieNameRegExp.test(name)) {
    throw new TypeError('cookie name contains invalid characters');
  }

  var pairs = [name + '=' + enc(val)];

  if (null != opt.maxAge) {
    var maxAge = opt.maxAge - 0;
    if (isNaN(maxAge)) throw new Error('maxAge should be a Number');
    pairs.push('Max-Age=' + maxAge);
  }

  if (opt.domain) pairs.push('Domain=' + opt.domain);
  if (opt.path) pairs.push('Path=' + opt.path);
  if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
  if (opt.httpOnly) pairs.push('HttpOnly');
  if (opt.secure) pairs.push('Secure');

  return pairs.join('; ');
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
