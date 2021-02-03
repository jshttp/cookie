
var assert = require('assert');

var cookie = require('..');

suite('parse');

test('argument validation', function() {
  assert.throws(cookie.parse.bind(), /argument str must be a string/);
  assert.throws(cookie.parse.bind(null, 42), /argument str must be a string/);
});

test('basic', function() {
  assert.deepStrictEqual({ foo: 'bar' }, cookie.parse('foo=bar'));
  assert.deepStrictEqual({ foo: '123' }, cookie.parse('foo=123'));
});

test('ignore spaces', function() {
  assert.deepStrictEqual({ FOO: 'bar', baz: 'raz' },
    cookie.parse('FOO    = bar;   baz  =   raz'));
});

test('escaping', function() {
  assert.deepStrictEqual({ foo: 'bar=123456789&name=Magic+Mouse' },
    cookie.parse('foo="bar=123456789&name=Magic+Mouse"'));

  assert.deepStrictEqual({ email: ' ",;/' },
    cookie.parse('email=%20%22%2c%3b%2f'));
});

test('ignore escaping error and return original value', function() {
  assert.deepStrictEqual({ foo: '%1', bar: 'bar' }, cookie.parse('foo=%1;bar=bar'));
});

test('ignore non values', function() {
  assert.deepStrictEqual({ foo: '%1', bar: 'bar' }, cookie.parse('foo=%1;bar=bar;HttpOnly;Secure'));
});

test('unencoded', function() {
  assert.deepStrictEqual({ foo: 'bar=123456789&name=Magic+Mouse' },
    cookie.parse('foo="bar=123456789&name=Magic+Mouse"',{
      decode: function(value) { return value; }
    }));

  assert.deepStrictEqual({ email: '%20%22%2c%3b%2f' },
    cookie.parse('email=%20%22%2c%3b%2f',{
      decode: function(value) { return value; }
    }));
});

test('dates', function() {
  assert.deepStrictEqual({ priority: 'true', Path: '/', expires: 'Wed, 29 Jan 2014 17:43:25 GMT' },
    cookie.parse('priority=true; expires=Wed, 29 Jan 2014 17:43:25 GMT; Path=/',{
      decode: function(value) { return value; }
    }));
});

test('missing value', function() {
  assert.deepStrictEqual({ bar: '1', fizz: '', buzz: '2' },
    cookie.parse('foo; bar=1; fizz= ; buzz=2',{
      decode: function(value) { return value; }
    }));
});

test('assign only once', function() {
  assert.deepStrictEqual({ foo: '%1', bar: 'bar' },
    cookie.parse('foo=%1;bar=bar;foo=boo'));
  assert.deepStrictEqual({ foo: 'false', bar: 'bar' },
    cookie.parse('foo=false;bar=bar;foo=true'));
  assert.deepStrictEqual({ foo: '', bar: 'bar' },
    cookie.parse('foo=;bar=bar;foo=boo'));
});
