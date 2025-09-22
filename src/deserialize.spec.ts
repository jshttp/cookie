import { describe, expect, it } from "vitest";
import { deserialize } from "./index.js";

describe("cookie.deserialize(str)", () => {
  it("should deserialize cookie string", () => {
    expect(deserialize("key=value")).toEqual({ name: "key", value: "value" });
  });

  it("should handle empty value", () => {
    expect(deserialize("key=")).toEqual({ name: "key", value: "" });
  });

  it("should handle missing equals sign", () => {
    expect(deserialize("key")).toEqual({ name: "key", value: "" });
  });

  it("should trim whitespace around key and value", () => {
    expect(deserialize("  key  =  value  ")).toEqual({
      name: "key",
      value: "value",
    });
    expect(deserialize("\tkey\t=\tvalue\t")).toEqual({
      name: "key",
      value: "value",
    });
  });

  it("should return empty key for empty string", () => {
    expect(deserialize("")).toEqual({ name: "", value: "" });
  });

  it("should return empty key for string with only spaces", () => {
    expect(deserialize("   ")).toEqual({ name: "", value: "" });
  });

  it("should handle URL-encoded values", () => {
    expect(deserialize("key=value%20with%20spaces")).toEqual({
      name: "key",
      value: "value with spaces",
    });
  });

  it("should handle multiple equals signs in value", () => {
    expect(deserialize("key=value=with=equals")).toEqual({
      name: "key",
      value: "value=with=equals",
    });
  });

  describe('with "decode" option', () => {
    it("should use custom decode function", () => {
      const decode = (str: string) => str.replace(/-/g, " ");
      expect(deserialize("key=value-with-dashes", { decode })).toEqual({
        name: "key",
        value: "value with dashes",
      });
    });
  });

  describe("with expires", () => {
    it("should parse valid expires date", () => {
      expect(
        deserialize("key=value; Expires=Wed, 21 Oct 2015 07:28:00 GMT"),
      ).toEqual({
        name: "key",
        value: "value",
        expires: new Date("Wed, 21 Oct 2015 07:28:00 GMT"),
      });
    });

    it("should ignore invalid expires date", () => {
      expect(deserialize("key=value; Expires=InvalidDate")).toEqual({
        name: "key",
        value: "value",
      });
    });
  });

  describe('with "max-age"', () => {
    it("should parse valid max-age", () => {
      expect(deserialize("key=value; Max-Age=3600")).toEqual({
        name: "key",
        value: "value",
        maxAge: 3600,
      });
    });

    it("should ignore invalid max-age", () => {
      expect(deserialize("key=value; Max-Age=Invalid")).toEqual({
        name: "key",
        value: "value",
      });
    });
  });

  describe('with "domain"', () => {
    it("should set domain when provided", () => {
      expect(deserialize("key=value; Domain=example.com")).toEqual({
        name: "key",
        value: "value",
        domain: "example.com",
      });
    });
  });

  describe('with "path"', () => {
    it("should set path when provided", () => {
      expect(deserialize("key=value; Path=/some/path")).toEqual({
        name: "key",
        value: "value",
        path: "/some/path",
      });
    });
  });

  describe('with "httpOnly"', () => {
    it("should set httpOnly to true when set", () => {
      expect(deserialize("key=value; HttpOnly")).toEqual({
        name: "key",
        value: "value",
        httpOnly: true,
      });
    });
  });

  describe('with "secure"', () => {
    it("should set secure to true when set", () => {
      expect(deserialize("key=value; Secure")).toEqual({
        name: "key",
        value: "value",
        secure: true,
      });
    });
  });

  describe('with "partitioned"', () => {
    it("should set partitioned to true when set", () => {
      expect(deserialize("key=value; Partitioned")).toEqual({
        name: "key",
        value: "value",
        partitioned: true,
      });
    });
  });

  describe('with "sameSite"', () => {
    it("should set sameSite to 'Strict' when option is 'Strict'", () => {
      expect(deserialize("key=value; SameSite=Strict")).toEqual({
        name: "key",
        value: "value",
        sameSite: "strict",
      });

      expect(deserialize("key=value; SameSite=strict")).toEqual({
        name: "key",
        value: "value",
        sameSite: "strict",
      });
    });

    it("should set sameSite to 'Lax' when option is 'Lax'", () => {
      expect(deserialize("key=value; SameSite=Lax")).toEqual({
        name: "key",
        value: "value",
        sameSite: "lax",
      });

      expect(deserialize("key=value; SameSite=lax")).toEqual({
        name: "key",
        value: "value",
        sameSite: "lax",
      });
    });

    it("should set sameSite to 'None' when option is 'None'", () => {
      expect(deserialize("key=value; SameSite=None")).toEqual({
        name: "key",
        value: "value",
        sameSite: "none",
      });

      expect(deserialize("key=value; SameSite=none")).toEqual({
        name: "key",
        value: "value",
        sameSite: "none",
      });
    });

    it("should ignore invalid SameSite values", () => {
      expect(deserialize("key=value; SameSite=Invalid")).toEqual({
        name: "key",
        value: "value",
      });
    });
  });

  describe('with "priority"', () => {
    it("should set priority to 'Low' when option is 'Low'", () => {
      expect(deserialize("key=value; Priority=Low")).toEqual({
        name: "key",
        value: "value",
        priority: "low",
      });

      expect(deserialize("key=value; Priority=low")).toEqual({
        name: "key",
        value: "value",
        priority: "low",
      });
    });

    it("should set priority to 'Medium' when option is 'Medium'", () => {
      expect(deserialize("key=value; Priority=Medium")).toEqual({
        name: "key",
        value: "value",
        priority: "medium",
      });

      expect(deserialize("key=value; Priority=medium")).toEqual({
        name: "key",
        value: "value",
        priority: "medium",
      });
    });

    it("should set priority to 'High' when option is 'High'", () => {
      expect(deserialize("key=value; Priority=High")).toEqual({
        name: "key",
        value: "value",
        priority: "high",
      });

      expect(deserialize("key=value; Priority=high")).toEqual({
        name: "key",
        value: "value",
        priority: "high",
      });
    });

    it("should ignore invalid Priority values", () => {
      expect(deserialize("key=value; Priority=Invalid")).toEqual({
        name: "key",
        value: "value",
      });
    });
  });
});
