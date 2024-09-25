// builtin
var assert = require('assert');

var cookie = require('..');

suite('serialize');

test('basic', function() {
    assert.equal('foo=bar', cookie.serialize('foo', 'bar'));
    assert.equal('foo=bar%20baz', cookie.serialize('foo', 'bar baz'));
});

test('path', function() {
    assert.equal('foo=bar; Path=/', cookie.serialize('foo', 'bar', {
        path: '/'
    }));
});

test('secure', function() {
    assert.equal('foo=bar; Secure', cookie.serialize('foo', 'bar', {
        secure: true
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        secure: false
    }));
});

test('domain', function() {
    assert.equal('foo=bar; Domain=example.com', cookie.serialize('foo', 'bar', {
        domain: 'example.com'
    }));
});

test('httpOnly', function() {
    assert.equal('foo=bar; HttpOnly', cookie.serialize('foo', 'bar', {
        httpOnly: true
    }));
});

test('maxAge', function() {
    assert.equal('foo=bar; Max-Age=1000', cookie.serialize('foo', 'bar', {
        maxAge: 1000
    }));

    assert.equal('foo=bar; Max-Age=0', cookie.serialize('foo', 'bar', {
        maxAge: 0
    }));
});

test('escaping', function() {
    assert.deepEqual('cat=%2B%20', cookie.serialize('cat', '+ '));
});

test('parse->serialize', function() {

    assert.deepEqual({ cat: 'foo=123&name=baz five' }, cookie.parse(
      cookie.serialize('cat', 'foo=123&name=baz five')));

    assert.deepEqual({ cat: ' ";/' }, cookie.parse(
      cookie.serialize('cat', ' ";/')));
});

test('unencoded', function() {
    assert.deepEqual('cat=+ ', cookie.serialize('cat', '+ ', {
        encode: function(value) { return value; }
    }));
})

// Test for valid cookie names
test('valid cookie names', function() {
  var validCookieNames = [
    'user_id-123',
    'SESSION-TOKEN_v2',
    'auth0.jwt.token',
    '__Secure-ID',
    'csrf_token!valid',
    'tracking-cookie$main_version',
    'analytics%5Bsource%5D',
    'persistent_001#abc',
    'first|last'
  ];

  validCookieNames.forEach(function(name) {
    var expectedCookie = {};
    expectedCookie[name] = 'test_value'; // Dynamically set the property name

    assert.deepEqual(
      expectedCookie, 
      cookie.parse(cookie.serialize(name, 'test_value'))
    );
  });
});

// Test for invalid cookie names
test('invalid cookie names throw error', function() {
  var invalidCookieNames = [
    'locale-set@en-US',
    'cart[items][id]',
    'mydir/username',
    'query?id',
    'category:cars',
    'first,last',
    '{id:123}',
    'no spaces allowed',
    'no\ttabs\tallowed',
    'foo<scriptalertscript',
    'userId=<script>alert(%27XSS7%27)</script>;+Max-Age=2592000;+a',
    'token=<img src=x onerror=alert(%27XSS2%27)>;+Path=/;+Secure;',
    'tracking=<body onload=alert(%27XSS5%27)>;+Expires=Tue, 19 Jan 2038 03:14:07 GMT;'
  ];

  invalidCookieNames.forEach(function(name) {
    assert.throws(
      function() {
        cookie.serialize(name, 'test_value');
      },
      Error,
      'Expected "' + name + '" to throw an error'
    );
  });
});
