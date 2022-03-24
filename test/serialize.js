// builtin
var assert = require('assert');

var cookie = require('..');

suite('serialize');

test('basic', function() {
  assert.equal(cookie.serialize('foo', 'bar'), 'foo=bar')
  assert.equal(cookie.serialize('foo', 'bar baz'), 'foo=bar%20baz')
  assert.equal(cookie.serialize('foo', ''), 'foo=')
  assert.throws(cookie.serialize.bind(cookie, 'foo\n', 'bar'), /argument name is invalid/);
  assert.throws(cookie.serialize.bind(cookie, 'foo\u280a', 'bar'), /argument name is invalid/);
  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {encode: 42}), /option encode is invalid/);
});

test('path', function() {
  assert.equal(cookie.serialize('foo', 'bar', { path: '/' }), 'foo=bar; Path=/')
  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    path: '/\n'
  }), /option path is invalid/);
});

test('secure', function() {
  assert.equal(cookie.serialize('foo', 'bar', { secure: true }), 'foo=bar; Secure')
  assert.equal(cookie.serialize('foo', 'bar', { secure: false }), 'foo=bar')
});

test('domain', function() {
  assert.equal(cookie.serialize('foo', 'bar', { domain: 'example.com' }), 'foo=bar; Domain=example.com')
  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    domain: 'example.com\n'
  }), /option domain is invalid/);
});

test('httpOnly', function() {
  assert.equal(cookie.serialize('foo', 'bar', { httpOnly: true }), 'foo=bar; HttpOnly')
});

test('maxAge', function() {
  assert.throws(function () {
    cookie.serialize('foo', 'bar', {
      maxAge: 'buzz'
    });
  }, /option maxAge is invalid/)

  assert.throws(function () {
    cookie.serialize('foo', 'bar', {
      maxAge: Infinity
    })
  }, /option maxAge is invalid/)

  assert.equal(cookie.serialize('foo', 'bar', { maxAge: 1000 }), 'foo=bar; Max-Age=1000')
  assert.equal(cookie.serialize('foo', 'bar', { maxAge: '1000' }), 'foo=bar; Max-Age=1000')
  assert.equal(cookie.serialize('foo', 'bar', { maxAge: 0 }), 'foo=bar; Max-Age=0')
  assert.equal(cookie.serialize('foo', 'bar', { maxAge: '0' }), 'foo=bar; Max-Age=0')
  assert.equal(cookie.serialize('foo', 'bar', { maxAge: null }), 'foo=bar')
  assert.equal(cookie.serialize('foo', 'bar', { maxAge: undefined }), 'foo=bar')
  assert.equal(cookie.serialize('foo', 'bar', { maxAge: 3.14 }), 'foo=bar; Max-Age=3')
});

test('expires', function() {
  assert.equal(cookie.serialize('foo', 'bar', {
    expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900))
  }), 'foo=bar; Expires=Sun, 24 Dec 2000 10:30:59 GMT')

  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    expires: Date.now()
  }), /option expires is invalid/);
});

test('priority', function () {
  assert.equal(cookie.serialize('foo', 'bar', { priority: 'Low' }), 'foo=bar; Priority=Low')
  assert.equal(cookie.serialize('foo', 'bar', { priority: 'loW' }), 'foo=bar; Priority=Low')
  assert.equal(cookie.serialize('foo', 'bar', { priority: 'Medium' }), 'foo=bar; Priority=Medium')
  assert.equal(cookie.serialize('foo', 'bar', { priority: 'medium' }), 'foo=bar; Priority=Medium')
  assert.equal(cookie.serialize('foo', 'bar', { priority: 'High' }), 'foo=bar; Priority=High')
  assert.equal(cookie.serialize('foo', 'bar', { priority: 'HIGH' }), 'foo=bar; Priority=High')

  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    priority: 'foo'
  }), /option priority is invalid/)

  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    priority: 42
  }), /option priority is invalid/)
})

test('sameSite', function() {
  assert.equal(cookie.serialize('foo', 'bar', { sameSite: true }), 'foo=bar; SameSite=Strict')
  assert.equal(cookie.serialize('foo', 'bar', { sameSite: 'Strict' }), 'foo=bar; SameSite=Strict')
  assert.equal(cookie.serialize('foo', 'bar', { sameSite: 'strict' }), 'foo=bar; SameSite=Strict')
  assert.equal(cookie.serialize('foo', 'bar', { sameSite: 'Lax' }), 'foo=bar; SameSite=Lax')
  assert.equal(cookie.serialize('foo', 'bar', { sameSite: 'lax' }), 'foo=bar; SameSite=Lax')
  assert.equal(cookie.serialize('foo', 'bar', { sameSite: 'None' }), 'foo=bar; SameSite=None')
  assert.equal(cookie.serialize('foo', 'bar', { sameSite: 'none' }), 'foo=bar; SameSite=None')
  assert.equal(cookie.serialize('foo', 'bar', { sameSite: false }), 'foo=bar')

  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    sameSite: 'foo'
  }), /option sameSite is invalid/);
});

test('escaping', function() {
  assert.deepEqual(cookie.serialize('cat', '+ '), 'cat=%2B%20')
});

test('parse->serialize', function() {
  assert.deepEqual(cookie.parse(cookie.serialize('cat', 'foo=123&name=baz five')),
    { cat: 'foo=123&name=baz five' })

  assert.deepEqual(cookie.parse(cookie.serialize('cat', ' ";/')),
    { cat: ' ";/' })
});

test('unencoded', function() {
  assert.deepEqual(cookie.serialize('cat', '+ ', {
    encode: function(value) { return value; }
  }), 'cat=+ ')

  assert.throws(cookie.serialize.bind(cookie, 'cat', '+ \n', {
    encode: function(value) { return value; }
  }), /argument val is invalid/);
})
