
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
var serialize = function(name, val, opt){
    opt = opt || {};
    var enc = opt.encode || encode;
    var pairs = [name + '=' + enc(val)];

    var maxAge = null != opt.maxAge ? opt.maxAge : opt.MaxAge;
    if (null != maxAge) {
        maxAge = maxAge - 0;
        if (isNaN(maxAge)) throw new Error('maxAge should be a Number');
        pairs.push('Max-Age=' + maxAge);
    }

    var domain = opt.domain || opt.Domain;
    var path = opt.path || opt.Path;
    var expires = opt.expires || opt.Expires;
    var httpOnly = opt.httpOnly || opt.HttpOnly;
    var secure = opt.secure || opt.Secure;

    if (domain) pairs.push('Domain=' + domain);
    if (path) pairs.push('Path=' + path);
    if (expires) pairs.push('Expires=' + expires.toUTCString());
    if (httpOnly) pairs.push('HttpOnly');
    if (secure) pairs.push('Secure');

    return pairs.join('; ');
};

/// Parse the given cookie header string into an object
/// The object has the various cookies as keys(names) => values
/// @param {String} str
/// @return {Object}
var parse = function(str, opt) {
    opt = opt || {};
    var obj = {}
    var pairs = str.split(/; */);
    var dec = opt.decode || decode;

    pairs.forEach(function(pair) {
        var eq_idx = pair.indexOf('=');

        // skip things that don't look like key=value unless they're Secure or httpOnly
        if (eq_idx < 0) {
            if (pair.match(/^secure(;|$)/i))
                obj['secure'] = true;
            else if (pair.match(/^httponly(;|$)/i))
                obj['httpOnly'] = true;

            return;
        }

        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();

        // quoted values
        if ('"' == val[0]) {
            val = val.slice(1, -1);
        }

        // only assign once
        if (undefined == obj[key]) {
            try {
                obj[key] = dec(val);
            } catch (e) {
                obj[key] = val;
            }
        }
    });

    return obj;
};

var encode = encodeURIComponent;
var decode = decodeURIComponent;

module.exports.serialize = serialize;
module.exports.parse = parse;
