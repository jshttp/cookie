/**
 * Module dependencies.
 */

var benchmark = require('benchmark')
var benchmarks = require('beautify-benchmark')

/**
 * Globals for benchmark.js
 */

global.cookie = require('..')

var suite = new benchmark.Suite()

suite.add({
  name: 'simple',
  minSamples: 100,
  fn: "var val = cookie.serializeObject({foo: 'bar'})"
})

suite.add({
  name: 'multiple',
  minSamples: 100,
  fn: "var val = cookie.serializeObject({foo: 'bar', bar: 'foo'})"
})

suite.add({
  name: '10 cookies',
  minSamples: 100,
  fn: 'var val = cookie.serializeObject(' + JSON.stringify(gencookies(10)) + ')'
})

suite.add({
  name: '100 cookies',
  minSamples: 100,
  fn: 'var val = cookie.serializeObject(' + JSON.stringify(gencookies(100)) + ')'
})

suite.on('start', function onCycle (event) {
  process.stdout.write('  cookie.serializeObject\n\n')
})

suite.on('cycle', function onCycle (event) {
  benchmarks.add(event.target)
})

suite.on('complete', function onComplete () {
  benchmarks.log()
})

suite.run({async: false})

function gencookies (num) {
  var obj = {}

  for (var i = 0; i < num; i++) {
    obj['foo' + i] = 'bar';  }

  return obj
}
