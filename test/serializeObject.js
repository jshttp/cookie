// builtin
var assert = require('assert');

var cookie = require('..');

suite('serializeObject');

test('basic', function() {
  assert.deepEqual(['foo=bar'], cookie.serializeObject({foo: 'bar'}));
  assert.deepEqual(['foo=bar', 'bar=foo'], cookie.serializeObject({foo: 'bar', bar: 'foo'}));
  assert.deepEqual(['foo=bar%20baz'], cookie.serializeObject({foo: 'bar baz'}));
  assert.deepEqual(['foo='], cookie.serializeObject({foo: ''}));
  assert.throws(cookie.serializeObject.bind(cookie, "invalid"), /cookies must be an object/);
  assert.throws(cookie.serializeObject.bind(cookie, {'foo\n': 'bar'}), /argument name is invalid/);
  assert.throws(cookie.serializeObject.bind(cookie, {'foo\u280a': 'bar'}), /argument name is invalid/);
  assert.throws(cookie.serializeObject.bind(cookie, {'foo': 'bar'}, {encode: 42}), /option encode is invalid/);
});

test('path', function() {
  assert.deepEqual(['foo=bar; Path=/'], cookie.serializeObject({foo: 'bar'}, {
    path: '/'
  }));

  assert.throws(cookie.serializeObject.bind(cookie, {foo: 'bar'}, {
    path: '/\n'
  }), /option path is invalid/);
});

test('secure', function() {
  assert.deepEqual(['foo=bar; Secure'], cookie.serializeObject({foo: 'bar'}, {
    secure: true
  }));

  assert.deepEqual(['foo=bar'], cookie.serializeObject({foo: 'bar'}, {
    secure: false
  }));
});

test('domain', function() {
  assert.deepEqual(['foo=bar; Domain=example.com'], cookie.serializeObject({foo: 'bar'}, {
    domain: 'example.com'
  }));

  assert.throws(cookie.serializeObject.bind(cookie, {foo: 'bar'}, {
    domain: 'example.com\n'
  }), /option domain is invalid/);
});

test('httpOnly', function() {
  assert.deepEqual(['foo=bar; HttpOnly', 'bar=foo; HttpOnly'], cookie.serializeObject({foo: 'bar', bar: 'foo'}, {
    httpOnly: true
  }));
});

test('maxAge', function() {
  assert.throws(function () {
    cookie.serializeObject({foo: 'bar'}, {
      maxAge: 'buzz'
    });
  }, /maxAge should be a Number/);

  assert.deepEqual(['foo=bar; Max-Age=1000'], cookie.serializeObject({foo: 'bar'}, {
    maxAge: 1000
  }));

  assert.deepEqual(['foo=bar; Max-Age=1000'], cookie.serializeObject({foo: 'bar'}, {
    maxAge: '1000'
  }));

  assert.deepEqual(['foo=bar; Max-Age=0'], cookie.serializeObject({foo: 'bar'}, {
    maxAge: 0
  }));

  assert.deepEqual(['foo=bar; Max-Age=0'], cookie.serializeObject({foo: 'bar'}, {
    maxAge: '0'
  }));

  assert.deepEqual(['foo=bar'], cookie.serializeObject({foo: 'bar'}, {
    maxAge: null
  }));

  assert.deepEqual(['foo=bar'], cookie.serializeObject({foo: 'bar'}, {
    maxAge: undefined
  }));

  assert.deepEqual(['foo=bar; Max-Age=3'], cookie.serializeObject({foo: 'bar'}, {
    maxAge: 3.14
  }));
});

test('expires', function() {
  assert.deepEqual(['foo=bar; Expires=Sun, 24 Dec 2000 10:30:59 GMT'], cookie.serializeObject({foo: 'bar'}, {
    expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900))
  }));

  assert.throws(cookie.serializeObject.bind(cookie, {foo: 'bar'}, {
    expires: Date.now()
  }), /option expires is invalid/);
});

test('sameSite', function() {
  assert.deepEqual(['foo=bar; SameSite=Strict'], cookie.serializeObject({foo: 'bar'}, {
    sameSite: true
  }));

  assert.deepEqual(['foo=bar; SameSite=Strict'], cookie.serializeObject({foo: 'bar'}, {
    sameSite: 'Strict'
  }));

  assert.deepEqual(['foo=bar; SameSite=Strict'], cookie.serializeObject({foo: 'bar'}, {
    sameSite: 'strict'
  }));

  assert.deepEqual(['foo=bar; SameSite=Lax'], cookie.serializeObject({foo: 'bar'}, {
    sameSite: 'Lax'
  }));

  assert.deepEqual(['foo=bar; SameSite=Lax'], cookie.serializeObject({foo: 'bar'}, {
    sameSite: 'lax'
  }));

  assert.deepEqual(['foo=bar; SameSite=None'], cookie.serializeObject({foo: 'bar'}, {
    sameSite: 'None'
  }));

  assert.deepEqual(['foo=bar; SameSite=None'], cookie.serializeObject({foo: 'bar'}, {
    sameSite: 'none'
  }));

  assert.deepEqual(['foo=bar'], cookie.serializeObject({foo: 'bar'}, {
    sameSite: false
  }));

  assert.throws(cookie.serializeObject.bind(cookie, {foo: 'bar'}, {
    sameSite: 'foo'
  }), /option sameSite is invalid/);
});

test('escaping', function() {
  assert.deepEqual(['cat=%2B%20'], cookie.serializeObject({cat: '+ '}));
});

test('parse->serialize', function() {

  assert.deepEqual({ cat: 'foo=123&name=baz five' }, cookie.parse(
    cookie.serializeObject({'cat': 'foo=123&name=baz five'})[0]));

  assert.deepEqual({ cat: ' ";/' }, cookie.parse(
    cookie.serializeObject({cat: ' ";/'})[0]));
});

test('unencoded', function() {
  assert.deepEqual('cat=+ ', cookie.serializeObject({cat: '+ '}, {
    encode: function(value) { return value; }
  })[0]);

  assert.throws(cookie.serializeObject.bind(cookie, {cat: '+ \n'}, {
    encode: function(value) { return value; }
  }), /argument val is invalid/);
})
