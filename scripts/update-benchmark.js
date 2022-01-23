'use strict'

var fs = require('fs')
var http = require('http')
var https = require('https')
var path = require('path')
var topSites = require('top-sites')
var url = require('url')

var BENCH_COOKIES_FILE = path.join(__dirname, '..', 'benchmark', 'parse-top.json')

getAllCookies(topSites.slice(0, 20), function (err, cookies) {
  if (err) throw err
  var str = '{\n' +
    Object.keys(cookies).sort().map(function (key) {
      return '  ' + JSON.stringify(key) + ': ' + JSON.stringify(cookies[key])
    }).join(',\n') +
    '\n}\n'
  fs.writeFileSync(BENCH_COOKIES_FILE, str)
})

function get (href, callback) {
  var protocol = url.parse(href, false, true).protocol
  var proto = protocol === 'https:' ? https : http

  proto.get(href)
    .on('error', callback)
    .on('response', function (res) {
      if (res.headers.location && res.statusCode >= 300 && res.statusCode < 400) {
        get(url.resolve(href, res.headers.location), callback)
      } else {
        callback(null, res)
      }
    })
}

function getAllCookies (sites, callback) {
  var all = Object.create(null)
  var wait = sites.length

  sites.forEach(function (site) {
    getCookies(site, function (err, cookies) {
      if (!err && cookies.length) {
        all[site.rootDomain] = cookies.map(obfuscate).join('; ')
      }
      if (!--wait) {
        callback(null, all)
      }
    })
  })
}

function getCookies (site, callback) {
  var href = url.format({ hostname: site.rootDomain, protocol: 'http' })
  get(href, function (err, res) {
    if (err) return callback(err)
    var cookies = (res.headers['set-cookie'] || []).map(function (c) { return c.split(';')[0] })
    callback(null, cookies)
  })
}

function obfuscate (str) {
  return str
    .replace(/%[0-9a-f]{2}/gi, function () { return '%__' })
    .replace(/[a-z]/g, function () { return 'l' })
    .replace(/[A-Z]/g, function () { return 'U' })
    .replace(/[0-9]/g, function () { return '0' })
    .replace(/%__/g, function () { return '%22' })
}
