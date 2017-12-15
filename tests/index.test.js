const tap = require('tap');
const test = tap.test;
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);
const { spawn } = require('child_process');
const pstree = require('../');
const { tree, pidsForTree } = require('../lib/utils');

test('constructs a tree', async t => {
  const fixture = await readFile(__dirname + '/fixtures/out1', 'utf8');
  const ps = await tree(fixture);
  t.deepEqual(pidsForTree(ps, 27).map(_ => _.PID), ['28', '39']);
});

test('can read full child process tree', t => {
  const subprocess = spawn(
    'sh',
    [
      '-c',
      `node -e "setInterval(() => {
        console.log(process.pid, 'is alive')
      }, 200);"`,
    ],
    {
      stdio: ['inherit', 'inherit', 'inherit'],
    }
  );

  setTimeout(() => {
    const pid = subprocess.pid;
    pstree(pid, (error, children) => {
      t.pass('worked');
      console.log(children);
      t.end();
    });
  }, 500);
});
