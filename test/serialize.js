// builtin
var assert = require('assert');

var cookie = require('..');

suite('serialize');

test('argument validation', function() {
    var nameErrMessage = /argument name must be a string/;
    var valErrMessage = /argument val must be a string/;

    assert.throws(cookie.serialize.bind(), nameErrMessage);

    assert.throws(cookie.serialize.bind(null, 1010), nameErrMessage);
    assert.throws(cookie.serialize.bind(null, 'foo', 1010), valErrMessage);

    assert.throws(cookie.serialize.bind(null, true), nameErrMessage);
    assert.throws(cookie.serialize.bind(null, 'foo', true), valErrMessage);

    assert.throws(cookie.serialize.bind(null, (function() {return;})), nameErrMessage);
    assert.throws(cookie.serialize.bind(null, 'foo', (function() {return;})), valErrMessage);

    assert.throws(cookie.serialize.bind(null, new Date()), nameErrMessage);
    assert.throws(cookie.serialize.bind(null, 'foo', new Date()), valErrMessage);

    assert.throws(cookie.serialize.bind(null, []), nameErrMessage);
    assert.throws(cookie.serialize.bind(null, 'foo', []), valErrMessage);

    assert.throws(cookie.serialize.bind(null, {}), nameErrMessage);
    assert.throws(cookie.serialize.bind(null, 'foo', {}), valErrMessage);
});

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
