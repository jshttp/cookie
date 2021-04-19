import { deepEqual, equal } from 'assert';
import { parse, serialize } from '..';

const node_major_ver = process.versions.node.split('.')[0];

suite('esm');

test('parse', function() {
  deepEqual({ foo: 'bar' }, parse('foo=bar'));
  deepEqual({ foo: '123' }, parse('foo=123'));
});

test('serialize', function() {
  equal('foo=bar', serialize('foo', 'bar'));
  equal('foo=bar%20baz', serialize('foo', 'bar baz'));
  equal('foo=', serialize('foo', ''));
});
