const ColetaSite = require('../models/ColetaSite');
const startRobo = require('../cavalos/cavalo-arabe-registros')
const scrapeSiteA = require('../cavalos/cavalo-arabe-registros');
const scrapeSiteB = require('../cavalos/cavalo-paint-registros');

async function runScrapers() {
    // Fetch up to 3 records where `cst_ultima_coleta` is null
    const sites = await ColetaSite.findAll({
        where: { cst_ultima_coleta: null },
        and: { cst_is_ativo: true },
        limit: 3
    });

    for (const site of sites) {
        switch (site.cst_sigla) {
            case 'CAVALOS-ARABE-REGISTROS':
                await startRobo(site.cst_url);
                break;
            // case 'SITE_B':
            //     await scrapeSiteB(site.cst_url);
            //     break;
            // case 'SITE_C':
            //     await scrapeSiteC(site.cst_url);
            //     break;
            default:
                console.log(`No scraper defined for ${site.cst_sigla}`);
        }

        // Update the `cst_ultima_coleta` after successful scraping
        site.cst_ultima_coleta = new Date();
        await site.save();
    }
}

module.exports = { runScrapers };
