# cookie

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Build Status][ci-image]][ci-url]
[![Coverage Status][coverage-image]][coverage-url]

Basic HTTP cookie parser and serializer for HTTP servers.

## Installation

```sh
$ npm install cookie
```

## API

```js
const cookie = require("cookie");
// import * as cookie from 'cookie';
```

### cookie.parse(str, options)

Parse an HTTP `Cookie` header string and returning an object of all cookie name-value pairs.
The `str` argument is the string representing a `Cookie` header value and `options` is an
optional object containing additional parsing options.

```js
const cookies = cookie.parse("foo=bar; equation=E%3Dmc%5E2");
// { foo: 'bar', equation: 'E=mc^2' }
```

#### Options

`cookie.parse` accepts these properties in the options object.

##### decode

Specifies a function that will be used to decode a [cookie-value](https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1).
Since the value of a cookie has a limited character set (and must be a simple string), this function can be used to decode
a previously-encoded cookie value into a JavaScript string.

The default function is the global `decodeURIComponent`, wrapped in a `try..catch`. If an error
is thrown it will return the cookie's original value. If you provide your own encode/decode
scheme you must ensure errors are appropriately handled.

### cookie.stringify(obj, options)

Stringifies an object into an HTTP `Cookie` header.

```js
const cookieHeader = cookie.stringify({ a: "foo", b: "bar" });
// a=foo; b=bar
```

#### Options

`cookie.stringify` accepts these properties in the options object.

##### encode

Specifies a function that will be used to encode a [cookie-value](https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1).
Since value of a cookie has a limited character set (and must be a simple string), this function can be used to encode
a value into a string suited for a cookie's value, and should mirror `decode` when parsing.

The default function is the global `encodeURIComponent`.

### cookie.serialize(name, value, options)

Serialize a cookie name-value pair into a `Set-Cookie` header string. The `name` argument is the
name for the cookie, the `value` argument is the value to set the cookie to, and the `options`
argument is an optional object containing additional serialization options.

```js
const setCookie = cookie.serialize("foo", "bar");
// foo=bar
```

#### Options

`cookie.serialize` accepts these properties in the options object.

##### encode

Specifies a function that will be used to encode a [cookie-value](https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1).
Since value of a cookie has a limited character set (and must be a simple string), this function can be used to encode
a value into a string suited for a cookie's value, and should mirror `decode` when parsing.

The default function is the global `encodeURIComponent`.

##### maxAge

Specifies the `number` (in seconds) to be the value for the [`Max-Age` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.2).

The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and
`maxAge` are set, then `maxAge` takes precedence, but it is possible not all clients by obey this,
so if both are set, they should point to the same date and time.

##### expires

Specifies the `Date` object to be the value for the [`Expires` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.1).
When no expiration is set, clients consider this a "non-persistent cookie" and delete it when the current session is over.

The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and
`maxAge` are set, then `maxAge` takes precedence, but it is possible not all clients by obey this,
so if both are set, they should point to the same date and time.

##### domain

Specifies the value for the [`Domain` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.3).
When no domain is set, clients consider the cookie to apply to the current domain only.

##### path

