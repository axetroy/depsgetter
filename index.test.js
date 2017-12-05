import test from 'ava';

import depsgetter from './index';

test('require', t => {
  const deps = depsgetter.Get('./example/require.js');
  t.deepEqual(deps, ['http', 'net', 'events', 'dns', 'path', 'process']);
});

test('require nest in function', t => {
  const deps = depsgetter.Get('./example/require-nest-in-function.js');
  t.deepEqual(deps, [
    'http',
    'net',
    'events',
    'dns',
    'path',
    'process',
    'child_process',
    'os'
  ]);
});

test('import', t => {
  const deps = depsgetter.Get('./example/import.js');
  t.deepEqual(deps, ['http', 'net', 'events', 'dns']);
});

test('import nest in function', t => {
  const deps = depsgetter.Get('./example/import-nest-in-function.js');
  t.deepEqual(deps, ['http', 'net', 'events', 'dns', 'child_process', 'os']);
});

test('mix in type', t => {
  const deps = depsgetter.Get('./example/mix.js');
  t.deepEqual(deps, ['http', 'net', 'events', 'dns', 'domain', 'module']);
});
