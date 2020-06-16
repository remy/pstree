const tap = require('tap');
const test = tap.test;
const readFile = require('fs').readFileSync;
const spawn = require('child_process').spawn;
const pstree = require('../');
const { tree, pidsForTree, getStat } = require('../lib/utils');
const isZOS = process.platform === 'os390' ? true : false;

if (process.platform !== 'darwin') {
  const testMsg = isZOS ? 'reads from ps' : 'reads from /proc';
  test(testMsg, async t => {
    const ps = await getStat();
    t.ok(ps.split('\n').length > 1);
  });
}

test('tree for live env', async t => {
  const pid = 4079;
  const fixname = isZOS ? 'fixtures/out2.os390' : 'fixtures/out2';
  const fixture = readFile(__dirname + '/' + fixname, 'utf8');
  const ps = await tree(fixture);
  if (!isZOS) {
    t.deepEqual(pidsForTree(ps, pid).map(_ => _.PID), ['4080']);
  } else {
    t.deepEqual(pidsForTree(ps, pid).map(_ => _.PID), ['67110338',
                                                       '33557612',
                                                       '16779878',
                                                       '50334588',
                                                       '16779926',
                                                       '1763',
                                                       '43' ]);
  }
});

function testTree (t, runCallCount) {
  const sub = spawn('node', [`${__dirname}/fixtures/index.js`, runCallCount], {
    stdio: 'pipe',
  });
  setTimeout(() => {
    const pid = sub.pid;

    pstree(pid, (error, children) => {
      children.concat([pid]).forEach(p => {
        spawn('kill', ['-s', 'SIGTERM', p]);
      });

      // the fixture launches two processes on each call to run, hence the expected
      // number of children is two times bigger than the number of run() calls
      t.equal(children.length, runCallCount * 2); 
      t.end();
    });
  }, 1000);

}

test('can read full child process tree', t => { testTree(t, 1) })
test('can read full child process tree with multiple children', t => { testTree(t, 2) })