Specifies the value for the [`Path` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.4).
When no path is set, the path is considered the ["default path"](https://tools.ietf.org/html/rfc6265#section-5.1.4).

##### httpOnly

Enables the [`HttpOnly` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.6).
When enabled, clients will not allow client-side JavaScript to see the cookie in `document.cookie`.

##### secure

Enables the [`Secure` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.5).
When enabled, clients will only send the cookie back if the browser has an HTTPS connection.

##### partitioned

Enables the [`Partitioned` `Set-Cookie` attribute](https://tools.ietf.org/html/draft-cutler-httpbis-partitioned-cookies/).
When enabled, clients will only send the cookie back when the current domain _and_ top-level domain matches.

This is an attribute that has not yet been fully standardized, and may change in the future.
This also means clients may ignore this attribute until they understand it. More information
about can be found in [the proposal](https://github.com/privacycg/CHIPS).

##### priority

Specifies the value for the [`Priority` `Set-Cookie` attribute](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).

- `'low'` will set the `Priority` attribute to `Low`.
- `'medium'` will set the `Priority` attribute to `Medium`, the default priority when not set.
- `'high'` will set the `Priority` attribute to `High`.

More information about priority levels can be found in [the specification](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).

##### sameSite

Specifies the value for the [`SameSite` `Set-Cookie` attribute](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).

- `true` will set the `SameSite` attribute to `Strict` for strict same site enforcement.
- `'lax'` will set the `SameSite` attribute to `Lax` for lax same site enforcement.
- `'none'` will set the `SameSite` attribute to `None` for an explicit cross-site cookie.
- `'strict'` will set the `SameSite` attribute to `Strict` for strict same site enforcement.

More information about enforcement levels can be found in [the specification](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).

## Example

The following example uses this module in conjunction with the Node.js core HTTP server
to prompt a user for their name and display it back on future visits.

```js
var cookie = require("cookie");
var escapeHtml = require("escape-html");
var http = require("http");
var url = require("url");

function onRequest(req, res) {
  // Parse the query string
  var query = url.parse(req.url, true, true).query;

  if (query && query.name) {
    // Set a new cookie with the name
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("name", String(query.name), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 1 week
      }),
    );

    // Redirect back after setting cookie
    res.statusCode = 302;
    res.setHeader("Location", req.headers.referer || "/");
    res.end();
    return;
  }

  // Parse the cookies on the request
  var cookies = cookie.parse(req.headers.cookie || "");

  // Get the visitor name set in the cookie
  var name = cookies.name;

  res.setHeader("Content-Type", "text/html; charset=UTF-8");

  if (name) {
    res.write("<p>Welcome back, <b>" + escapeHtml(name) + "</b>!</p>");
  } else {
    res.write("<p>Hello, new visitor!</p>");
  }

  res.write('<form method="GET">');
  res.write(
    '<input placeholder="enter your name" name="name"> <input type="submit" value="Set Name">',
  );
  res.end("</form>");
}

http.createServer(onRequest).listen(3000);
```

## Testing

```sh
npm test
```

## Benchmark

```sh
npm run bench
```

```
 ✓ src/parse.bench.ts > parse 7936ms
     name                    hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · simple       10,658,626.81  0.0000  0.2424  0.0001  0.0001  0.0001  0.0002  0.0003  ±0.58%  5329314
   · decode        4,736,137.96  0.0001  0.2641  0.0002  0.0002  0.0003  0.0003  0.0004  ±0.29%  2368069
   · unquote       9,193,612.84  0.0000  6.5421  0.0001  0.0001  0.0002  0.0002  0.0005  ±3.63%  4596807
   · duplicates    2,780,340.28  0.0003  0.0515  0.0004  0.0004  0.0005  0.0005  0.0007  ±0.08%  1390171
   · 10 cookies      934,302.88  0.0009  0.2575  0.0011  0.0011  0.0012  0.0013  0.0035  ±0.44%   467152
   · 100 cookies      75,369.15  0.0122  0.2861  0.0133  0.0132  0.0154  0.0168  0.1610  ±0.47%    37685

 ✓ src/parse.bench.ts > parse top-sites 31272ms
     name                                  hz     min     max    mean     p75     p99    p995    p999     rme   samples
   · parse accounts.google.com   8,479,359.24  0.0000  0.0434  0.0001  0.0001  0.0002  0.0002  0.0002  ±0.05%   4239680
   · parse apple.com             9,116,333.54  0.0000  9.2493  0.0001  0.0001  0.0001  0.0002  0.0002  ±3.71%   4558167
   · parse cloudflare.com        1,602,243.83  0.0005  0.2170  0.0006  0.0006  0.0007  0.0008  0.0010  ±0.22%    801122
   · parse docs.google.com       8,584,332.87  0.0000  0.0699  0.0001  0.0001  0.0002  0.0002  0.0002  ±0.08%   4292167
   · parse drive.google.com      8,569,095.74  0.0000  0.0694  0.0001  0.0001  0.0002  0.0002  0.0002  ±0.07%   4284548
   · parse github.com            1,200,864.67  0.0007  0.0495  0.0008  0.0008  0.0010  0.0010  0.0011  ±0.07%    600433
   · parse linkedin.com          1,788,319.28  0.0004  0.3466  0.0006  0.0005  0.0007  0.0007  0.0012  ±0.53%    894160
   · parse maps.google.com       8,835,185.81  0.0000  0.2126  0.0001  0.0001  0.0002  0.0002  0.0003  ±0.37%   4417593
   · parse play.google.com       8,969,913.82  0.0000  0.1848  0.0001  0.0001  0.0002  0.0002  0.0003  ±0.27%   4484957
   · parse policies.google.com   8,903,011.61  0.0000  0.2566  0.0001  0.0001  0.0002  0.0002  0.0003  ±0.40%   4451506
   · parse support.google.com    4,826,530.88  0.0001  0.2934  0.0002  0.0002  0.0003  0.0003  0.0005  ±0.72%   2413266
   · parse t.me                  8,891,334.81  0.0000  0.0925  0.0001  0.0001  0.0002  0.0002  0.0002  ±0.08%   4445668
   · parse vimeo.com             5,001,952.44  0.0001  0.3573  0.0002  0.0002  0.0003  0.0003  0.0005  ±0.62%   2500977
   · parse wa.me                 8,637,976.12  0.0000  0.2800  0.0001  0.0001  0.0002  0.0002  0.0003  ±0.32%   4318989
   · parse whatsapp.com          3,407,389.60  0.0002  0.1511  0.0003  0.0003  0.0004  0.0004  0.0005  ±0.08%   1703695
   · parse www.google.com        4,888,971.53  0.0001  0.2915  0.0002  0.0002  0.0003  0.0003  0.0006  ±0.72%   2444486
   · parse www.weebly.com          797,764.99  0.0011  0.2732  0.0013  0.0013  0.0015  0.0015  0.0037  ±0.40%    398883
   · parse youtu.be              1,113,776.87  0.0007  0.3111  0.0009  0.0009  0.0010  0.0011  0.0015  ±0.39%    556889
   · parse youtube.com           1,117,095.18  0.0007  0.3611  0.0009  0.0009  0.0010  0.0011  0.0017  ±0.47%    558548
   · parse example.com          25,051,083.67  0.0000  0.1017  0.0000  0.0000  0.0000  0.0001  0.0002  ±0.09%  12525599
```

## References

- [RFC 6265: HTTP State Management Mechanism](https://tools.ietf.org/html/rfc6265)
- [Same-site Cookies](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7)

## License

[MIT](LICENSE)

[ci-image]: https://img.shields.io/github/actions/workflow/status/jshttp/cookie/ci.yml
[ci-url]: https://github.com/jshttp/cookie/actions/workflows/ci.yml?query=branch%3Amaster
[coverage-image]: https://img.shields.io/codecov/c/github/jshttp/cookie/master
[coverage-url]: https://app.codecov.io/gh/jshttp/cookie
[npm-downloads-image]: https://img.shields.io/npm/dm/cookie
[npm-url]: https://npmjs.org/package/cookie
[npm-version-image]: https://img.shields.io/npm/v/cookie
