import childproc from 'child_process';

let frontend = childproc.spawn("node", ['./.output/server/index.mjs'], {
  stdio: "pipe",
  cwd: "./"
});
let backend = childproc.spawn("npm", ['start'], {
  stdio: "pipe",
  cwd: "./backend/",
  shell: true
});

frontend.stdout.on('data', (data) => {
    process.stdout.write(`Frontend >> ${data}`);
});
frontend.stderr.on('data', (data) => {
    process.stderr.write(`Frontend Error >> ${data}`);
});
backend.stdout.on('data', (data) => {
    process.stdout.write(`Backend >> ${data}`);
});
backend.stderr.on('data', (data) => {
    process.stderr.write(`Backend Error >> ${data}`);
});

function restart() {
    frontend.kill();
    backend.kill();
    frontend = childproc.spawn("node", ['./.output/server/index.mjs'], {
        stdio: "pipe",
        cwd: "./"
    });
    backend = childproc.spawn("npm", ['start'], {
        stdio: "pipe",
        cwd: "./backend/",
        shell: true
    });
}

backend.on('close', (code) => {
    if (code == 69) {
        restart();
        console.log("Restart successful!");
    } else {
        console.error(`Backend process exited with code ${code}`);
        process.exit(code);
    }
});
frontend.on('close', (code) => {
    console.error(`Frontend process exited with code ${code}`);
    process.exit(code);
});