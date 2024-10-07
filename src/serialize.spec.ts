import { describe, it, expect } from "vitest";
import * as cookie from "./index.js";

describe("cookie.serialize(name, value)", function () {
  it("should serialize name and value", function () {
    expect(cookie.serialize("foo", "bar")).toEqual("foo=bar");
  });

  it("should URL-encode value", function () {
    expect(cookie.serialize("foo", "bar +baz")).toEqual("foo=bar%20%2Bbaz");
  });

  it("should serialize empty value", function () {
    expect(cookie.serialize("foo", "")).toEqual("foo=");
  });

  it("should serialize valid name", function () {
    var validNames = [
      "foo",
      "foo!bar",
      "foo#bar",
      "foo$bar",
      "foo'bar",
      "foo*bar",
      "foo+bar",
      "foo-bar",
      "foo.bar",
      "foo^bar",
      "foo_bar",
      "foo`bar",
      "foo|bar",
      "foo~bar",
      "foo7bar",
    ];

    validNames.forEach(function (name) {
      expect(cookie.serialize(name, "baz")).toEqual(name + "=baz");
    });
  });

  it("should throw for invalid name", function () {
    var invalidNames = [
      "foo\n",
      "foo\u280a",
      "foo/foo",
      "foo,foo",
      "foo;foo",
      "foo@foo",
      "foo[foo]",
      "foo?foo",
      "foo:foo",
      "foo{foo}",
      "foo foo",
      "foo\tfoo",
      'foo"foo',
      "foo<script>foo",
    ];

    invalidNames.forEach(function (name) {
      expect(cookie.serialize.bind(cookie, name, "bar")).toThrow(
        /argument name is invalid/,
      );
    });
  });
});

