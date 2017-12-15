const { exec } = require('child_process');
const psTree = require('ps-tree');
const { tree, pidsForTree, getStat } = require('./utils');
let hasPS = true;

// discover if the OS has `ps`, and therefore can use psTree
exec('ps', error => {
  hasPS = !error;
});

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
    .then(res => callback(null, res))
    .catch(error => callback(error));
};
