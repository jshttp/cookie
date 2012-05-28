// builtin
var assert = require('assert');

var crumbs = require('..');

test('serialize', function() {
    assert.equal('foo=bar', crumbs.serialize('foo', 'bar'));

    assert.equal('foo=bar; Path=/', crumbs.serialize('foo', 'bar', {
        path: '/'
    }));

    assert.equal('foo=bar; Secure', crumbs.serialize('foo', 'bar', {
        secure: true
    }));

    assert.equal('foo=bar; Domain=example.com', crumbs.serialize('foo', 'bar', {
        domain: 'example.com'
    }));

    assert.equal('foo=bar; HttpOnly', crumbs.serialize('foo', 'bar', {
        httpOnly: true
    }));
});
