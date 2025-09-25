import { describe, it, expect } from "vitest";
import * as cookie from "./index.js";

describe("cookie.parseCookie", function () {
  it("should have backward compatible export", function () {
    expect(cookie.parse).toBe(cookie.parseCookie);
  });

  it("should parse cookie string to object", function () {
    expect(cookie.parseCookie("foo=bar")).toEqual({ foo: "bar" });
    expect(cookie.parseCookie("foo=123")).toEqual({ foo: "123" });
  });

  it("should ignore OWS", function () {
    expect(cookie.parseCookie("FOO    = bar;   baz  =   raz")).toEqual({
      FOO: "bar",
      baz: "raz",
    });
  });

  it("should return empty object", function () {
    expect(cookie.parseCookie("")).toEqual({});
  });

  it("should parse cookie with empty value", function () {
    expect(cookie.parseCookie("foo=; bar=")).toEqual({ foo: "", bar: "" });
  });

  it("should parse cookie with minimum length", function () {
    expect(cookie.parseCookie("f=")).toEqual({ f: "" });
    expect(cookie.parseCookie("f=;b=")).toEqual({ f: "", b: "" });
  });

  it("should URL-decode values", function () {
    expect(cookie.parseCookie('foo="bar=123456789&name=Magic+Mouse"')).toEqual({
      foo: '"bar=123456789&name=Magic+Mouse"',
    });

    expect(cookie.parseCookie("email=%20%22%2c%3b%2f")).toEqual({
      email: ' ",;/',
    });
  });

  it("should trim whitespace around key and value", function () {
    expect(cookie.parseCookie('  foo  =  "bar"  ')).toEqual({ foo: '"bar"' });
    expect(cookie.parseCookie("  foo  =  bar  ;  fizz  =  buzz  ")).toEqual({
      foo: "bar",
      fizz: "buzz",
    });
    expect(cookie.parseCookie(' foo = " a b c " ')).toEqual({
      foo: '" a b c "',
    });
    expect(cookie.parseCookie(" = bar ")).toEqual({ "": "bar" });
    expect(cookie.parseCookie(" foo = ")).toEqual({ foo: "" });
    expect(cookie.parseCookie("   =   ")).toEqual({ "": "" });
    expect(cookie.parseCookie("\tfoo\t=\tbar\t")).toEqual({ foo: "bar" });
  });

  it("should return original value on escape error", function () {
    expect(cookie.parseCookie("foo=%1;bar=bar")).toEqual({
      foo: "%1",
      bar: "bar",
    });
  });

  it("should ignore cookies without value", function () {
    expect(cookie.parseCookie("foo=bar;fizz  ;  buzz")).toEqual({ foo: "bar" });
    expect(cookie.parseCookie("  fizz; foo=  bar")).toEqual({ foo: "bar" });
  });

  it("should ignore duplicate cookies", function () {
    expect(cookie.parseCookie("foo=%1;bar=bar;foo=boo")).toEqual({
      foo: "%1",
      bar: "bar",
    });
    expect(cookie.parseCookie("foo=false;bar=bar;foo=true")).toEqual({
      foo: "false",
      bar: "bar",
    });
    expect(cookie.parseCookie("foo=;bar=bar;foo=boo")).toEqual({
      foo: "",
      bar: "bar",
    });
  });

  it("should parse native properties", function () {
    expect(cookie.parseCookie("toString=foo;valueOf=bar")).toEqual({
      toString: "foo",
      valueOf: "bar",
    });
  });
});

describe("cookie.parseCookie(str, options)", function () {
  describe('with "decode" option', function () {
    it("should specify alternative value decoder", function () {
      expect(
        cookie.parseCookie('foo="YmFy"', {
          decode: function (v) {
            return Buffer.from(v, "base64").toString();
          },
        }),
      ).toEqual({ foo: "bar" });
    });
  });
});
