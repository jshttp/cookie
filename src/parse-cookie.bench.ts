import { describe, bench } from "vitest";
import * as cookie from "./index.js";
import top from "../scripts/top-cookie.json";

describe("cookie.parseCookie", () => {
  bench("empty", () => {
    cookie.parseCookie("");
  });

  bench("simple", () => {
    cookie.parseCookie("foo=bar");
  });

  bench("decode", () => {
    cookie.parseCookie("foo=hello%20there!");
  });

  bench("unquote", () => {
    cookie.parseCookie('foo="foo bar"');
  });

  const duplicates = genCookies(2) + "; " + genCookies(2);
  bench("duplicates", () => {
    cookie.parseCookie(duplicates);
  });

  const cookies10 = genCookies(10);
  bench("10 cookies", () => {
    cookie.parseCookie(cookies10);
  });

  const cookies100 = genCookies(100);
  bench("100 cookies", () => {
    cookie.parseCookie(cookies100);
  });
});

describe("parse top-sites", () => {
  Object.entries(top).forEach(function ([domain, value]) {
    bench("parse " + domain, () => {
      cookie.parseCookie(value);
    });
  });
});

function genCookies(num: number) {
  let str = "";

  for (let i = 0; i < num; i++) {
    str += "; foo" + i + "=bar";
  }

  return str.slice(2);
}
