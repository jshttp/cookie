import { describe, bench } from "vitest";
import * as cookie from "./index.js";
import top from "../scripts/top-set-cookie.json";

describe("parse top-sites", () => {
  Object.entries(top).forEach(function ([domain, values]) {
    bench("parse " + domain, () => {
      for (const value of values) {
        cookie.parseSetCookie(value);
      }
    });
  });
});
