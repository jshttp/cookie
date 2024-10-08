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
 */
const cookieNameRegExp = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/**
 * RegExp to match cookie-value in RFC 6265 sec 4.1.1
 *
 * cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
 * cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
 *                     ; US-ASCII characters excluding CTLs,
 *                     ; whitespace DQUOTE, comma, semicolon,
 *                     ; and backslash
 */
const cookieValueRegExp =
  /^("?)[\u0021\u0023-\u002B\u002D-\u003A\u003C-\u005B\u005D-\u007E]*\1$/;

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
   * Specifies a function that will be used to decode a cookie's value. Since
   * the value of a cookie has a limited character set (and must be a simple
   * string), this function can be used to decode a previously-encoded cookie
   * value into a JavaScript string.
   *
   * Note: if an error is thrown from this function, the original, non-decoded
   * cookie value will be returned as the cookie's value.
   *
   * @default decodeURIComponent
   */
  decode?: (str: string) => string | undefined;
}

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 */
export function parse(
  str: string,
  options?: ParseOptions,
): Record<string, string | undefined> {
  const obj: Record<string, string | undefined> = new NullObject();
  const len = str.length;
  // RFC 6265 sec 4.1.1, RFC 2616 2.2 defines a cookie name consists of one char minimum, plus '='.
  if (len < 2) return obj;

  const dec = options?.decode || decode;
  let index = 0;

  do {
    const eqIdx = str.indexOf("=", index);
    if (eqIdx === -1) break; // No more cookie pairs.

    const colonIdx = str.indexOf(";", index);
    const endIdx = colonIdx === -1 ? len : colonIdx;

    if (eqIdx > endIdx) {
      // backtrack on prior semicolon
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }

    const keyStartIdx = startIndex(str, index, eqIdx);
    const keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
    const key = str.slice(keyStartIdx, keyEndIdx);

    // only assign once
    if (obj[key] === undefined) {
      let valStartIdx = startIndex(str, eqIdx + 1, endIdx);
      let valEndIdx = endIndex(str, endIdx, valStartIdx);

      const value = dec(str.slice(valStartIdx, valEndIdx));
      obj[key] = value;
    }

    index = endIdx + 1;
  } while (index < len);

  return obj;
}

function startIndex(str: string, index: number, max: number) {
  do {
    const code = str.charCodeAt(index);
    if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) return index;
  } while (++index < max);
  return max;
}

function endIndex(str: string, index: number, min: number) {
  while (index > min) {
    const code = str.charCodeAt(--index);
    if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) return index + 1;
  }
  return min;
}

/**
 * Serialize options.
 */
export interface SerializeOptions {
  /**
   * Specifies a function that will be used to encode a cookie's value. Since
   * value of a cookie has a limited character set (and must be a simple string),
   * this function can be used to encode a value into a string suited for a cookie's value.
   *
   * @default encodeURIComponent
   */
  encode?: (str: string) => string;
  /**
   * Specifies the `number` (in seconds) to be the value for the [`Max-Age` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.2).
   * The given number will be converted to an integer by rounding down. By default, no maximum age is set.
   *
   * The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and
   * `maxAge` are set, then `maxAge` takes precedence, but it is possible not all clients by obey this,
   * so if both are set, they should point to the same date and time.
   */
  maxAge?: number;
  /**
   * Specifies the `Date` object to be the value for the [`Expires` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.1).
   * By default, no expiration is set, and most clients will consider this a "non-persistent cookie" and
   * will delete it on a condition like exiting a web browser application.
   *
   * The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and
   * `maxAge` are set, then `maxAge` takes precedence, but it is possible not all clients by obey this,
   * so if both are set, they should point to the same date and time.
   */
  expires?: Date;
  /**
   * Specifies the value for the [`Domain` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.3).
   * By default, no domain is set, and most clients will consider the cookie to apply to only the current domain.
   */
  domain?: string;
  /**
   * Specifies the value for the [`Path` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.4). By default, the path
   * is considered the ["default path"](https://tools.ietf.org/html/rfc6265#section-5.1.4).
   */
  path?: string;
  /**
   * Specifies the `boolean` value for the [`HttpOnly` `Set-Cookie` attribute][rfc-6265-5.2.6]. When truthy,
   * the `HttpOnly` attribute is set, otherwise it is not. By default, the `HttpOnly` attribute is not set.
   *
   * Be careful when setting this to `true`, as compliant clients will not allow client-side
   * JavaScript to see the cookie in `document.cookie`.
   */
  httpOnly?: boolean;
  /**
   * Specifies the `boolean` value for the [`Secure` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.5). When truthy,
   * the `Secure` attribute is set, otherwise it is not. By default, the `Secure` attribute is not set.
   *
   * Be careful when setting this to `true`, as compliant clients will not send the cookie back to
   * the server in the future if the browser does not have an HTTPS connection.
   */
  secure?: boolean;
  /**
   * Specifies the `boolean` value for the [`Partitioned` `Set-Cookie`](https://tools.ietf.org/html/draft-cutler-httpbis-partitioned-cookies/)
   * attribute. When truthy, the `Partitioned` attribute is set, otherwise it is not. By default, the
   * `Partitioned` attribute is not set.
   *
   * This is an attribute that has not yet been fully standardized, and may change in the future.
   * This also means many clients may ignore this attribute until they understand it. More information
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
   * More information about the different priority levels can be found in
   * [the specification](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).
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
   * More information about the different enforcement levels can be found in
   * [the specification](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).
   */
  sameSite?: boolean | "lax" | "strict" | "none";
}

/**
 * Serialize data into a cookie header.
 *
 * Serialize a name value pair into a cookie string suitable for
 * http headers. An optional options object specifies cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 */
export function serialize(
  name: string,
  val: string,
  options?: SerializeOptions,
): string {
  const enc = options?.encode || encodeURIComponent;

  if (!cookieNameRegExp.test(name)) {
    throw new TypeError(`argument name is invalid: ${name}`);
  }

  const value = enc(val);

  if (!cookieValueRegExp.test(value)) {
    throw new TypeError(`argument val is invalid: ${val}`);
  }

  let str = name + "=" + value;
  if (!options) return str;

  if (options.maxAge !== undefined) {
    if (!Number.isInteger(options.maxAge)) {
      throw new TypeError(`option maxAge is invalid: ${options.maxAge}`);
    }

    str += "; Max-Age=" + options.maxAge;
  }

  if (options.domain) {
    if (!domainValueRegExp.test(options.domain)) {
      throw new TypeError(`option domain is invalid: ${options.domain}`);
    }

    str += "; Domain=" + options.domain;
  }

  if (options.path) {
    if (!pathValueRegExp.test(options.path)) {
      throw new TypeError(`option path is invalid: ${options.path}`);
    }

    str += "; Path=" + options.path;
  }

  if (options.expires) {
    if (
      !isDate(options.expires) ||
      !Number.isFinite(options.expires.valueOf())
    ) {
      throw new TypeError(`option expires is invalid: ${options.expires}`);
    }

    str += "; Expires=" + options.expires.toUTCString();
  }

  if (options.httpOnly) {
    str += "; HttpOnly";
  }

  if (options.secure) {
    str += "; Secure";
  }

  if (options.partitioned) {
    str += "; Partitioned";
  }

  if (options.priority) {
    switch (options.priority) {
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
        throw new TypeError(`option priority is invalid: ${options.priority}`);
    }
  }

  if (options.sameSite) {
    switch (options.sameSite) {
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
        throw new TypeError(`option sameSite is invalid: ${options.sameSite}`);
    }
  }

  return str;
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
