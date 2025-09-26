import { describe, expect, it } from "vitest";
import { stringifyCookie } from "./index.js";

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

  it("should error on invalid keys", () => {
    expect(() => stringifyCookie({ "test=": "" })).toThrow(
      /cookie name is invalid/,
    );
  });

  it("should error on invalid values", () => {
    expect(() => stringifyCookie({ test: ";" }, { encode: (x) => x })).toThrow(
      /cookie val is invalid/,
    );
  });
});
