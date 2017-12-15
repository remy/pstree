const tap = require('tap');
const test = tap.test;
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);
const { spawn } = require('child_process');
const pstree = require('../');
const { tree, pidsForTree } = require('../lib/utils');

// test('constructs a tree', async t => {
//   const fixture = await readFile(__dirname + '/fixtures/out1', 'utf8');
//   const ps = await tree(fixture);
//   t.deepEqual(pidsForTree(ps, 27).map(_ => _.PID), ['28', '39']);
// });

test('tree for live env', async t => {
  const pid = 4079;
  const fixture = await readFile(__dirname + '/fixtures/out2', 'utf8');
  const ps = await tree(fixture);
  t.deepEqual(pidsForTree(ps, pid).map(_ => _.PID), ['4080']);
});

test('can read full child process tree', t => {
  const sub = spawn(
    'sh',
    [
      '-c',
      `node -e "setInterval(() => {
        console.log(sub.pid, process.pid, 'is alive')
      }, 200);"`,
    ],
    {
      stdio: ['inherit', 'inherit', 'inherit'],
    }
  );

  setTimeout(() => {
    const pid = sub.pid;
    pstree(pid, (error, children) => {
      children.concat({ PID: pid }).forEach(p => {
        spawn('kill', ['-s', 'SIGTERM', p.PID]);
      });
      t.equal(children.length, 1);
      t.end();
    });
  }, 500);
});
