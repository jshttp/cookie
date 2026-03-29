import { describe, expect, it } from "vitest";
import { stringifyCookie, parseCookie } from "./index.js";

describe("cookie.stringifyCookie", () => {
  it("should stringify object", () => {
    expect(stringifyCookie({ key: "value" })).toEqual("key=value");
  });

  it("should stringify objects with multiple entries", () => {
    expect(stringifyCookie({ a: "1", b: "2" })).toEqual("a=1; b=2");
  });

  it("should ignore undefined values", () => {
    expect(stringifyCookie({ a: "1", b: undefined })).toEqual("a=1");
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

  it("should URL-encode values by default", () => {
    expect(stringifyCookie({ foo: "bar baz" })).toEqual("foo=bar%20baz");
    expect(stringifyCookie({ foo: "a=b" })).toEqual("foo=a%3Db");
    expect(stringifyCookie({ foo: "hello;world" })).toEqual(
      "foo=hello%3Bworld",
    );
  });

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
