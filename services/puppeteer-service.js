const puppeteer = require('puppeteer');

async function puppeteerBrowser() {
    // configura puppeteer
    const args = [
        "--allow-running-insecure-content",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--disable-infobars",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--ignore-certificate-errors",
        "--single-process",
    ]

    let ignoreDefaultArgs = ['--enable-automation']

    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: false, //se false, abre o navegador
        args,
        ignoreDefaultArgs: ignoreDefaultArgs,
    })
    return await browser
}

module.exports = puppeteerBrowser