import { describe, expect, it } from "vitest";
import { stringify } from "./index.js";

describe("stringify", () => {
  it("should stringify object", () => {
    expect(stringify({ key: "value" })).toEqual("key=value");
  });

  it("should stringify objects with multiple entries", () => {
    expect(stringify({ a: "1", b: "2" })).toEqual("a=1; b=2");
  });

  it("should ignore undefined values", () => {
    expect(stringify({ a: "1", b: undefined })).toEqual("a=1");
  });

  it("should error on invalid keys", () => {
    expect(() => stringify({ "test=": "" })).toThrow(/cookie name is invalid/);
  });

  it("should error on invalid values", () => {
    expect(() => stringify({ test: ";" }, { encode: (x) => x })).toThrow(
      /cookie val is invalid/,
    );
  });
});
