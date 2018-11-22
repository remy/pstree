'use strict';

var childProcess = require('child_process');
var spawn = childProcess.spawn;
var exec = childProcess.exec;

module.exports = function(pid, signal, callback) {
  var tree = {};
  var pidsToProcess = {};
  tree[pid] = [];
  pidsToProcess[pid] = 1;

  if (typeof signal === 'function' && callback === undefined) {
    callback = signal;
    signal = undefined;
  }

  switch (process.platform) {
    case 'darwin':
      buildProcessTree(
        pid,
        tree,
        pidsToProcess,
        function(parentPid) {
          return spawn('pgrep', ['-P', parentPid]);
        },
        function() {
          callback(Object.keys(tree));
        }
      );
      break;
    // case 'sunos':
    //     buildProcessTreeSunOS(pid, tree, pidsToProcess, function () {
    //         killAll(tree, signal, callback);
    //     });
    //     break;
    default:
      // Linux
      buildProcessTree(
        pid,
        tree,
        pidsToProcess,
        function(parentPid) {
          return spawn('ps', [
            '-o',
            'pid',
            '--no-headers',
            '--ppid',
            parentPid,
          ]);
        },
        function() {
          callback(Object.keys(tree));
        }
      );
      break;
  }
};

function buildProcessTree(
  parentPid,
  tree,
  pidsToProcess,
  spawnChildProcessesList,
  cb
) {
  var ps = spawnChildProcessesList(parentPid);
  var allData = '';
  ps.stdout.on('data', function(data) {
    var data = data.toString('ascii');
    allData += data;
  });

  var onClose = function(code) {
    delete pidsToProcess[parentPid];

    if (code != 0) {
      // no more parent processes
      if (Object.keys(pidsToProcess).length == 0) {
        cb();
      }
      return;
    }

    allData.match(/\d+/g).forEach(function(pid) {
      pid = parseInt(pid, 10);
      tree[parentPid].push(pid);
      tree[pid] = [];
      pidsToProcess[pid] = 1;
      buildProcessTree(pid, tree, pidsToProcess, spawnChildProcessesList, cb);
    });
  };

  ps.on('close', onClose);
}
