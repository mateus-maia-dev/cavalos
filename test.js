const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://expo.abcca.com.br/studbook/abcca_stud_pesq.asp');
    console.log(page.waitForTimeout); // Should log the function
    await page.waitForTimeout(2000);
    await browser.close();
})();