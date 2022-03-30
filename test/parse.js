
var assert = require('assert');
var Buffer = require('safe-buffer').Buffer

var cookie = require('..');

describe('cookie.parse(str)', function () {
  it('should throw with no arguments', function () {
    assert.throws(cookie.parse.bind(), /argument str must be a string/)
  })

  it('should throw when not a string', function () {
    assert.throws(cookie.parse.bind(null, 42), /argument str must be a string/)
  })

  it('should parse cookie string to object', function () {
    assert.deepEqual(cookie.parse('foo=bar'), { foo: 'bar' })
    assert.deepEqual(cookie.parse('foo=123'), { foo: '123' })
  })

  it('should ignore OWS', function () {
    assert.deepEqual(cookie.parse('FOO    = bar;   baz  =   raz'),
      { FOO: 'bar', baz: 'raz' })
  })

  it('should parse cookie with empty value', function () {
    assert.deepEqual(cookie.parse('foo= ; bar='), { foo: '', bar: '' })
  })

  it('should URL-decode values', function () {
    assert.deepEqual(cookie.parse('foo="bar=123456789&name=Magic+Mouse"'),
      { foo: 'bar=123456789&name=Magic+Mouse' })

    assert.deepEqual(cookie.parse('email=%20%22%2c%3b%2f'), { email: ' ",;/' })
  })

  it('should return original value on escape error', function () {
    assert.deepEqual(cookie.parse('foo=%1;bar=bar'), { foo: '%1', bar: 'bar' })
  })

  it('should ignore cookies without value', function () {
    assert.deepEqual(cookie.parse('foo=bar;fizz  ;  buzz'), { foo: 'bar' })
    assert.deepEqual(cookie.parse('  fizz; foo=  bar'), { foo: 'bar' })
  })

  it('should ignore duplicate cookies', function () {
    assert.deepEqual(cookie.parse('foo=%1;bar=bar;foo=boo'), { foo: '%1', bar: 'bar' })
    assert.deepEqual(cookie.parse('foo=false;bar=bar;foo=true'), { foo: 'false', bar: 'bar' })
    assert.deepEqual(cookie.parse('foo=;bar=bar;foo=boo'), { foo: '', bar: 'bar' })
  })
})

describe('cookie.parse(str, options)', function () {
  describe('with "decode" option', function () {
    it('should specify alternative value decoder', function () {
      assert.deepEqual(cookie.parse('foo="YmFy"', {
        decode: function (v) { return Buffer.from(v, 'base64').toString() }
      }), { foo: 'bar' })
    })
  })
})
