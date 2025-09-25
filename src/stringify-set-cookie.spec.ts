import { describe, it, expect } from "vitest";
import * as cookie from "./index.js";

describe("cookie.stringifySetCookie", function () {
  it("should have backward compatible export", function () {
    expect(cookie.serialize).toBe(cookie.stringifySetCookie);
  });

  it("should serialize name and value", function () {
    expect(cookie.stringifySetCookie("foo", "bar")).toEqual("foo=bar");
  });

  it("should URL-encode value", function () {
    expect(cookie.stringifySetCookie("foo", "bar +baz")).toEqual(
      "foo=bar%20%2Bbaz",
    );
  });

  it("should serialize empty value", function () {
    expect(cookie.stringifySetCookie("foo", "")).toEqual("foo=");
  });

  it("should serialize an object", function () {
    expect(
      cookie.stringifySetCookie({ name: "foo", value: "bar +baz" }),
    ).toEqual("foo=bar%20%2Bbaz");
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
    expect(cookie.stringifySetCookie(name, "baz")).toEqual(`${name}=baz`);
  });

  it.each([
    ["foo\n"],
    ["foo\u280a"],
    ["foo=bar"],
    ["foo;bar"],
    ["foo bar"],
    ["foo\tbar"],
  ])("should throw for invalid name: %s", (name) => {
    expect(() => cookie.stringifySetCookie(name, "bar")).toThrow(
      /argument name is invalid/,
    );
  });
});

