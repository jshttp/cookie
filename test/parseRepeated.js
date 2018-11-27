
var assert = require('assert');

var cookie = require('..');

suite('parseRepeated');

test('argument validation', function() {
  assert.throws(cookie.parseRepeated.bind(), /argument str must be a string/);
  assert.throws(cookie.parseRepeated.bind(null, 42), /argument str must be a string/);
});

test('basic', function() {
  assert.deepEqual({ foo: ['bar'] }, cookie.parseRepeated('foo=bar'));
  assert.deepEqual({ foo: ['123'] }, cookie.parseRepeated('foo=123'));
});

test('ignore spaces', function() {
  assert.deepEqual({ FOO: ['bar'], baz: ['raz'] },
    cookie.parseRepeated('FOO    = bar;   baz  =   raz'));
});

test('escaping', function() {
  assert.deepEqual({ foo: ['bar=123456789&name=Magic+Mouse'] },
    cookie.parseRepeated('foo="bar=123456789&name=Magic+Mouse"'));

  assert.deepEqual({ email: [' ",;/'] },
    cookie.parseRepeated('email=%20%22%2c%3b%2f'));
});

test('ignore escaping error and return original value', function() {
  assert.deepEqual({ foo: ['%1'], bar: ['bar'] }, cookie.parseRepeated('foo=%1;bar=bar'));
});

test('ignore non values', function() {
  assert.deepEqual({ foo: ['%1'], bar: ['bar'] }, cookie.parseRepeated('foo=%1;bar=bar;HttpOnly;Secure'));
});

test('unencoded', function() {
  assert.deepEqual({ foo: ['bar=123456789&name=Magic+Mouse'] },
    cookie.parseRepeated('foo="bar=123456789&name=Magic+Mouse"',{
      decode: function(value) { return value; }
    }));

  assert.deepEqual({ email: ['%20%22%2c%3b%2f'] },
    cookie.parseRepeated('email=%20%22%2c%3b%2f',{
      decode: function(value) { return value; }
    }));
});

test('dates', function() {
  assert.deepEqual({ priority: ['true'], Path: ['/'], expires: ['Wed, 29 Jan 2014 17:43:25 GMT'] },
    cookie.parseRepeated('priority=true; expires=Wed, 29 Jan 2014 17:43:25 GMT; Path=/',{
      decode: function(value) { return value; }
    }));
});

test('missing value', function() {
  assert.deepEqual({ bar: ['1'], fizz: [''], buzz: ['2'] },
    cookie.parseRepeated('foo; bar=1; fizz= ; buzz=2',{
      decode: function(value) { return value; }
    }));
});

test('assign repeated values into an array', function() {
  assert.deepEqual({ foo: ['%1', 'boo'], bar: ['bar'] },
    cookie.parseRepeated('foo=%1;bar=bar;foo=boo'));
  assert.deepEqual({ foo: ['false', 'true'], bar: ['bar'] },
    cookie.parseRepeated('foo=false;bar=bar;foo=true'));
  assert.deepEqual({ foo: ['', 'boo'], bar: ['bar'] },
    cookie.parseRepeated('foo=;bar=bar;foo=boo'));
});
