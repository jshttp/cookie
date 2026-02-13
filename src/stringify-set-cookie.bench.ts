import { describe, bench } from "vitest";
import * as cookie from "./index.js";

describe("cookie.stringifySetCookie", () => {
  bench("simple", () => {
    cookie.stringifySetCookie("foo", "bar");
  });

  bench("encode", () => {
    cookie.stringifySetCookie("foo", "hello there!");
  });

  const expires = new Date("Wed, 21 Oct 2015 07:28:00 GMT");
  bench("attributes", () => {
    cookie.stringifySetCookie("foo", "bar", {
      path: "/",
      domain: "example.com",
      maxAge: 3600,
      expires,
      httpOnly: true,
      secure: true,
      partitioned: true,
      priority: "high",
      sameSite: "lax",
    });
  });

  bench("object input", () => {
    cookie.stringifySetCookie({
      name: "foo",
      value: "bar",
      path: "/",
      maxAge: 3600,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  });

  const setCookies10 = genSetCookies(10);
  bench("10 set-cookies", () => {
    for (const setCookie of setCookies10) {
      cookie.stringifySetCookie(setCookie);
    }
  });

  const setCookies100 = genSetCookies(100);
  bench("100 set-cookies", () => {
    for (const setCookie of setCookies100) {
      cookie.stringifySetCookie(setCookie);
    }
  });
});

function genSetCookies(num: number): cookie.SetCookie[] {
  const cookies: cookie.SetCookie[] = [];

  for (let i = 0; i < num; i++) {
    cookies.push({
      name: "foo" + i,
      value: "bar " + i,
      path: "/foo" + i,
      maxAge: 3600,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  }

  return cookies;
}
