const spawn = require('child_process').spawn;
function run() {
  spawn(
    'sh',
    ['-c', 'node -e "setInterval(() => console.log(`running`), 200)"'],
    {
      stdio: 'pipe',
    }
  );
}

run();
run();
