"use strict";

const fs = require("fs/promises");
const http = require("http");
const https = require("https");
const path = require("path");
const topSites = require("top-sites");
const url = require("url");

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

function get(href) {
  const protocol = url.parse(href, false, true).protocol;
  const proto = protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    proto
      .get(href)
      .on("error", reject)
      .on("response", function (res) {
        if (
          res.headers.location &&
          res.statusCode >= 300 &&
          res.statusCode < 400
        ) {
          return resolve(get(url.resolve(href, res.headers.location)));
        }

        return resolve(res);
      });
  });
}

async function getAllCookies(domains) {
  const allCookies = Object.create(null);
  const allSetCookies = Object.create(null);

  for (const domain of domains) {
    const setCookies = await getSetCookies(domain);
    if (!setCookies.length) continue;

    const cookies = toCookies(setCookies);
    allCookies[domain] = cookies.map(obfuscate).join("; ");
    allSetCookies[domain] = setCookies.map((header, index) => {
      const attrs = header.split(";");
      return [obfuscate(attrs.shift(), index), ...attrs].join("; ");
    });
  }

  return [allCookies, allSetCookies];
}

async function getSetCookies(domain) {
  const href = url.format({ hostname: domain, protocol: "http" });
  try {
    const res = await get(href);
    return res.headers["set-cookie"] || [];
  } catch (err) {
    if (err.code === "ENOTFOUND") return [];
    throw err;
  }
}

function toCookies(setCookies) {
  return setCookies.map((c) => c.split(";")[0]);
}

function obfuscate(str, index) {
  return str
    .replace(/%[0-9a-f]{2}/gi, function () {
      return "%__";
    })
    .replace(/[a-z]/g, function () {
      return String.fromCharCode(97 + ((index || 0) % 26));
    })
    .replace(/[A-Z]/g, function () {
      return String.fromCharCode(65 + ((index || 0) % 26));
    })
    .replace(/[0-9]/g, function () {
      return (index || 0) % 10;
    })
    .replace(/%__/g, function () {
      return "%22";
    });
}

function sortObject(obj) {
  return Object.fromEntries(Object.entries(obj).sort());
}
