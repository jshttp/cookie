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

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        path: 200
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        path: null
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        path: undefined
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        path: { path: '/foo/bar' }
    }));
});

test('secure', function() {
    assert.equal('foo=bar; Secure', cookie.serialize('foo', 'bar', {
        secure: true
    }));

    assert.equal('foo=bar; Secure', cookie.serialize('foo', 'bar', {
        secure: 'true'
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        secure: false
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        secure: undefined
    }));
});

test('domain', function() {
    assert.equal('foo=bar; Domain=example.com', cookie.serialize('foo', 'bar', {
        domain: 'example.com'
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        domain: 200
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        domain: null
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        domain: undefined
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        domain: { domain: 'foo.bar' }
    }));
});

test('expires', function() {
    assert.equal('foo=bar; Expires=' + (new Date()).toUTCString(), cookie.serialize('foo', 'bar', {
        expires: (new Date()).toUTCString()
    }));

    assert.equal('foo=bar; Expires=' + (new Date()).toUTCString(), cookie.serialize('foo', 'bar', {
        expires: new Date()
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        expires: 'not a date'
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        expires: { objectButNotDate: true }
    }));
});

test('httpOnly', function() {
    assert.equal('foo=bar; HttpOnly', cookie.serialize('foo', 'bar', {
        httpOnly: true
    }));

    assert.equal('foo=bar; HttpOnly', cookie.serialize('foo', 'bar', {
        httpOnly: 'true'
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        httpOnly: false
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        httpOnly: undefined
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

test('encoded method validation', function() {
   assert.throws(cookie.serialize.bind(null, 'cat', ' ', {
       encode: 42
   }), /encode option must be a function/i);

    assert.deepEqual('cat=%20', cookie.serialize('cat', ' ', {}));
});

test('unencoded', function() {
    assert.deepEqual('cat=+ ', cookie.serialize('cat', '+ ', {
        encode: function(value) { return value; }
    }));
})
