
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

    if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge);
    if (opt.domain) pairs.push('Domain=' + opt.domain);
    if (opt.path) pairs.push('Path=' + opt.path);
    if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
    if (opt.httpOnly) pairs.push('HttpOnly');
    if (opt.secure) pairs.push('Secure');

    return pairs.join('; ');
};

var regexTrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
var trim = function (str){
    if(str.trim){
        return str.trim();
    }
    return str.replace(regexTrim, "");
}

/// Parse the given cookie header string into an object
/// The object has the various cookies as keys(names) => values
/// @param {String} str
/// @return {Object}
var parse = function(str, opt) {
    opt = opt || {};
    var obj = {}
    var pairs = str.split(/[;,] */);
    var dec = opt.decode || decode;

    var len = pairs.length;
    for(var i = 0; i < len ; i++){
        var pair = pairs[i];
        var eq_idx = pair.indexOf('=')

        // skip things that don't look like key=value
        if (eq_idx < 0) {
            continue;
        }

        var key = trim(pair.substr(0, eq_idx));
        var val = trim(pair.substr(++eq_idx, pair.length));

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
    };

    return obj;
};

var encode = encodeURIComponent;
var decode = decodeURIComponent;

module.exports.serialize = serialize;
module.exports.parse = parse;
