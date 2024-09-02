const cavalosUtil = require('./utils/cavalosUtil')
const puppeteerBrowser = require('./services/puppeteer-service')
const { getPesquisasEmAndamento, getAllBases } = require('./repository/status-andamento-coletas');
const { getBase } = require('./services/cavalos-services');

async function startRobo() {
    console.log('Robot started and ready to collect horses...');

    // cria uma instancia do puppeteer
    const browser = await puppeteerBrowser()
    try {
        // Traz o numero de pesquisas em andamento
        // e verifica qual o limite de pesquisas em paralelo
        const pesquisasEmAndamento = await getPesquisasEmAndamento()

        if (pesquisasEmAndamento.length >= 5) { // passar pelo .env depois
            console.log(
                'Já está no limite máximo as coletas de cavalo em andamento. Quantidade: ' + pesquisasEmAndamento.length
            )
            return
        }

        // TODO
        // verifica se é um caso de reprocessamento (cst_ultima_coleta n está null e coleta_finalizada = true)

        // senão processa o site
        const basesCavalos = await getAllBases()

        if (!(basesCavalos.length > 0)) {
            // TODO nao há bases a serem processadas
            console.log('Não há bases para serem processadas.')
            return
        }

        const baseCavalo = await getBase(basesCavalos)

        const page = await browser.newPage()

        // inicializa o script do cavalo
        await baseCavalo.runRobo(page, browser);
    } catch (error) {
        console.log(error)
    } finally {
        if (browser != null) {
            await browser.close()

            // sleep necessário para fechar a instancia e matar o processo
            cavalosUtil.msleep(10000) // 10 segundos
        }
        console.log('Instancia robo finalizada.')
    }
}

startRobo();