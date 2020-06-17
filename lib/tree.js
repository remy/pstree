const spawn = require('child_process').spawn;

function find_pids_nix(rootPid, callback) {
  // other *nix: assumes ps always lists a parent before its child
  const pidsOfInterest = new Set([rootPid]);
  var output = '';

  // *nix
  const ps = spawn('ps', ['-A', '-o', 'ppid,pid']);
  ps.stdout.on('data', data => {
    output += data.toString('ascii');
  });

  ps.on('close', () => {
    try {
      const res = output
        .split('\n')
        .slice(1)
        .map(_ => _.trim())
        .reduce((acc, line) => {
          const pids = line.split(/\s+/);
          if (pidsOfInterest.has(pids[0])) {
            acc.push(parseInt(pids[1], 10));
            pidsOfInterest.add(pids[1]);
          }

          return acc;
        }, []);

      callback(null, res);
    } catch (e) {
      callback(e, null);
    }
  });
}

function find_pids_os390(rootPid, callback) {
  // on z/OS, ps may list a child process before its parent
  var output = '';

  const ps = spawn('ps', ['-A', '-o', 'ppid,pid']);
  ps.stdout.on('data', data => {
    output += data.toString('ascii');
  });

  ps.on('close', () => {
    try {
      const tree = [];
      output
        .split('\n')
        .slice(1)
        .map(_ => _.trim())
        .forEach(function(line) {
          if (line === '') {
            return;
          }
          tree.push(line.split(/\s+/));
        });

      const res = [];
      function populate_pids(ppid) {
        tree.forEach((pair) => {
          if (pair[0] === ppid) {
            res.push(pair[1]);
            populate_pids(pair[1]);
            return;
          }
        });
      }
      populate_pids(rootPid);
      callback(null, res);
    } catch (e) {
      callback(e, null);
    }
  });
}

module.exports = function(rootPid, callback) {
  if (process.platform === 'os390') {
    find_pids_os390(rootPid, callback);
  } else {
    find_pids_nix(rootPid, callback);
  }
}
