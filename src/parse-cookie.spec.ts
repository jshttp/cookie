import { describe, it, expect } from "vitest";
import * as cookie from "./index.js";

describe("cookie.parseCookie", function () {
  it("should have backward compatible export", function () {
    expect(cookie.parse).toBe(cookie.parseCookie);
  });

  it("should parse cookie string to object", function () {
    expect(cookie.parse("foo=bar")).toEqual({ foo: "bar" });
    expect(cookie.parse("foo=123")).toEqual({ foo: "123" });
  });

  it("should ignore OWS", function () {
    expect(cookie.parse("FOO    = bar;   baz  =   raz")).toEqual({
      FOO: "bar",
      baz: "raz",
    });
  });

  it("should parse cookie with empty value", function () {
    expect(cookie.parse("foo=; bar=")).toEqual({ foo: "", bar: "" });
  });

  it("should parse cookie with minimum length", function () {
    expect(cookie.parse("f=")).toEqual({ f: "" });
    expect(cookie.parse("f=;b=")).toEqual({ f: "", b: "" });
  });

  it("should URL-decode values", function () {
    expect(cookie.parse('foo="bar=123456789&name=Magic+Mouse"')).toEqual({
      foo: '"bar=123456789&name=Magic+Mouse"',
    });

    expect(cookie.parse("email=%20%22%2c%3b%2f")).toEqual({ email: ' ",;/' });
  });

  it("should trim whitespace around key and value", function () {
    expect(cookie.parse('  foo  =  "bar"  ')).toEqual({ foo: '"bar"' });
    expect(cookie.parse("  foo  =  bar  ;  fizz  =  buzz  ")).toEqual({
      foo: "bar",
      fizz: "buzz",
    });
    expect(cookie.parse(' foo = " a b c " ')).toEqual({ foo: '" a b c "' });
    expect(cookie.parse(" = bar ")).toEqual({ "": "bar" });
    expect(cookie.parse(" foo = ")).toEqual({ foo: "" });
    expect(cookie.parse("   =   ")).toEqual({ "": "" });
    expect(cookie.parse("\tfoo\t=\tbar\t")).toEqual({ foo: "bar" });
  });

  it("should return original value on escape error", function () {
    expect(cookie.parse("foo=%1;bar=bar")).toEqual({ foo: "%1", bar: "bar" });
  });

  it("should ignore cookies without value", function () {
    expect(cookie.parse("foo=bar;fizz  ;  buzz")).toEqual({ foo: "bar" });
    expect(cookie.parse("  fizz; foo=  bar")).toEqual({ foo: "bar" });
  });

  it("should ignore duplicate cookies", function () {
    expect(cookie.parse("foo=%1;bar=bar;foo=boo")).toEqual({
      foo: "%1",
      bar: "bar",
    });
    expect(cookie.parse("foo=false;bar=bar;foo=true")).toEqual({
      foo: "false",
      bar: "bar",
    });
    expect(cookie.parse("foo=;bar=bar;foo=boo")).toEqual({
      foo: "",
      bar: "bar",
    });
  });

  it("should parse native properties", function () {
    expect(cookie.parse("toString=foo;valueOf=bar")).toEqual({
      toString: "foo",
      valueOf: "bar",
    });
  });
});

describe("cookie.parse(str, options)", function () {
  describe('with "decode" option', function () {
    it("should specify alternative value decoder", function () {
      expect(
        cookie.parse('foo="YmFy"', {
          decode: function (v) {
            return Buffer.from(v, "base64").toString();
          },
        }),
      ).toEqual({ foo: "bar" });
    });
  });
});
