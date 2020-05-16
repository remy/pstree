const spawn = require('child_process').spawn;

module.exports = function(rootPid, callback) {
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
};