describe("cookie.serialize(name, value, options)", function () {
  describe('with "domain" option', function () {
    it("should serialize valid domain", function () {
      var validDomains = [
        "example.com",
        "sub.example.com",
        ".example.com",
        "localhost",
        ".localhost",
        "my-site.org",
        "localhost",
      ];

      validDomains.forEach(function (domain) {
        expect(cookie.serialize("foo", "bar", { domain: domain })).toEqual(
          "foo=bar; Domain=" + domain,
        );
      });
    });

    it("should throw for invalid domain", function () {
      var invalidDomains = [
        "example.com\n",
        "sub.example.com\u0000",
        "my site.org",
        "domain..com",
        "example.com; Path=/",
        "example.com /* inject a comment */",
      ];

      invalidDomains.forEach(function (domain) {
        expect(
          cookie.serialize.bind(cookie, "foo", "bar", { domain: domain }),
        ).toThrow(/option domain is invalid/);
      });
    });
  });

  describe('with "encode" option', function () {
    it("should specify alternative value encoder", function () {
      expect(
        cookie.serialize("foo", "bar", {
          encode: function (v) {
            return Buffer.from(v, "utf8").toString("base64");
          },
        }),
      ).toEqual("foo=YmFy");
    });

    it("should throw when returned value is invalid", function () {
      expect(
        cookie.serialize.bind(cookie, "foo", "+ \n", {
          encode: function (v) {
            return v;
          },
        }),
      ).toThrow(/argument val is invalid/);
      expect(
        cookie.serialize.bind(cookie, "foo", "foo bar", {
          encode: function (v) {
            return v;
          },
        }),
      ).toThrow(/argument val is invalid/);
    });
  });

  describe('with "expires" option', function () {
    it("should throw on invalid date", function () {
      expect(
        cookie.serialize.bind(cookie, "foo", "bar", { expires: new Date(NaN) }),
      ).toThrow(/option expires is invalid/);
    });

    it("should set expires to given date", function () {
      expect(
        cookie.serialize("foo", "bar", {
          expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
        }),
      ).toEqual("foo=bar; Expires=Sun, 24 Dec 2000 10:30:59 GMT");
    });
  });

  describe('with "httpOnly" option', function () {
    it("should include httpOnly flag when true", function () {
      expect(cookie.serialize("foo", "bar", { httpOnly: true })).toEqual(
        "foo=bar; HttpOnly",
      );
    });

    it("should not include httpOnly flag when false", function () {
      expect(cookie.serialize("foo", "bar", { httpOnly: false })).toEqual(
        "foo=bar",
      );
    });
  });

  describe('with "maxAge" option', function () {
    it("should throw when not a number", function () {
      expect(function () {
        cookie.serialize("foo", "bar", { maxAge: "buzz" as any });
      }).toThrow(/option maxAge is invalid/);
    });

    it("should throw when Infinity", function () {
      expect(function () {
        cookie.serialize("foo", "bar", { maxAge: Infinity });
      }).toThrow(/option maxAge is invalid/);
    });

    it("should throw when max-age is not an integer", function () {
      expect(function () {
        cookie.serialize("foo", "bar", { maxAge: 3.14 });
      }).toThrow(/option maxAge is invalid/);
    });

    it("should set max-age to value", function () {
      expect(cookie.serialize("foo", "bar", { maxAge: 1000 })).toEqual(
        "foo=bar; Max-Age=1000",
      );
      expect(cookie.serialize("foo", "bar", { maxAge: 0 })).toEqual(
        "foo=bar; Max-Age=0",
      );
    });

    it("should not set when undefined", function () {
      expect(cookie.serialize("foo", "bar", { maxAge: undefined })).toEqual(
        "foo=bar",
      );
    });
  });

  describe('with "partitioned" option', function () {
    it("should include partitioned flag when true", function () {
      expect(cookie.serialize("foo", "bar", { partitioned: true })).toEqual(
        "foo=bar; Partitioned",
      );
    });

    it("should not include partitioned flag when false", function () {
      expect(cookie.serialize("foo", "bar", { partitioned: false })).toEqual(
        "foo=bar",
      );
    });

    it("should not include partitioned flag when not defined", function () {
      expect(cookie.serialize("foo", "bar", {})).toEqual("foo=bar");
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
        expect(cookie.serialize("foo", "bar", { path: path })).toEqual(
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
          cookie.serialize.bind(cookie, "foo", "bar", { path: path }),
        ).toThrow(/option path is invalid/);
      });
    });
  });

  describe('with "priority" option', function () {
    it("should throw on invalid priority", function () {
      expect(function () {
        cookie.serialize("foo", "bar", { priority: "foo" as any });
      }).toThrow(/option priority is invalid/);
    });

    it("should throw on non-string", function () {
      expect(function () {
        cookie.serialize("foo", "bar", { priority: 42 as any });
      }).toThrow(/option priority is invalid/);
    });

    it("should set priority low", function () {
      expect(cookie.serialize("foo", "bar", { priority: "low" })).toEqual(
        "foo=bar; Priority=Low",
      );
    });

    it("should set priority medium", function () {
      expect(cookie.serialize("foo", "bar", { priority: "medium" })).toEqual(
        "foo=bar; Priority=Medium",
      );
    });

    it("should set priority high", function () {
      expect(cookie.serialize("foo", "bar", { priority: "high" })).toEqual(
        "foo=bar; Priority=High",
      );
    });
  });

  describe('with "sameSite" option', function () {
    it("should throw on invalid sameSite", function () {
      expect(() => {
        cookie.serialize("foo", "bar", { sameSite: "foo" as any });
      }).toThrow(/option sameSite is invalid/);
    });

    it("should set sameSite strict", function () {
      expect(cookie.serialize("foo", "bar", { sameSite: "strict" })).toEqual(
        "foo=bar; SameSite=Strict",
      );
    });

    it("should set sameSite lax", function () {
      expect(cookie.serialize("foo", "bar", { sameSite: "lax" })).toEqual(
        "foo=bar; SameSite=Lax",
      );
    });

    it("should set sameSite none", function () {
      expect(cookie.serialize("foo", "bar", { sameSite: "none" })).toEqual(
        "foo=bar; SameSite=None",
      );
    });

    it("should set sameSite strict when true", function () {
      expect(cookie.serialize("foo", "bar", { sameSite: true })).toEqual(
        "foo=bar; SameSite=Strict",
      );
    });

    it("should not set sameSite when false", function () {
      expect(cookie.serialize("foo", "bar", { sameSite: false })).toEqual(
        "foo=bar",
      );
    });
  });

  describe('with "secure" option', function () {
    it("should include secure flag when true", function () {
      expect(cookie.serialize("foo", "bar", { secure: true })).toEqual(
        "foo=bar; Secure",
      );
    });

    it("should not include secure flag when false", function () {
      expect(cookie.serialize("foo", "bar", { secure: false })).toEqual(
        "foo=bar",
      );
    });
  });
});
