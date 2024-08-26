const { spawn } = require('child_process');
const yargs = require('yargs');
const processes = {};

exports.startScraper = (script) => {
    if (processes[script]) {
        console.log(`${script} is already running.`);
        return;
    }

    const child = spawn('node', ['--inspect', script], { stdio: 'inherit' });

    processes[script] = child;
    console.log(`${script} started with PID ${child.pid}`);

    child.on('exit', (code) => {
        console.log(`${script} stopped with exit code ${code}`);
        delete processes[script];
    });
}

exports.stopScraper = (script) => {
    const child = processes[script];
    if (child) {
        child.kill();
        console.log(`${script} is stopping...`);
    } else {
        console.log(`${script} is not running.`);
    }
}

const argv = yargs
    .command('start', 'Start a scraper', {
        script: {
            description: 'Inicia coleta cavalo',
            alias: 'arabe',
            type: 'string',
            demandOption: true
        }
    }, (argv) => {
        startScraper(argv.script);
    })
    .command('stop', 'Stop a scraper', {
        script: {
            description: 'Parando a coleta do cavalo',
            alias: 'arabe',
            type: 'sting',
            demandOption: true
        }
    }, (argv) => {
        stopScraper(argv.script);
    })
    .help()
    .argv;
