/**
 * Module dependencies.
 */

var benchmark = require('benchmark')
var benchmarks = require('beautify-benchmark')
var top = require('./parse-top.json')

/**
  * Globals for benchmark.js
  */

global.cookie = require('..')

var suite = new benchmark.Suite()

Object.keys(top).forEach(function (domain) {
  suite.add({
    name: 'parse ' + domain,
    minSamples: 100,
    fn: 'var val = cookie.parse(' + JSON.stringify(top[domain]) + ')'
  })
})

suite.on('start', function () {
  process.stdout.write('  cookie.parse - top sites\n\n')
})

suite.on('cycle', function (event) {
  benchmarks.add(event.target)
})

suite.on('complete', function () {
  benchmarks.log()
})

suite.run({ async: false })
