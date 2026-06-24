import { describe, expect, it } from "vitest";
import { stringifySetCookie } from "./index.js";

const cookieOctets =
  "!#$&'()*+-./0123456789:<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]" +
  "^_`abcdefghijklmnopqrstuvwxyz{|}~";

describe("cookie.stringifySetCookie", () => {
  it("should serialize name and value", () => {
    expect(stringifySetCookie({ name: "foo", value: "bar" })).toEqual(
      "foo=bar",
    );
  });

  it("should URL-encode value", () => {
    expect(stringifySetCookie({ name: "foo", value: "bar +baz" })).toEqual(
      "foo=bar%20%2Bbaz",
    );
    expect(stringifySetCookie({ name: "foo", value: "100%" })).toEqual(
      "foo=100%25",
    );
  });

  it("should pass through roundtrip-safe cookie-octet values without encoding", () => {
    const value = cookieOctets;

    expect(stringifySetCookie({ name: "foo", value })).toEqual(`foo=${value}`);
  });

  it("should serialize empty value", () => {
    expect(stringifySetCookie({ name: "foo", value: "" })).toEqual("foo=");
  });

  it("should serialize with options", () => {
    expect(
      stringifySetCookie(
        { name: "foo", value: "bar+baz" },
        { encode: (x) => x },
      ),
    ).toEqual("foo=bar+baz");
  });

  it.each([
    ["foo"],
    ["foo,bar"],
    ["foo!bar"],
    ["foo#bar"],
    ["foo$bar"],
    ["foo'bar"],
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
    ["foo/bar"],
    ["foo@bar"],
    ["foo[bar"],
    ["foo]bar"],
    ["foo:bar"],
    ["foo{bar"],
    ["foo}bar"],
    ['foo"bar'],
    ["foo<bar"],
    ["foo>bar"],
    ["foo?bar"],
    ["foo\\bar"],
  ])("should serialize name: %s", (name) => {
    expect(stringifySetCookie({ name, value: "baz" })).toEqual(`${name}=baz`);
  });

  it.each([
    ["foo\n"],
    ["foo\u280a"],
    ["foo=bar"],
    ["foo;bar"],
    ["foo bar"],
    ["foo\tbar"],
  ])("should throw for invalid name: %s", (name) => {
    expect(() => stringifySetCookie({ name, value: "bar" })).toThrow(
      /argument name is invalid/,
    );
  });

  describe('with "domain" option', () => {
    it.each([
      ["example.com"],
      ["sub.example.com"],
      [".example.com"],
      ["localhost"],
      [".localhost"],
      ["my-site.org"],
    ])("should serialize domain: %s", (domain) => {
      expect(stringifySetCookie({ name: "foo", value: "bar", domain })).toEqual(
        `foo=bar; Domain=${domain}`,
      );
    });

    it.each([
      ["example.com\n"],
      ["sub.example.com\u0000"],
      ["my site.org"],
      ["domain..com"],
      ["example.com; Path=/"],
      ["example.com /* inject a comment */"],
    ])("should throw for invalid domain: %s", (domain) => {
      expect(() =>
        stringifySetCookie({ name: "foo", value: "bar", domain }),
      ).toThrow(/option domain is invalid/);
    });
  });

  describe('with "encode" option', () => {
    it("should specify alternative value encoder", () => {
      expect(
        stringifySetCookie(
          { name: "foo", value: "bar" },
          {
            encode: (v) => Buffer.from(v, "utf8").toString("base64"),
          },
        ),
      ).toEqual("foo=YmFy");
    });

    it.each(["foo=bar", 'foo"bar', "foo,bar", "foo\\bar", "foo$bar"])(
      "should serialize value: %s",
      (value) => {
        expect(
          stringifySetCookie({ name: "foo", value }, { encode: (x) => x }),
        ).toEqual(`foo=${value}`);
      },
    );

    it.each([["+\n"], ["foo bar"], ["foo\tbar"], ["foo;bar"], ["foo\u280a"]])(
      "should throw for invalid value: %s",
      (value) => {
        expect(() =>
          stringifySetCookie({ name: "foo", value }, { encode: (x) => x }),
        ).toThrow(/argument val is invalid/);
      },
    );
  });

  describe('with "expires" option', () => {
    it("should throw on invalid date", () => {
      expect(() =>
        stringifySetCookie({
          name: "foo",
          value: "bar",
          expires: new Date(NaN),
        }),
      ).toThrow(/option expires is invalid/);
    });

    it("should set expires to given date", () => {
      expect(
        stringifySetCookie({
          name: "foo",
          value: "bar",
          expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
        }),
      ).toEqual("foo=bar; Expires=Sun, 24 Dec 2000 10:30:59 GMT");
    });
  });

  describe('with "maxAge" option', () => {
    it.each([
      ["non-number", "buzz"],
      ["Infinity", Infinity],
      ["non-integer", 3.14],
    ])("should throw when maxAge is %s", (_label, maxAge) => {
      expect(() =>
        stringifySetCookie({ name: "foo", value: "bar", maxAge } as any),
      ).toThrow(/option maxAge is invalid/);
    });

    it("should set max-age to value", () => {
      expect(
        stringifySetCookie({ name: "foo", value: "bar", maxAge: 1000 }),
      ).toEqual("foo=bar; Max-Age=1000");
      expect(
        stringifySetCookie({ name: "foo", value: "bar", maxAge: 0 }),
      ).toEqual("foo=bar; Max-Age=0");
    });
  });

  describe('with "path" option', () => {
    it.each([
      ["/"],
      ["/login"],
      ["/foo.bar/baz"],
      ["/foo-bar"],
      ["/foo=bar?baz"],
      ['/foo"bar"'],
      ["/../foo/bar"],
      ["../foo/"],
      ["./"],
    ])("should serialize path: %s", (path) => {
      expect(stringifySetCookie({ name: "foo", value: "bar", path })).toEqual(
        `foo=bar; Path=${path}`,
      );
    });

    it.each([
      ["/\n"],
      ["/foo\u0000"],
      ["/path/with\rnewline"],
      ["/; Path=/sensitive-data"],
      ['/login"><script>alert(1)</script>'],
    ])("should throw for invalid path: %s", (path) => {
      expect(() =>
        stringifySetCookie({ name: "foo", value: "bar", path }),
      ).toThrow(/option path is invalid/);
    });
  });

  describe('with "boolean attributes"', () => {
    it("should include enabled flags", () => {
      expect(
        stringifySetCookie({
          name: "foo",
          value: "bar",
          httpOnly: true,
          secure: true,
          partitioned: true,
        }),
      ).toEqual("foo=bar; HttpOnly; Secure; Partitioned");
    });

    it("should not include disabled flags", () => {
      expect(
        stringifySetCookie({
          name: "foo",
          value: "bar",
          httpOnly: false,
          secure: false,
          partitioned: false,
        }),
      ).toEqual("foo=bar");
    });
  });

  describe('with "priority" option', () => {
    it.each([
      ["invalid priority", "foo"],
      ["non-string", 42],
    ])("should throw on %s", (_label, priority) => {
      expect(() =>
        stringifySetCookie({ name: "foo", value: "bar", priority } as any),
      ).toThrow(/option priority is invalid/);
    });

    it.each([
      ["low", "Low"],
      ["medium", "Medium"],
      ["high", "High"],
      ["High", "High"],
    ])("should set priority %s", (priority, expected) => {
      expect(
        stringifySetCookie({
          name: "foo",
          value: "bar",
          priority: priority as any,
        }),
      ).toEqual(`foo=bar; Priority=${expected}`);
    });
  });

  describe('with "sameSite" option', () => {
    it("should throw on invalid sameSite", () => {
      expect(() =>
        stringifySetCookie({
          name: "foo",
          value: "bar",
          sameSite: "foo" as any,
        }),
      ).toThrow(/option sameSite is invalid/);
    });

    it.each([
      ["strict", "Strict"],
      ["lax", "Lax"],
      ["none", "None"],
      [true, "Strict"],
      ["Lax", "Lax"],
    ])("should set sameSite %s", (sameSite, expected) => {
      expect(
        stringifySetCookie({ name: "foo", value: "bar", sameSite } as any),
      ).toEqual(`foo=bar; SameSite=${expected}`);
    });
  });
});
