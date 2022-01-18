
var assert = require('assert');

var cookie = require('..');

suite('parse');

test('argument validation', function() {
  assert.throws(cookie.parse.bind(), /argument str must be a string/);
  assert.throws(cookie.parse.bind(null, 42), /argument str must be a string/);
});

test('basic', function() {
  assert.deepEqual(cookie.parse('foo=bar'), { foo: 'bar' })
  assert.deepEqual(cookie.parse('foo=123'), { foo: '123' })
});

test('ignore spaces', function() {
  assert.deepEqual(cookie.parse('FOO    = bar;   baz  =   raz'),
    { FOO: 'bar', baz: 'raz' })
});

test('escaping', function() {
  assert.deepEqual(cookie.parse('foo="bar=123456789&name=Magic+Mouse"'),
    { foo: 'bar=123456789&name=Magic+Mouse' })

  assert.deepEqual(cookie.parse('email=%20%22%2c%3b%2f'), { email: ' ",;/' })
});

test('ignore escaping error and return original value', function() {
  assert.deepEqual(cookie.parse('foo=%1;bar=bar'), { foo: '%1', bar: 'bar' })
});

test('ignore non values', function() {
  assert.deepEqual(cookie.parse('foo=%1;bar=bar;HttpOnly;Secure'),
    { foo: '%1', bar: 'bar' })
});

test('unencoded', function() {
  assert.deepEqual(cookie.parse('foo="bar=123456789&name=Magic+Mouse"', {
    decode: function (v) { return v }
  }), { foo: 'bar=123456789&name=Magic+Mouse' })

  assert.deepEqual(cookie.parse('email=%20%22%2c%3b%2f', {
    decode: function (v) { return v }
  }), { email: '%20%22%2c%3b%2f' })
});

test('dates', function() {
  assert.deepEqual(cookie.parse('priority=true; expires=Wed, 29 Jan 2014 17:43:25 GMT; Path=/', {
    decode: function (v) { return v }
  }), { priority: 'true', Path: '/', expires: 'Wed, 29 Jan 2014 17:43:25 GMT' })
});

test('missing value', function() {
  assert.deepEqual(cookie.parse('foo; bar=1; fizz= ; buzz=2', {
    decode: function (v) { return v }
  }), { bar: '1', fizz: '', buzz: '2' })
});

test('assign only once', function() {
  assert.deepEqual(cookie.parse('foo=%1;bar=bar;foo=boo'), { foo: '%1', bar: 'bar' })
  assert.deepEqual(cookie.parse('foo=false;bar=bar;foo=true'), { foo: 'false', bar: 'bar' })
  assert.deepEqual(cookie.parse('foo=;bar=bar;foo=boo'), { foo: '', bar: 'bar' })
});

test('multiValuedCookies flag', function () {
  assert.deepEqual(
    { foo: ["%1", "boo"], bar: "bar" },
    cookie.parse("foo=%1;bar=bar;foo=boo", {
      multiValuedCookies: true
    })
  );
  assert.deepEqual(
    { foo: ["", "boo"], bar: "bar" },
    cookie.parse("foo=;bar=bar;foo=boo", {
      multiValuedCookies: true,
    })
  );
  assert.deepEqual(
    { foo: ["%1", "boo", "bar"], bar: "bar" },
    cookie.parse("foo=%1;bar=bar;foo=boo;foo=bar", {
      multiValuedCookies: true,
    })
  );
  assert.deepEqual(
    { foo: "%1", bar: "bar" },
    cookie.parse("foo=%1;bar=bar", {
      multiValuedCookies: true,
    })
  );
});
