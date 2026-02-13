import { describe, bench } from "vitest";
import * as cookie from "./index.js";

describe("cookie.stringifyCookie", () => {
  bench("empty", () => {
    cookie.stringifyCookie({});
  });

  bench("simple", () => {
    cookie.stringifyCookie({ foo: "bar" });
  });

  bench("undefined values", () => {
    cookie.stringifyCookie({
      foo: "bar",
      baz: undefined,
      qux: "quux",
      zap: undefined,
    });
  });

  const cookies10 = genCookies(10);
  bench("10 cookies", () => {
    cookie.stringifyCookie(cookies10);
  });

  const cookies100 = genCookies(100);
  bench("100 cookies", () => {
    cookie.stringifyCookie(cookies100);
  });
});

function genCookies(num: number) {
  const cookies: Record<string, string | undefined> = {};

  for (let i = 0; i < num; i++) {
    cookies["foo" + i] = "bar" + i;
  }

  return cookies;
}
