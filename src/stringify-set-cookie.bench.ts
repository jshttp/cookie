import { describe, bench } from "vitest";
import * as cookie from "./index.js";

describe("cookie.stringifySetCookie", () => {
  bench("simple", () => {
    cookie.stringifySetCookie({
      name: "foo",
      value: "bar",
    });
  });

  bench("encode", () => {
    cookie.stringifySetCookie({
      name: "foo",
      value: "hello there!",
    });
  });

  const expires = new Date("Wed, 21 Oct 2015 07:28:00 GMT");
  bench("all attributes", () => {
    cookie.stringifySetCookie({
      name: "foo",
      value: "bar",
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

  bench("typical object", () => {
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
});
