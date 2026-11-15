import { describe, expect, it } from "vitest";
import { parseSetCookie } from "./index.js";
import top from "../scripts/top-set-cookie.json" with { type: "json" };

describe("cookie.parseSetCookie", () => {
  describe("parse top-sites", () => {
    Object.entries(top).forEach(([domain, values]) => {
      describe(domain, () => {
        values.forEach((value) => {
          it(value, () => {
            expect(parseSetCookie(value)).toMatchSnapshot();
          });
        });
      });
    });
  });

  it("should parse a string", () => {
    expect(parseSetCookie("key=value")).toEqual({
      name: "key",
      value: "value",
    });
  });

  it("should handle empty value", () => {
    expect(parseSetCookie("key=")).toEqual({ name: "key", value: "" });
  });

  it("should handle missing equals sign", () => {
    expect(parseSetCookie("value")).toEqual({ name: "", value: "value" });
  });

  it("should trim whitespace around key and value", () => {
    expect(parseSetCookie("  key  =  value  ")).toEqual({
      name: "key",
      value: "value",
    });
    expect(parseSetCookie("\tkey\t=\tvalue\t")).toEqual({
      name: "key",
      value: "value",
    });
  });

  it("should return empty key for empty string", () => {
    expect(parseSetCookie("")).toEqual({ name: "", value: "" });
  });

  it("should return empty key for string with only spaces", () => {
    expect(parseSetCookie("   ")).toEqual({ name: "", value: "" });
  });

  it("should handle URL-encoded values", () => {
    expect(parseSetCookie("key=value%20with%20spaces")).toEqual({
      name: "key",
      value: "value with spaces",
    });
  });

  it("should handle multiple equals signs in value", () => {
    expect(parseSetCookie("key=value=with=equals")).toEqual({
      name: "key",
      value: "value=with=equals",
    });
  });

  it("ignores unknown attributes", () => {
    expect(
      parseSetCookie("key=value; UnknownAttr=somevalue; AnotherOne"),
    ).toEqual({ name: "key", value: "value" });
  });

  it("should handle attributes with no value", () => {
    expect(parseSetCookie("key=value; HttpOnly; Secure")).toEqual({
      name: "key",
      value: "value",
      httpOnly: true,
      secure: true,
    });
  });

  it("should ignore value of boolean attributes", () => {
    expect(parseSetCookie("key=value; HttpOnly=true; Secure=false")).toEqual({
      name: "key",
      value: "value",
      httpOnly: true,
      secure: true,
    });
  });

  it("should handle attributes with extra spaces", () => {
    expect(parseSetCookie("key=value;    HttpOnly   ;   Secure   ")).toEqual({
      name: "key",
      value: "value",
      httpOnly: true,
      secure: true,
    });
  });

  it("should skip over empty attributes", () => {
    expect(parseSetCookie("key=value;;; HttpOnly;;; Secure;;")).toEqual({
      name: "key",
      value: "value",
      httpOnly: true,
      secure: true,
    });
  });

  describe('with "decode" option', () => {
    it("should use custom decode function", () => {
      const decode = (str: string) => str.replace(/-/g, " ");
      expect(parseSetCookie("key=value-with-dashes", { decode })).toEqual({
        name: "key",
        value: "value with dashes",
      });
    });
  });

  describe("with expires", () => {
    it("should parse valid expires date", () => {
      expect(
        parseSetCookie("key=value; Expires=Wed, 21 Oct 2015 07:28:00 GMT"),
      ).toEqual({
        name: "key",
        value: "value",
        expires: new Date("Wed, 21 Oct 2015 07:28:00 GMT"),
      });
    });

    it("should ignore invalid expires date", () => {
      expect(parseSetCookie("key=value; Expires=InvalidDate")).toEqual({
        name: "key",
        value: "value",
      });
    });

    it.each([
      ["Wed, 21 Oct 2015 07:28:00 GMT", Date.UTC(2015, 9, 21, 7, 28, 0)],
      ["Wed, 21-Oct-2015 07:28:00 GMT", Date.UTC(2015, 9, 21, 7, 28, 0)],
      ["Wednesday, 21-Oct-15 07:28:00 GMT", Date.UTC(2015, 9, 21, 7, 28, 0)],
      ["Sun, 06 Nov 94 08:49:37 GMT", Date.UTC(1994, 10, 6, 8, 49, 37)],
      ["Thu, 01-Jan-70 00:00:01 GMT", Date.UTC(1970, 0, 1, 0, 0, 1)],
      ["Sun Nov  6 08:49:37 1994", Date.UTC(1994, 10, 6, 8, 49, 37)],
      ["21 october 2015 7:8:9", Date.UTC(2015, 9, 21, 7, 8, 9)],
      ["Tue, 31 Dec 9999 23:59:59 GMT", Date.UTC(9999, 11, 31, 23, 59, 59)],
    ])("should parse cookie date %j", (expires, time) => {
      expect(parseSetCookie(`key=value; Expires=${expires}`)).toEqual({
        name: "key",
        value: "value",
        expires: new Date(time),
      });
    });

    it.each([
      "1",
      "2015",
      "Oct 2015",
      "21 Oct 2015",
      "2015-10-21T07:28:00Z",
      "Wed, 30 Feb 2015 07:28:00 GMT",
      "Wed, 21 Oct 2015 24:00:00 GMT",
      "Wed, 21 Oct 2015 07:60:00 GMT",
      "Wed, 32 Oct 2015 07:28:00 GMT",
      "Wed, 21 Oct 1600 07:28:00 GMT",
    ])("should ignore expires that is not a cookie date: %j", (expires) => {
      expect(parseSetCookie(`key=value; Expires=${expires}`)).toEqual({
        name: "key",
        value: "value",
      });
    });

    it("should read expires as UTC whatever the local time zone", () => {
      const tz = process.env.TZ;
      process.env.TZ = "America/New_York";

      try {
        expect(
          parseSetCookie("key=value; Expires=Wed, 21 Oct 2015 07:28:00"),
        ).toEqual({
          name: "key",
          value: "value",
          expires: new Date(Date.UTC(2015, 9, 21, 7, 28, 0)),
        });
      } finally {
        if (tz === undefined) delete process.env.TZ;
        else process.env.TZ = tz;
      }
    });
  });

  describe('with "max-age"', () => {
    it("should parse valid max-age", () => {
      expect(parseSetCookie("key=value; Max-Age=3600")).toEqual({
        name: "key",
        value: "value",
        maxAge: 3600,
      });
    });

    it("should ignore invalid max-age", () => {
      expect(parseSetCookie("key=value; Max-Age=Invalid")).toEqual({
        name: "key",
        value: "value",
      });
    });

    it("should ignore max-age with partial digits", () => {
      expect(parseSetCookie("key=value; Max-Age=123abc")).toEqual({
        name: "key",
        value: "value",
      });
    });

    it("should ignore max-age with decimals", () => {
      expect(parseSetCookie("key=value; Max-Age=1.5")).toEqual({
        name: "key",
        value: "value",
      });
    });

    it("should parse negative max-age", () => {
      expect(parseSetCookie("key=value; Max-Age=-1")).toEqual({
        name: "key",
        value: "value",
        maxAge: -1,
      });
    });
  });

  describe('with "domain"', () => {
    it("should set domain when provided", () => {
      expect(parseSetCookie("key=value; Domain=example.com")).toEqual({
        name: "key",
        value: "value",
        domain: "example.com",
      });
    });
  });

  describe('with "path"', () => {
    it("should set path when provided", () => {
      expect(parseSetCookie("key=value; Path=/some/path")).toEqual({
        name: "key",
        value: "value",
        path: "/some/path",
      });
    });
  });

  describe('with "httpOnly"', () => {
    it("should set httpOnly to true when set", () => {
      expect(parseSetCookie("key=value; HttpOnly")).toEqual({
        name: "key",
        value: "value",
        httpOnly: true,
      });
    });
  });

  describe('with "secure"', () => {
    it("should set secure to true when set", () => {
      expect(parseSetCookie("key=value; Secure")).toEqual({
        name: "key",
        value: "value",
        secure: true,
      });
    });
  });

  describe('with "partitioned"', () => {
    it("should set partitioned to true when set", () => {
      expect(parseSetCookie("key=value; Partitioned")).toEqual({
        name: "key",
        value: "value",
        partitioned: true,
      });
    });
  });

  describe('with "sameSite"', () => {
    it("should set sameSite to 'Strict' when option is 'Strict'", () => {
      expect(parseSetCookie("key=value; SameSite=Strict")).toEqual({
        name: "key",
        value: "value",
        sameSite: "strict",
      });

      expect(parseSetCookie("key=value; SameSite=strict")).toEqual({
        name: "key",
        value: "value",
        sameSite: "strict",
      });
    });

    it("should set sameSite to 'Lax' when option is 'Lax'", () => {
      expect(parseSetCookie("key=value; SameSite=Lax")).toEqual({
        name: "key",
        value: "value",
        sameSite: "lax",
      });

      expect(parseSetCookie("key=value; SameSite=lax")).toEqual({
        name: "key",
        value: "value",
        sameSite: "lax",
      });
    });

    it("should set sameSite to 'None' when option is 'None'", () => {
      expect(parseSetCookie("key=value; SameSite=None")).toEqual({
        name: "key",
        value: "value",
        sameSite: "none",
      });

      expect(parseSetCookie("key=value; SameSite=none")).toEqual({
        name: "key",
        value: "value",
        sameSite: "none",
      });
    });

    it("should ignore invalid SameSite values", () => {
      expect(parseSetCookie("key=value; SameSite=Invalid")).toEqual({
        name: "key",
        value: "value",
      });
    });
  });

  describe('with "priority"', () => {
    it("should set priority to 'Low' when option is 'Low'", () => {
      expect(parseSetCookie("key=value; Priority=Low")).toEqual({
        name: "key",
        value: "value",
        priority: "low",
      });

      expect(parseSetCookie("key=value; Priority=low")).toEqual({
        name: "key",
        value: "value",
        priority: "low",
      });
    });

    it("should set priority to 'Medium' when option is 'Medium'", () => {
      expect(parseSetCookie("key=value; Priority=Medium")).toEqual({
        name: "key",
        value: "value",
        priority: "medium",
      });

      expect(parseSetCookie("key=value; Priority=medium")).toEqual({
        name: "key",
        value: "value",
        priority: "medium",
      });
    });

    it("should set priority to 'High' when option is 'High'", () => {
      expect(parseSetCookie("key=value; Priority=High")).toEqual({
        name: "key",
        value: "value",
        priority: "high",
      });

      expect(parseSetCookie("key=value; Priority=high")).toEqual({
        name: "key",
        value: "value",
        priority: "high",
      });
    });

    it("should ignore invalid Priority values", () => {
      expect(parseSetCookie("key=value; Priority=Invalid")).toEqual({
        name: "key",
        value: "value",
      });
    });
  });
});
