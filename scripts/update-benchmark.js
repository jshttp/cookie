"use strict";

const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const topSites = require("top-sites");
const url = require("url");

const BENCH_COOKIES_FILE = path.join(__dirname, "parse-top.json");
const domains = topSites.slice(0, 30).map((x) => x.rootDomain);

getAllCookies(domains, function (err, cookies) {
  if (err) throw err;

  const str = JSON.stringify(
    Object.fromEntries(
      Object.keys(cookies)
        .sort()
        .map((key) => [key, cookies[key]])
        .concat([["example.com", ""]]),
    ),
    null,
    2,
  );

  fs.writeFile(BENCH_COOKIES_FILE, `${str}\n`, function (err) {
    if (err) throw err;
    console.log("Cookies saved to", BENCH_COOKIES_FILE);
    process.exit();
  });
});

function get(href, callback) {
  const protocol = url.parse(href, false, true).protocol;
  const proto = protocol === "https:" ? https : http;

  proto
    .get(href)
    .on("error", callback)
    .on("response", function (res) {
      if (
        res.headers.location &&
        res.statusCode >= 300 &&
        res.statusCode < 400
      ) {
        get(url.resolve(href, res.headers.location), callback);
      } else {
        callback(null, res);
      }
    });
}

function getAllCookies(domains, callback) {
  const all = Object.create(null);
  let wait = domains.length;

  domains.forEach(function (domain) {
    getCookies(domain, function (err, cookies) {
      if (!err && cookies.length) {
        all[domain] = cookies.map(obfuscate).join("; ");
      }
      if (!--wait) {
        callback(null, all);
      }
    });
  });
}

function getCookies(domain, callback) {
  const href = url.format({ hostname: domain, protocol: "http" });
  get(href, function (err, res) {
    if (err) return callback(err);
    const cookies = (res.headers["set-cookie"] || []).map(function (c) {
      return c.split(";")[0];
    });
    callback(null, cookies);
  });
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
