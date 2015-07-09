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
    throw new TypeError('argument str must be a string');
  }

  var obj = {};
  var opt = typeof options === 'object' ? options : {};
  var pairs = str.split(/; */);
  var dec = typeof opt.decode === 'function' ? opt.decode : decode;

  pairs.forEach(function(pair) {
    var eq_idx = pair.indexOf('=');

    // skip things that don't look like key=value
    if (eq_idx < 0) {
      return;
    }

    var key = pair.substr(0, eq_idx).trim();
    var val = pair.substr(++eq_idx, pair.length).trim();

    // quoted values
    if ('"' == val[0]) {
      val = val.slice(1, -1);
    }

    // only assign once
    if (!obj.hasOwnProperty(key)) {
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
  if (typeof name !== 'string') {
    throw new Error('argument name must be a string');
  }
  if (typeof val !== 'string') {
    throw new Error('argument val must be a string');
  }

  var opt = typeof options === 'object' ? options : {};
  var enc = typeof opt.encode === 'function' ? opt.encode : encode;
  var pairs = [name + '=' + enc(val)];

  (typeof opt.maxAge === 'number' || opt.maxAge === '0' || ~~opt.maxAge !== 0)
    && pairs.push('Max-Age=' + ~~opt.maxAge);
  typeof opt.domain === 'string' && pairs.push('Domain=' + opt.domain);
  typeof opt.path === 'string' && pairs.push('Path=' + opt.path);
  Date.parse(opt.expires)
    && pairs.push('Expires=' + (new Date(opt.expires)).toUTCString());
  opt.httpOnly && pairs.push('HttpOnly');
  opt.secure && pairs.push('Secure');

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
