import * as fs from "fs/promises";
import * as path from "path";
import topSites from "top-sites" with { type: "json" };
import * as url from "url";

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BENCH_COOKIES_FILE = path.join(__dirname, "top-cookie.json");
const BENCH_SET_COOKIES_FILE = path.join(__dirname, "top-set-cookie.json");
const domains = topSites.slice(0, 20).map((x) => x.rootDomain);

async function main() {
  const [cookies, setCookies] = await getAllCookies(domains);

  await fs.writeFile(
    BENCH_COOKIES_FILE,
    JSON.stringify(sortObject(cookies), null, 2) + "\n",
  );

  await fs.writeFile(
    BENCH_SET_COOKIES_FILE,
    JSON.stringify(sortObject(setCookies), null, 2) + "\n",
  );

  console.log("Cookies saved");
  process.exit();
}

main();

async function get(href: string) {
  const res = await fetch(href);
  const location = res.headers.get("location");
  if (location && res.status >= 300 && res.status < 400) {
    return get(new URL(location, href).href);
  }

  return res;
}

async function getAllCookies(domains: string[]) {
  const allCookies: Record<string, string> = Object.create(null);
  const allSetCookies: Record<string, string[]> = Object.create(null);

  for (const domain of domains) {
    const setCookies = await getSetCookies(domain);
    if (!setCookies.length) continue;

    const cookies = toCookies(setCookies);
    allCookies[domain] = cookies.map(obfuscate).join("; ");
    allSetCookies[domain] = setCookies.map((header, index) => {
      const attrs = header.split(";");
      return [obfuscate(attrs.shift() || "", index), ...attrs].join("; ");
    });
  }

  return [allCookies, allSetCookies] as const;
}

async function getSetCookies(domain: string) {
  const href = url.format({ hostname: domain, protocol: "http" });
  const res = await get(href);
  return res.headers.getSetCookie();
}

function toCookies(setCookies: string[]) {
  return setCookies.map((c) => c.split(";")[0]);
}

function obfuscate(str: string, index: number) {
  return str
    .replace(/%[0-9a-f]{2}/gi, () => {
      return "%__";
    })
    .replace(/[a-z]/g, () => {
      return String.fromCharCode(97 + ((index || 0) % 26));
    })
    .replace(/[A-Z]/g, () => {
      return String.fromCharCode(65 + ((index || 0) % 26));
    })
    .replace(/[0-9]/g, () => {
      return String((index || 0) % 10);
    })
    .replace(/%__/g, () => {
      return "%22";
    });
}

function sortObject<T>(obj: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).sort());
}
