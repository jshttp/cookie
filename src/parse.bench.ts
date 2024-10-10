import { describe, bench } from "vitest";
import * as cookie from "./index.js";
import top from "../scripts/parse-top.json";

describe("parse", () => {
  bench("simple", () => {
    cookie.parse("foo=bar");
  });

  bench("decode", () => {
    cookie.parse("foo=hello%20there!");
  });

  bench("unquote", () => {
    cookie.parse('foo="foo bar"');
  });

  const duplicates = genCookies(2) + "; " + genCookies(2);
  bench("duplicates", () => {
    cookie.parse(duplicates);
  });

  const cookies10 = genCookies(10);
  bench("10 cookies", () => {
    cookie.parse(cookies10);
  });

  const cookies100 = genCookies(100);
  bench("100 cookies", () => {
    cookie.parse(cookies100);
  });
});

describe("parse top-sites", () => {
  Object.entries(top).forEach(function ([domain, value]) {
    bench("parse " + domain, () => {
      cookie.parse(value);
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
