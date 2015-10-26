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

    assert.deepEqual(['foo=bar'], cookie.serialize({ foo: 'bar' }));
    assert.deepEqual(['foo=bar', 'cat=meow', 'dog=ruff'], cookie.serialize({ foo: 'bar', cat: 'meow', dog: 'ruff' }));
    assert.deepEqual(['foo='], cookie.serialize({ foo: '' }));
    assert.deepEqual(['foo=','cat=meow'], cookie.serialize({ foo: '', cat: 'meow' }));
    assert.equal(undefined, cookie.serialize({}));
});

test('path', function() {
    assert.equal('foo=bar; Path=/', cookie.serialize('foo', 'bar', {
        path: '/'
    }));

    assert.deepEqual(['foo=bar; Path=/'], cookie.serialize(
      { foo: 'bar' },
      { path: '/' }
    ));

    assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
        path: '/\n'
    }), /option path is invalid/);

    assert.throws(cookie.serialize.bind(cookie,
      { foo: 'bar' },
      {  path: '/\n' }),
      /option path is invalid/);
});

test('secure', function() {
    assert.equal('foo=bar; Secure', cookie.serialize('foo', 'bar', {
        secure: true
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        secure: false
    }));

    assert.deepEqual(['foo=bar; Secure'], cookie.serialize(
      { foo: 'bar' },
      { secure: true }
    ));

    assert.deepEqual(['foo=bar'], cookie.serialize(
      { foo: 'bar' },
      { secure: false }
    ));
});

test('domain', function() {
    assert.equal('foo=bar; Domain=example.com', cookie.serialize('foo', 'bar', {
        domain: 'example.com'
    }));

    assert.deepEqual(['foo=bar; Domain=example.com'], cookie.serialize(
      { foo: 'bar' },
      { domain: 'example.com' }
    ));

    assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
        domain: 'example.com\n'
    }), /option domain is invalid/);

    assert.throws(cookie.serialize.bind(cookie,
       { foo: 'bar' },
       { domain: 'example.com\n' }),
       /option domain is invalid/);
});

test('httpOnly', function() {
    assert.equal('foo=bar; HttpOnly', cookie.serialize('foo', 'bar', {
        httpOnly: true
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        httpOnly: false
    }));

    assert.deepEqual(['foo=bar; HttpOnly'], cookie.serialize(
      { foo: 'bar' },
      { httpOnly: true }
    ));

    assert.deepEqual(['foo=bar'], cookie.serialize(
      { foo: 'bar' },
      { httpOnly: false }
    ));
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
    
    assert.deepEqual(['foo=bar; Max-Age=1000'], cookie.serialize(
      { foo: 'bar' },
      { maxAge: 1000 }
    ));

    assert.deepEqual(['foo=bar; Max-Age=0'], cookie.serialize(
      { foo: 'bar' },
      { maxAge: 0 }
    ));
});

test('firstPartyOnly', function() {
    assert.equal('foo=bar; First-Party-Only', cookie.serialize('foo', 'bar', {
        firstPartyOnly: true
    }));

    assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
        firstPartyOnly: false
    }));

    assert.deepEqual(['foo=bar; First-Party-Only'], cookie.serialize(
      { foo: 'bar' },
      { firstPartyOnly: true }
    ));

    assert.deepEqual(['foo=bar'], cookie.serialize(
      { foo: 'bar' },
      { firstPartyOnly: false }
    ));
});

test('escaping', function() {
    assert.deepEqual('cat=%2B%20', cookie.serialize('cat', '+ '));
    assert.deepEqual(['cat=%2B%20'], cookie.serialize({ cat: '+ ' }));
    assert.deepEqual(['cat=%2B%20', 'dog=%2C%20'], cookie.serialize({ cat: '+ ', dog: ', ' }));
});

test('parse->serialize', function() {

    assert.deepEqual({ cat: 'foo=123&name=baz five' }, cookie.parse(
      cookie.serialize('cat', 'foo=123&name=baz five')));

    assert.deepEqual({ cat: ' ";/' }, cookie.parse(
      cookie.serialize('cat', ' ";/')));

    assert.deepEqual({ cat: 'foo=123&name=baz five' }, cookie.parse(
      cookie.serialize({ cat: 'foo=123&name=baz five' })[0]));

    assert.deepEqual({ cat: ' ";/' }, cookie.parse(
      cookie.serialize({ cat: ' ";/' })[0]));
});

test('serialize->parse', function() {

  assert.deepEqual(['foo=bar', 'cat=meow', 'dog=ruff'], cookie.serialize(
    cookie.parse('foo=bar; cat=meow; dog=ruff')));

  assert.deepEqual(['foo=bar'], cookie.serialize(
    cookie.parse('foo=bar')));

  assert.deepEqual(['foo=', 'cat=meow'], cookie.serialize(
    cookie.parse('foo=; cat=meow')));

});

test('unencoded', function() {
    assert.deepEqual('cat=+ ', cookie.serialize('cat', '+ ', {
        encode: function(value) { return value; }
    }));

    assert.throws(cookie.serialize.bind(cookie, 'cat', '+ \n', {
        encode: function(value) { return value; }
    }), /argument val is invalid/);

    assert.deepEqual(['cat=+ '], cookie.serialize(
      { cat: '+ ' },
      { encode: function(value) { return value; }
    }));

    assert.deepEqual(['cat=+ ', 'dog=, '], cookie.serialize(
      { cat: '+ ', dog: ', ' },
      { encode: function(value) { return value; }
    }));

    assert.throws(cookie.serialize.bind(cookie,
        { cat: '+ \n' },
        { encode: function(value) { return value; } }),
        /argument val is invalid/);
});

test('many cookies many options', function() {

  assert.deepEqual(
    ['foo=bar; Domain=example.com', 'cat=meow; Domain=example.com', 'dog=ruff; Domain=example.com'],
    cookie.serialize(
      { foo: 'bar', cat: 'meow', dog: 'ruff' },
      { domain: 'example.com' }
    ));

  assert.deepEqual(['cat=+ ; Domain=example.com', 'dog=, ; Domain=example.com'], cookie.serialize(
    { cat: '+ ', dog: ', ' },
    { domain: 'example.com', encode: function(value) { return value; } }));

});
