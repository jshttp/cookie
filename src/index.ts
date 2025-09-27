/**
 * RegExp to match cookie-name in RFC 6265 sec 4.1.1
 * This refers out to the obsoleted definition of token in RFC 2616 sec 2.2
 * which has been replaced by the token definition in RFC 7230 appendix B.
 *
 * cookie-name       = token
 * token             = 1*tchar
 * tchar             = "!" / "#" / "$" / "%" / "&" / "'" /
 *                     "*" / "+" / "-" / "." / "^" / "_" /
 *                     "`" / "|" / "~" / DIGIT / ALPHA
 *
 * Note: Allowing more characters - https://github.com/jshttp/cookie/issues/191
 * Allow same range as cookie value, except `=`, which delimits end of name.
 */
const cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;

/**
 * RegExp to match cookie-value in RFC 6265 sec 4.1.1
 *
 * cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
 * cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
 *                     ; US-ASCII characters excluding CTLs,
 *                     ; whitespace DQUOTE, comma, semicolon,
 *                     ; and backslash
 *
 * Allowing more characters: https://github.com/jshttp/cookie/issues/191
 * Comma, backslash, and DQUOTE are not part of the parsing algorithm.
 */
const cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;

/**
 * RegExp to match domain-value in RFC 6265 sec 4.1.1
 *
 * domain-value      = <subdomain>
 *                     ; defined in [RFC1034], Section 3.5, as
 *                     ; enhanced by [RFC1123], Section 2.1
 * <subdomain>       = <label> | <subdomain> "." <label>
 * <label>           = <let-dig> [ [ <ldh-str> ] <let-dig> ]
 *                     Labels must be 63 characters or less.
 *                     'let-dig' not 'letter' in the first char, per RFC1123
 * <ldh-str>         = <let-dig-hyp> | <let-dig-hyp> <ldh-str>
 * <let-dig-hyp>     = <let-dig> | "-"
 * <let-dig>         = <letter> | <digit>
 * <letter>          = any one of the 52 alphabetic characters A through Z in
 *                     upper case and a through z in lower case
 * <digit>           = any one of the ten digits 0 through 9
 *
 * Keep support for leading dot: https://github.com/jshttp/cookie/issues/173
 *
 * > (Note that a leading %x2E ("."), if present, is ignored even though that
 * character is not permitted, but a trailing %x2E ("."), if present, will
 * cause the user agent to ignore the attribute.)
 */
const domainValueRegExp =
  /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;

/**
 * RegExp to match path-value in RFC 6265 sec 4.1.1
 *
 * path-value        = <any CHAR except CTLs or ";">
 * CHAR              = %x01-7F
 *                     ; defined in RFC 5234 appendix B.1
 */
const pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;

/**
 * RegExp to match max-age-value in RFC 6265 sec 5.6.2
 */
const maxAgeRegExp = /^-?\d+$/;

const __toString = Object.prototype.toString;

const NullObject = /* @__PURE__ */ (() => {
  const C = function () {};
  C.prototype = Object.create(null);
  return C;
})() as unknown as { new (): any };

/**
 * Parse options.
 */
export interface ParseOptions {
  /**
   * Specifies a function that will be used to decode a [cookie-value](https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1).
   * Since the value of a cookie has a limited character set (and must be a simple string), this function can be used to decode
   * a previously-encoded cookie value into a JavaScript string.
   *
   * The default function is the global `decodeURIComponent`, wrapped in a `try..catch`. If an error
   * is thrown it will return the cookie's original value. If you provide your own encode/decode
   * scheme you must ensure errors are appropriately handled.
   *
   * @default decode
   */
  decode?: (str: string) => string | undefined;
}

/**
 * Cookies object.
 */
export type Cookies = Record<string, string | undefined>;

/**
 * Parse a `Cookie` header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 */
