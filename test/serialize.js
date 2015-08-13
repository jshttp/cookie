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

test('opt.expires as Date', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: new Date('08 12 2015')
    }));
})

test('opt.expires as Unix Timestamp', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: +new Date('08 12 2015')
    }));
})

test('opt.expires as Date String (mm dd yyyy)', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: '08 12 2015'
    }));
})

test('opt.expires as Date String (dd MMM yy)', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: '12 Aug 15'
    }));
})

test('opt.expires as Date String (dd-MMM-yy)', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: '12-Aug-15'
    }));
})

test('opt.expires as Date String (dd/MMM/yy)', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: '12-Aug-15'
    }));
})

test('opt.expires as Date String (RFC2822-formatted)', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: 'Wed, 12 Aug 2015 05:00:00 EDT +0000'
    }));
})

test('opt.expires as Date String (RFC2822-formatted am/pm)', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: '12 August, 2015 0:00:00 Am'
    }));
})

test('opt.expires as Datetime String (mm dd yyyy hh:mm:ss)', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: '08 12 2015 00:00:00'
    }));
})

test('opt.expires as Datetime String (MM dd, yyyy hh:mm:dd)', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: 'August 12, 2015 00:00:00'
    }));
})

test('opt.expires as Datetime String (ISO)', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: '2015-08-12T05:00:00'
    }));
})

test('opt.expires as Datetime String (ISO w/milliseconds)', function() {
    assert.deepEqual('foo=bar; Expires=Wed, 12 Aug 2015 05:00:00 GMT', cookie.serialize('foo', 'bar', {
        expires: '2015-08-12T05:00:00.000Z'
    }));
})
