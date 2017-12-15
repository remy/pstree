module.exports = { tree, pidsForTree };

function template(s) {
  let stat = null;
  // 'pid', 'comm', 'state', 'ppid', 'pgrp'
  // %d     (%s)    %c       %d      %d
  s.replace(
    /(\d+) \((.*?)\)\s(.+?)\s(\d+)\s/g,
    (all, PID, COMMAND, STAT, PPID) => {
      stat = { PID, COMMAND, PPID, STAT };
    }
  );

  return stat;
}

function tree(stats) {
  const processes = stats
    .split('\n')
    .map(template)
    .filter(Boolean);

  return processes;
}

function pidsForTree(tree, pid) {
  if (typeof pid === 'number') {
    pid = pid.toString();
  }
  const parents = [pid];
  const children = [];

  tree.forEach(proc => {
    if (parents.indexOf(proc.PPID) !== -1) {
      parents.push(proc.PID);
      children.push(proc);
    }
  });

  return children;
}
