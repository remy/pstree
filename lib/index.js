const { spawn, exec } = require('child_process');
const psTree = require('ps-tree');
const { tree, pidsForTree } = require('./utils');
let hasPS = true;

// discover if the OS has `ps`, and therefore can use psTree
exec('ps', error => {
  hasPS = !error;
});

function getStat() {
  return new Promise((resolve, reject) => {
    const command = `ls /proc | grep -E '^[0-9]+$' | xargs -I{} cat /proc/{}/stat`;
    const child = spawn('sh', ['-c', command], { stdio: 'pipe' });

    child.on('stderr', data => reject(new Error(data.trim())));
    child.on('stdout', resolve);
  });
}

module.exports = function main(pid, callback) {
  if (typeof pid === 'number') {
    pid = pid.toString();
  }

  if (hasPS && !process.env.NO_PS) {
    return psTree(pid, callback);
  }

  getStat()
    .then(tree)
    .then(tree => pidsForTree(tree, pid))
    .then(callback)
    .catch(error => callback(null, error));
};
