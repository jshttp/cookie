
/// Serialize the a name value pair into a cookie string suitable for
/// http headers. An optional options object specified cookie parameters
///
/// serialize('foo', 'bar', { httpOnly: true })
///   => "foo=bar; httpOnly"
///
/// @param {String} name
/// @param {String} val
/// @param {Object} options
/// @return {String}
function serialize(name, val, opt) {
  var enc = (opt && opt.encode) || encode,
      ret,
      val;

  ret = name;
  ret += '=';
  ret += enc(val);

  if (opt) {
    if (opt.maxAge != null) {
      var maxAge = opt.maxAge - 0;
      if (isNaN(maxAge))
        throw new Error('maxAge should be a Number');
      ret += '; Max-Age=';
      ret += maxAge;
    }
    if (val = opt.domain) {
      ret += '; Domain=';
      ret += val;
    }
    if (val = opt.path) {
      ret += '; Path=';
      ret += val;
    }
    if (val = opt.expires) {
      ret += '; Expires=';
      ret += val.toUTCString();
    }
    if (opt.httpOnly)
      ret += '; HttpOnly';
    if (opt.secure)
      ret += '; Secure';
  }

  return ret;
}

/// Parse the given cookie header string into an object
/// The object has the various cookies as keys(names) => values
/// @param {String} str
/// @return {Object}
var RE_SEP = /; */;
function parse(str, opt) {
  var pairs = str.split(RE_SEP),
      dec = (opt && opt.decode) || decode,
      obj = {},
      pair,
      key,
      val,
      eq;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    eq = pair.indexOf('=');

    if (~eq) {
      key = pair.substring(0, eq);
      val = pair.substring(++eq);

      if (val[0] === '"')
        val = val.slice(1, -1);

      if (obj[key] === undefined) {
        if (~val.indexOf('%'))
          obj[key] = tryDecode(val, dec);
        else
          obj[key] = val;
      }
    }
  }

  return obj;
}

function tryDecode(v, dec) {
  var ret;
  try {
    ret = dec(v);
  } catch (e) {
    ret = v;
  }
  return ret;
}

var decode = decodeURIComponent,
    encode = encodeURIComponent;

exports.serialize = serialize;
exports.parse = parse;
