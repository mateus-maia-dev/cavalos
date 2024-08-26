const { runScrapers } = require('./services/scraperControl');
const readline = require('readline'); // ????

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function startApp() {
    console.log('Starting scraper...');
    runScrapers();

    rl.on('line', (input) => {
        if (input === 'stop') {
            console.log('Stopping scraper...');
            process.exit(0);
        }
    });
}

startApp();