export function parseCookie(str: string, options?: ParseOptions): Cookies {
  const obj: Cookies = new NullObject();
  const len = str.length;
  // RFC 6265 sec 4.1.1, RFC 2616 2.2 defines a cookie name consists of one char minimum, plus '='.
  if (len < 2) return obj;

  const dec = options?.decode || decode;
  let index = 0;

  do {
    const eqIdx = eqIndex(str, index, len);
    if (eqIdx === -1) break; // No more cookie pairs.

    const endIdx = endIndex(str, index, len);

    if (eqIdx > endIdx) {
      // backtrack on prior semicolon
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }

    const key = valueSlice(str, index, eqIdx);

    // only assign once
    if (obj[key] === undefined) {
      obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
    }

    index = endIdx + 1;
  } while (index < len);

  return obj;
}

export interface StringifyOptions {
  /**
   * Specifies a function that will be used to encode a [cookie-value](https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1).
   * Since value of a cookie has a limited character set (and must be a simple string), this function can be used to encode
   * a value into a string suited for a cookie's value, and should mirror `decode` when parsing.
   *
   * @default encodeURIComponent
   */
  encode?: (str: string) => string;
}

/**
 * Stringifies an object into an HTTP `Cookie` header.
 */
export function stringifyCookie(
  cookie: Cookies,
  options?: StringifyOptions,
): string {
  const enc = options?.encode || encodeURIComponent;
  const cookieStrings: string[] = [];

  for (const name of Object.keys(cookie)) {
    const val = cookie[name];
    if (val === undefined) continue;

    if (!cookieNameRegExp.test(name)) {
      throw new TypeError(`cookie name is invalid: ${name}`);
    }

    const value = enc(val);

    if (!cookieValueRegExp.test(value)) {
      throw new TypeError(`cookie val is invalid: ${val}`);
    }

    cookieStrings.push(`${name}=${value}`);
  }

  return cookieStrings.join("; ");
}

/**
 * Set-Cookie object.
 */
export interface SetCookie {
  /**
   * Specifies the name of the cookie.
   */
  name: string;
  /**
   * Specifies the string to be the value for the cookie.
   */
  value: string | undefined;
  /**
   * Specifies the `number` (in seconds) to be the value for the [`Max-Age` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.2).
   *
   * The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and
   * `maxAge` are set, then `maxAge` takes precedence, but it is possible not all clients by obey this,
   * so if both are set, they should point to the same date and time.
   */
  maxAge?: number;
  /**
   * Specifies the `Date` object to be the value for the [`Expires` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.1).
   * When no expiration is set, clients consider this a "non-persistent cookie" and delete it when the current session is over.
   *
   * The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and
   * `maxAge` are set, then `maxAge` takes precedence, but it is possible not all clients by obey this,
   * so if both are set, they should point to the same date and time.
   */
  expires?: Date;
  /**
   * Specifies the value for the [`Domain` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.3).
   * When no domain is set, clients consider the cookie to apply to the current domain only.
   */
  domain?: string;
  /**
   * Specifies the value for the [`Path` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.4).
   * When no path is set, the path is considered the ["default path"](https://tools.ietf.org/html/rfc6265#section-5.1.4).
   */
  path?: string;
  /**
   * Enables the [`HttpOnly` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.6).
   * When enabled, clients will not allow client-side JavaScript to see the cookie in `document.cookie`.
   */
  httpOnly?: boolean;
  /**
   * Enables the [`Secure` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.5).
   * When enabled, clients will only send the cookie back if the browser has an HTTPS connection.
   */
  secure?: boolean;
  /**
   * Enables the [`Partitioned` `Set-Cookie` attribute](https://tools.ietf.org/html/draft-cutler-httpbis-partitioned-cookies/).
   * When enabled, clients will only send the cookie back when the current domain _and_ top-level domain matches.
   *
   * This is an attribute that has not yet been fully standardized, and may change in the future.
   * This also means clients may ignore this attribute until they understand it. More information
   * about can be found in [the proposal](https://github.com/privacycg/CHIPS).
   */
  partitioned?: boolean;
  /**
   * Specifies the value for the [`Priority` `Set-Cookie` attribute](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).
   *
   * - `'low'` will set the `Priority` attribute to `Low`.
   * - `'medium'` will set the `Priority` attribute to `Medium`, the default priority when not set.
   * - `'high'` will set the `Priority` attribute to `High`.
   *
   * More information about priority levels can be found in [the specification](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).
   */
  priority?: "low" | "medium" | "high";
  /**
   * Specifies the value for the [`SameSite` `Set-Cookie` attribute](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).
   *
   * - `true` will set the `SameSite` attribute to `Strict` for strict same site enforcement.
   * - `'lax'` will set the `SameSite` attribute to `Lax` for lax same site enforcement.
   * - `'none'` will set the `SameSite` attribute to `None` for an explicit cross-site cookie.
   * - `'strict'` will set the `SameSite` attribute to `Strict` for strict same site enforcement.
   *
   * More information about enforcement levels can be found in [the specification](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).
   */
  sameSite?: boolean | "lax" | "strict" | "none";
}

