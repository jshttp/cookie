// builtin
var assert = require('assert');

var cookie = require('..');

suite('serialize');

test('basic', function() {
    assert.equal('foo=bar', cookie.serialize('foo', 'bar'));
    assert.equal('foo=bar%20baz', cookie.serialize('foo', 'bar baz'));
    assert.equal('foo=', cookie.serialize('foo', ''));
    assert.throws(cookie.serialize.bind(cookie, 'foo\n', 'bar'), /argument name is invalid/);
    assert.throws(cookie.serialize.bind(cookie, 'foo\u280a', 'bar'), /argument name is invalid/);
});

test('path', function() {
    assert.equal('foo=bar; Path=/', cookie.serialize('foo', 'bar', {
        path: '/'
    }));

    assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
        path: '/\n'
    }), /option path is invalid/);
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

    assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
        domain: 'example.com\n'
    }), /option domain is invalid/);
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

    assert.equal('foo=bar; Max-Age=1000', cookie.serialize('foo', 'bar', {
        maxAge: '1000'
    }));

    assert.equal('foo=bar; Max-Age=0', cookie.serialize('foo', 'bar', {
        maxAge: 0
    }));

    assert.equal('foo=bar; Max-Age=0', cookie.serialize('foo', 'bar', {
        maxAge: '0'
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        maxAge: null
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        maxAge: undefined
    }));

    assert.equal('foo=bar; Max-Age=3', cookie.serialize('foo', 'bar', {
        maxAge: 3.14
    }));
});

test('firstPartyOnly', function() {
    assert.equal('foo=bar; First-Party-Only', cookie.serialize('foo', 'bar', {
        firstPartyOnly: true
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        firstPartyOnly: false
    }));
});

test('sameSite', function() {
    assert.equal('foo=bar; SameSite', cookie.serialize('foo', 'bar', {
        sameSite: true
    }));

    assert.equal('foo=bar; SameSite=Strict', cookie.serialize('foo', 'bar', {
        sameSite: 'Strict'
    }));

    assert.equal('foo=bar; SameSite=Lax', cookie.serialize('foo', 'bar', {
        sameSite: 'Lax'
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        sameSite: false
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

    assert.throws(cookie.serialize.bind(cookie, 'cat', '+ \n', {
        encode: function(value) { return value; }
    }), /argument val is invalid/);
})