describe("cookie.serialize(name, value, options)", function () {
  describe('with "domain" option', function () {
    it.each([
      ["example.com"],
      ["sub.example.com"],
      [".example.com"],
      ["localhost"],
      [".localhost"],
      ["my-site.org"],
      ["localhost"],
    ])("should serialize domain: %s", (domain) => {
      expect(cookie.stringifySetCookie("foo", "bar", { domain })).toEqual(
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
      expect(() => cookie.stringifySetCookie("foo", "bar", { domain })).toThrow(
        /option domain is invalid/,
      );
    });
  });

  describe('with "encode" option', function () {
    it("should specify alternative value encoder", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", {
          encode: function (v) {
            return Buffer.from(v, "utf8").toString("base64");
          },
        }),
      ).toEqual("foo=YmFy");
    });

    it.each(["foo=bar", 'foo"bar', "foo,bar", "foo\\bar", "foo$bar"])(
      "should serialize value: %s",
      (value) => {
        expect(
          cookie.stringifySetCookie("foo", value, { encode: (x) => x }),
        ).toEqual(`foo=${value}`);
      },
    );

    it.each([["+\n"], ["foo bar"], ["foo\tbar"], ["foo;bar"], ["foo\u280a"]])(
      "should throw for invalid value: %s",
      (value) => {
        expect(() =>
          cookie.stringifySetCookie("foo", value, { encode: (x) => x }),
        ).toThrow(/argument val is invalid/);
      },
    );
  });

  describe('with "expires" option', function () {
    it("should throw on invalid date", function () {
      expect(
        cookie.stringifySetCookie.bind(cookie, "foo", "bar", {
          expires: new Date(NaN),
        }),
      ).toThrow(/option expires is invalid/);
    });

    it("should set expires to given date", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", {
          expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
        }),
      ).toEqual("foo=bar; Expires=Sun, 24 Dec 2000 10:30:59 GMT");
    });
  });

  describe('with "httpOnly" option', function () {
    it("should include httpOnly flag when true", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { httpOnly: true }),
      ).toEqual("foo=bar; HttpOnly");
    });

    it("should not include httpOnly flag when false", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { httpOnly: false }),
      ).toEqual("foo=bar");
    });
  });

  describe('with "maxAge" option', function () {
    it("should throw when not a number", function () {
      expect(function () {
        cookie.stringifySetCookie("foo", "bar", { maxAge: "buzz" as any });
      }).toThrow(/option maxAge is invalid/);
    });

    it("should throw when Infinity", function () {
      expect(function () {
        cookie.stringifySetCookie("foo", "bar", { maxAge: Infinity });
      }).toThrow(/option maxAge is invalid/);
    });

    it("should throw when max-age is not an integer", function () {
      expect(function () {
        cookie.stringifySetCookie("foo", "bar", { maxAge: 3.14 });
      }).toThrow(/option maxAge is invalid/);
    });

    it("should set max-age to value", function () {
      expect(cookie.stringifySetCookie("foo", "bar", { maxAge: 1000 })).toEqual(
        "foo=bar; Max-Age=1000",
      );
      expect(cookie.stringifySetCookie("foo", "bar", { maxAge: 0 })).toEqual(
        "foo=bar; Max-Age=0",
      );
    });

    it("should not set when undefined", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { maxAge: undefined }),
      ).toEqual("foo=bar");
    });
  });

  describe('with "partitioned" option', function () {
    it("should include partitioned flag when true", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { partitioned: true }),
      ).toEqual("foo=bar; Partitioned");
    });

    it("should not include partitioned flag when false", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { partitioned: false }),
      ).toEqual("foo=bar");
    });

    it("should not include partitioned flag when not defined", function () {
      expect(cookie.stringifySetCookie("foo", "bar", {})).toEqual("foo=bar");
    });
  });

  describe('with "path" option', function () {
    it("should serialize path", function () {
      var validPaths = [
        "/",
        "/login",
        "/foo.bar/baz",
        "/foo-bar",
        "/foo=bar?baz",
        '/foo"bar"',
        "/../foo/bar",
        "../foo/",
        "./",
      ];

      validPaths.forEach(function (path) {
        expect(cookie.stringifySetCookie("foo", "bar", { path: path })).toEqual(
          "foo=bar; Path=" + path,
        );
      });
    });

    it("should throw for invalid value", function () {
      var invalidPaths = [
        "/\n",
        "/foo\u0000",
        "/path/with\rnewline",
        "/; Path=/sensitive-data",
        '/login"><script>alert(1)</script>',
      ];

      invalidPaths.forEach(function (path) {
        expect(
          cookie.stringifySetCookie.bind(cookie, "foo", "bar", { path: path }),
        ).toThrow(/option path is invalid/);
      });
    });
  });

  describe('with "priority" option', function () {
    it("should throw on invalid priority", function () {
      expect(function () {
        cookie.stringifySetCookie("foo", "bar", { priority: "foo" as any });
      }).toThrow(/option priority is invalid/);
    });

    it("should throw on non-string", function () {
      expect(function () {
        cookie.stringifySetCookie("foo", "bar", { priority: 42 as any });
      }).toThrow(/option priority is invalid/);
    });

    it("should set priority low", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { priority: "low" }),
      ).toEqual("foo=bar; Priority=Low");
    });

    it("should set priority medium", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { priority: "medium" }),
      ).toEqual("foo=bar; Priority=Medium");
    });

    it("should set priority high", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { priority: "high" }),
      ).toEqual("foo=bar; Priority=High");
    });

    it("should set priority case insensitive", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { priority: "High" as any }),
      ).toEqual("foo=bar; Priority=High");
    });
  });

  describe('with "sameSite" option', function () {
    it("should throw on invalid sameSite", function () {
      expect(() => {
        cookie.stringifySetCookie("foo", "bar", { sameSite: "foo" as any });
      }).toThrow(/option sameSite is invalid/);
    });

    it("should set sameSite strict", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { sameSite: "strict" }),
      ).toEqual("foo=bar; SameSite=Strict");
    });

    it("should set sameSite lax", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { sameSite: "lax" }),
      ).toEqual("foo=bar; SameSite=Lax");
    });

    it("should set sameSite none", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { sameSite: "none" }),
      ).toEqual("foo=bar; SameSite=None");
    });

    it("should set sameSite strict when true", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { sameSite: true }),
      ).toEqual("foo=bar; SameSite=Strict");
    });

    it("should not set sameSite when false", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { sameSite: false }),
      ).toEqual("foo=bar");
    });

    it("should set sameSite case insensitive", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { sameSite: "Lax" as any }),
      ).toEqual("foo=bar; SameSite=Lax");
    });
  });

  describe('with "secure" option', function () {
    it("should include secure flag when true", function () {
      expect(cookie.stringifySetCookie("foo", "bar", { secure: true })).toEqual(
        "foo=bar; Secure",
      );
    });

    it("should not include secure flag when false", function () {
      expect(
        cookie.stringifySetCookie("foo", "bar", { secure: false }),
      ).toEqual("foo=bar");
    });
  });
});