/**
 * Backward compatibility serialize options.
 */
export type SerializeOptions = StringifyOptions &
  Omit<SetCookie, "name" | "value">;

/**
 * Serialize data into a cookie header.
 *
 * Serialize a name value pair into a cookie string suitable for
 * http headers. An optional options object specifies cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 */
export function stringifySetCookie(
  cookie: SetCookie,
  options?: StringifyOptions,
): string;
export function stringifySetCookie(
  name: string,
  val: string,
  options?: SerializeOptions,
): string;
export function stringifySetCookie(
  _name: string | SetCookie,
  _val?: string | StringifyOptions,
  _opts?: SerializeOptions,
): string {
  const cookie =
    typeof _name === "object"
      ? _name
      : { name: _name, value: String(_val), ..._opts };
  const options = typeof _val === "object" ? _val : _opts;
  const enc = options?.encode || encodeURIComponent;

  if (!cookieNameRegExp.test(cookie.name)) {
    throw new TypeError(`argument name is invalid: ${cookie.name}`);
  }

  const value = cookie.value ? enc(cookie.value) : "";

  if (!cookieValueRegExp.test(value)) {
    throw new TypeError(`argument val is invalid: ${cookie.value}`);
  }

  let str = cookie.name + "=" + value;

  if (cookie.maxAge !== undefined) {
    if (!Number.isInteger(cookie.maxAge)) {
      throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
    }

    str += "; Max-Age=" + cookie.maxAge;
  }

  if (cookie.domain) {
    if (!domainValueRegExp.test(cookie.domain)) {
      throw new TypeError(`option domain is invalid: ${cookie.domain}`);
    }

    str += "; Domain=" + cookie.domain;
  }

  if (cookie.path) {
    if (!pathValueRegExp.test(cookie.path)) {
      throw new TypeError(`option path is invalid: ${cookie.path}`);
    }

    str += "; Path=" + cookie.path;
  }

  if (cookie.expires) {
    if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
      throw new TypeError(`option expires is invalid: ${cookie.expires}`);
    }

    str += "; Expires=" + cookie.expires.toUTCString();
  }

  if (cookie.httpOnly) {
    str += "; HttpOnly";
  }

  if (cookie.secure) {
    str += "; Secure";
  }

  if (cookie.partitioned) {
    str += "; Partitioned";
  }

  if (cookie.priority) {
    const priority =
      typeof cookie.priority === "string"
        ? cookie.priority.toLowerCase()
        : undefined;
    switch (priority) {
      case "low":
        str += "; Priority=Low";
        break;
      case "medium":
        str += "; Priority=Medium";
        break;
      case "high":
        str += "; Priority=High";
        break;
      default:
        throw new TypeError(`option priority is invalid: ${cookie.priority}`);
    }
  }

  if (cookie.sameSite) {
    const sameSite =
      typeof cookie.sameSite === "string"
        ? cookie.sameSite.toLowerCase()
        : cookie.sameSite;
    switch (sameSite) {
      case true:
      case "strict":
        str += "; SameSite=Strict";
        break;
      case "lax":
        str += "; SameSite=Lax";
        break;
      case "none":
        str += "; SameSite=None";
        break;
      default:
        throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
    }
  }

  return str;
}

