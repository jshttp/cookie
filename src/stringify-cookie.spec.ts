import { describe, expect, it } from "vitest";
import { stringifyCookie, parseCookie } from "./index.js";

const cookieOctets =
  "!#$&'()*+-./0123456789:<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]" +
  "^_`abcdefghijklmnopqrstuvwxyz{|}~";

const bmpEncodingCases: Array<[string, string, string]> = [];

for (let code = 0; code <= 0xffff; code++) {
  // encodeURIComponent throws on unpaired surrogates.
  if (code >= 0xd800 && code <= 0xdfff) continue;

  const value = String.fromCharCode(code);
  const encoded = cookieOctets.includes(value)
    ? value
    : encodeURIComponent(value);

  bmpEncodingCases.push([
    `U+${code.toString(16).toUpperCase().padStart(4, "0")}`,
    value,
    `key=${encoded}`,
  ]);
}

const astralEncodingCases: Array<[string, string, string]> = [];

for (const value of ["😄", "𝌆", "𠜎"]) {
  astralEncodingCases.push([
    `U+${value.codePointAt(0)!.toString(16).toUpperCase()}`,
    value,
    `key=${encodeURIComponent(value)}`,
  ]);
}

describe("cookie.stringifyCookie", () => {
  it("should stringify object", () => {
    expect(stringifyCookie({ key: "value" })).toEqual("key=value");
  });

  it("should stringify objects with multiple entries", () => {
    expect(stringifyCookie({ a: "1", b: "2" })).toEqual("a=1; b=2");
  });

  it("should ignore undefined values", () => {
    expect(stringifyCookie({ a: "1", b: undefined })).toEqual("a=1");
    expect(stringifyCookie({ a: undefined, b: "2" })).toEqual("b=2");
  });

  it("should return empty string for empty object", () => {
    expect(stringifyCookie({})).toEqual("");
  });

  it("should return empty string when all values are undefined", () => {
    expect(stringifyCookie({ a: undefined, b: undefined })).toEqual("");
  });

  it("should stringify empty string values", () => {
    expect(stringifyCookie({ a: "" })).toEqual("a=");
    expect(stringifyCookie({ a: "", b: "" })).toEqual("a=; b=");
  });

  it("should encode values with non-cookie-octet chars by default", () => {
    expect(stringifyCookie({ foo: "bar baz" })).toEqual("foo=bar%20baz");
    expect(stringifyCookie({ foo: "hello;world" })).toEqual(
      "foo=hello%3Bworld",
    );
    expect(stringifyCookie({ foo: 'hello"world' })).toEqual(
      "foo=hello%22world",
    );
    expect(stringifyCookie({ foo: "foo,bar" })).toEqual("foo=foo%2Cbar");
    expect(stringifyCookie({ foo: "foo\\bar" })).toEqual("foo=foo%5Cbar");
    expect(stringifyCookie({ foo: "100%" })).toEqual("foo=100%25");
  });

  it("should pass through roundtrip-safe cookie-octet values without encoding", () => {
    const value = cookieOctets;

    expect(stringifyCookie({ foo: value })).toEqual(`foo=${value}`);
  });

  it.each(bmpEncodingCases)(
    "should match default encoding for BMP char %s",
    (_name, value, expected) => {
      expect(stringifyCookie({ key: value })).toEqual(expected);
    },
  );

  it.each(astralEncodingCases)(
    "should match default encoding for astral char %s",
    (_name, value, expected) => {
      expect(stringifyCookie({ key: value })).toEqual(expected);
    },
  );

  it("should error on invalid keys", () => {
    expect(() => stringifyCookie({ "test=": "" })).toThrow(
      /cookie name is invalid/,
    );
  });

  it.each([["foo bar"], ["foo;bar"], ["foo\tbar"], ["foo\nbar"]])(
    "should throw for invalid name: %s",
    (name) => {
      expect(() => stringifyCookie({ [name]: "val" })).toThrow(
        /cookie name is invalid/,
      );
    },
  );

  it("should error on invalid values", () => {
    expect(() => stringifyCookie({ test: ";" }, { encode: (x) => x })).toThrow(
      /cookie val is invalid/,
    );
  });

  it.each([
    ["foo!bar"],
    ["foo#bar"],
    ["foo$bar"],
    ["foo&bar"],
    ["foo*bar"],
    ["foo+bar"],
    ["foo-bar"],
    ["foo.bar"],
    ["foo^bar"],
    ["foo_bar"],
    ["foo`bar"],
    ["foo|bar"],
    ["foo~bar"],
    ["foo7bar"],
  ])("should accept valid cookie name: %s", (name) => {
    expect(stringifyCookie({ [name]: "val" })).toEqual(`${name}=val`);
  });

  describe('with "encode" option', () => {
    it("should use custom encode function", () => {
      expect(
        stringifyCookie(
          { foo: "bar" },
          {
            encode: (v) => Buffer.from(v, "utf8").toString("base64"),
          },
        ),
      ).toEqual("foo=YmFy");
    });

    it("should pass through values with identity encoder", () => {
      expect(stringifyCookie({ foo: "bar" }, { encode: (x) => x })).toEqual(
        "foo=bar",
      );
    });

    it("should throw when custom encoder produces invalid value", () => {
      expect(() =>
        stringifyCookie({ foo: "bar" }, { encode: () => "invalid value" }),
      ).toThrow(/cookie val is invalid/);
    });
  });

  describe("roundtrip with parseCookie", () => {
    it("should roundtrip simple values", () => {
      const cookies = { foo: "bar", baz: "qux" };
      const str = stringifyCookie(cookies);
      expect(parseCookie(str)).toEqual(cookies);
    });

    it("should roundtrip URL-encoded values", () => {
      const cookies = { session: "abc 123", token: "x=y&z" };
      const str = stringifyCookie(cookies);
      expect(parseCookie(str)).toEqual(cookies);
    });

    it("should roundtrip percent-encoded-looking values", () => {
      const cookies = { foo: "%20" };
      const str = stringifyCookie(cookies);

      expect(str).toEqual("foo=%2520");
      expect(parseCookie(str)).toEqual(cookies);
    });

    it("should roundtrip empty values", () => {
      const cookies = { a: "", b: "value" };
      const str = stringifyCookie(cookies);
      expect(parseCookie(str)).toEqual(cookies);
    });

    it("should roundtrip single cookie", () => {
      const cookies = { session_id: "abc123def456" };
      const str = stringifyCookie(cookies);
      expect(parseCookie(str)).toEqual(cookies);
    });

    it("should roundtrip with custom encode/decode", () => {
      const encode = (v: string) => Buffer.from(v, "utf8").toString("base64");
      const decode = (v: string) => Buffer.from(v, "base64").toString("utf8");
      const cookies = { data: "hello world" };
      const str = stringifyCookie(cookies, { encode });
      expect(parseCookie(str, { decode })).toEqual(cookies);
    });
  });
});