/**
 * Deserialize a `Set-Cookie` header into an object.
 *
 * deserialize('foo=bar; httpOnly')
 *   => { name: 'foo', value: 'bar', httpOnly: true }
 */
export function parseSetCookie(str: string, options?: ParseOptions): SetCookie {
  const dec = options?.decode || decode;
  const len = str.length;
  const endIdx = endIndex(str, 0, len);
  const eqIdx = eqIndex(str, 0, endIdx);
  const setCookie: SetCookie =
    eqIdx === -1
      ? { name: "", value: dec(valueSlice(str, 0, endIdx)) }
      : {
          name: valueSlice(str, 0, eqIdx),
          value: dec(valueSlice(str, eqIdx + 1, endIdx)),
        };

  let index = endIdx + 1;
  while (index < len) {
    const endIdx = endIndex(str, index, len);
    const eqIdx = eqIndex(str, index, endIdx);
    const attr =
      eqIdx === -1
        ? valueSlice(str, index, endIdx)
        : valueSlice(str, index, eqIdx);
    const val = eqIdx === -1 ? undefined : valueSlice(str, eqIdx + 1, endIdx);

    switch (attr.toLowerCase()) {
      case "httponly":
        setCookie.httpOnly = true;
        break;
      case "secure":
        setCookie.secure = true;
        break;
      case "partitioned":
        setCookie.partitioned = true;
        break;
      case "domain":
        setCookie.domain = val;
        break;
      case "path":
        setCookie.path = val;
        break;
      case "max-age":
        if (val && maxAgeRegExp.test(val)) setCookie.maxAge = Number(val);
        break;
      case "expires":
        if (!val) break;
        const date = new Date(val);
        if (Number.isFinite(date.valueOf())) setCookie.expires = date;
        break;
      case "priority":
        if (!val) break;
        const priority = val.toLowerCase();
        if (
          priority === "low" ||
          priority === "medium" ||
          priority === "high"
        ) {
          setCookie.priority = priority;
        }
        break;
      case "samesite":
        if (!val) break;
        const sameSite = val.toLowerCase();
        if (
          sameSite === "lax" ||
          sameSite === "strict" ||
          sameSite === "none"
        ) {
          setCookie.sameSite = sameSite;
        }
        break;
    }

    index = endIdx + 1;
  }

  return setCookie;
}

/**
 * Find the `;` character between `min` and `len` in str.
 */
function endIndex(str: string, min: number, len: number) {
  const index = str.indexOf(";", min);
  return index === -1 ? len : index;
}

/**
 * Find the `=` character between `min` and `max` in str.
 */
function eqIndex(str: string, min: number, max: number) {
  const index = str.indexOf("=", min);
  return index < max ? index : -1;
}

/**
 * Slice out a value between startPod to max.
 */
function valueSlice(str: string, min: number, max: number) {
  let start = min;
  let end = max;

  do {
    const code = str.charCodeAt(start);
    if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) break;
  } while (++start < end);

  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) break;
    end--;
  }

  return str.slice(start, end);
}

/**
 * URL-decode string value. Optimized to skip native call when no %.
 */
function decode(str: string): string {
  if (str.indexOf("%") === -1) return str;

  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

/**
 * Determine if value is a Date.
 */
function isDate(val: any): val is Date {
  return __toString.call(val) === "[object Date]";
}

/**
 * Backward compatibility exports.
 */
export { stringifySetCookie as serialize, parseCookie as parse };
