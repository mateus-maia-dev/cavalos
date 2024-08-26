// var logger = require('../../winston')(__filename)
// const mathUtil = require('../../util/math-util')
// const puppeteerUtil = require('../../util/puppeteer-util')
// const guaraxaimUtil = require('../../util/guaraxaim-util')
// const { createClient } = require('redis')
// const moment = require('moment')
// const orquestradorApi = require('../../service/orquestrador-api-service')
// const GetRegistrosCavalos =
//     require('../../service/registrosCavalos').GetRegistrosCavalos
// const arrayCombinacoesLetras = require('../../util/cavalos-util')
const puppeteer = require('puppeteer');
const { ScrapedData } = require('../models');


// Parametros
const URL = 'https://abcpaint.com.br/studbook/'


/**
 * Start script
 * @param {object} page
 * @param {object} docSite
 * @returns {object}
 */
exports.run = async function (page) {
    let clientRedis = null
    const registrosCavalos = await getRegistrosCavalos.getDadosCavalos(SIGLA)
    try {
        clientRedis = await createClient({ url: process.env.REDIS_CAVALO })
            .on('error', (err) => console.log('Redis Client Error', err))
            .connect()

        // retorna os ultimos registros coletados, se esses existirem
        const dadosRedis = []

        dadosRedis[0] = await clientRedis.get('inputLetrasPaint')
        dadosRedis[1] = await clientRedis.get('ultimoIdCavaloPaint')

        await coleta(dadosRedis, page, clientRedis, registrosCavalos)

        logger.info('Terminou a coleta')

        return guaraxaimUtil.resumo({
            sigla: SIGLA,
            processos: 1,
            resumo: {
                positiva: true,
            },
        })
    } catch (error) {
        logger.error(error)
        logger.error(logUltimaLetraPesquisada, 'logUltimaLetraPesquisada')
    } finally {
        if (clientRedis != null) {
            // desconectar o client do Redis
            await clientRedis.disconnect()
        }
    }
}

async function coleta(dadosRedis, page, clientRedis, nomesCavalos) {
    // Initialize an empty array to hold the combinations
    const combinations = arrayCombinacoesLetras.arrayCombinacoes()

    const combLetras = dadosRedis[0] ?? ''

    // carrega as variaveis usadas na busca
    const primeiraLetra = combLetras[0] ?? 'A'
    const segundaLetra = combLetras[1] ?? 'A'
    const terceiraLetra = combLetras[2] ?? 'A'

    const combination = primeiraLetra + segundaLetra + terceiraLetra

    let idx = 0
    combinations.forEach((comb, index) => {
        if (comb === combination) {
            idx = index
        }
    })

    const ultimoIdCavalo = dadosRedis[1] ?? null

    logger.info('Buscou registros salvos no Redis')

    for (idx; idx < combinations.length; idx++) {
        //Carrega a pagina
        await carregaPagina(page)

        await coletaSalvaRegistros(
            combinations[idx],
            ultimoIdCavalo,
            clientRedis,
            page,
            nomesCavalos
        )
    }

    logger.info('Finalizou a coleta.')
}

async function carregaPagina(page) {
    const res = await page.goto(URL, {
        waitUntil: 'networkidle0',
    })

    //valida se pagina carregou
    puppeteerUtil.isResponseOk(res, SIGLA, URL)
}

async function coletaInformacoes(page) {
    let objRegistro = {}
    const dadosRegistro = await page.evaluate(() => {
        const tdDadosCadastro = Array.from(
            document.querySelectorAll('#container-studbook > div.row span')
        )

        //Pega apenas o texto das tags
        return tdDadosCadastro.map((td) => td.innerText)
    })

    let ano_nascimento = dadosRegistro
        .filter((el) => el.includes('Data de Nascimento'))[0]
        ?.split(':')[1]
        ?.trim()

    // verifica se vem o nome do proprietario
    let proprietario = dadosRegistro.filter((el) =>
        el.includes('Proprietário')
    )[0]
    let nome_proprietario = proprietario?.split(':')[1]?.trim()

    if (
        nome_proprietario &&
        moment(ano_nascimento, 'DD/MM/YYYY').year() > moment().year() - 35
    ) {
        //extração de dados
        //nome
        let info_cavalo = await page.evaluate(() => {
            const span = document.querySelector('div.row h2')

            return span ? span.innerText : ''
        })
        objRegistro.nome_cavalo = info_cavalo?.split('/')[0]?.trim()

        //registro
        objRegistro.registro_cavalo = info_cavalo?.split('/')[1]?.trim()

        //sexo
        let sexo = dadosRegistro.filter((el) => el.includes('Sexo'))[0]
        objRegistro.sexo_cavalo = sexo?.split(':')[1]?.trim()

        //nascimento_cavalo
        objRegistro.nascimento_cavalo = moment(
            ano_nascimento,
            'DD/MM/YYYY'
        ).format('YYYY/MM/DD')

        //criador
        let criador = dadosRegistro.filter((el) => el.includes('Criador'))[0]
        objRegistro.nome_criador = criador?.split(':')[1]?.trim()

        //proprietario
        objRegistro.nome_proprietario_cavalo = nome_proprietario

        //status
        let status = dadosRegistro.filter((el) => el.includes('Status'))[0]
        objRegistro.status = status?.split(':')[1]?.trim()

        //morto
        let cavaloVivo = dadosRegistro.filter((el) => el.includes('Óbito'))[0]
        objRegistro.is_vivo = cavaloVivo?.split(':')[1]?.trim() == 'Não' ? true : false
    }
    return objRegistro
}

/**
 * Função que busca o nome do cavalo
 * @param {object} page
 * @param {string} inputName
 */
async function pesqNomeCavalo(page, inputName) {
    await page.click('input[name="nome"]', { clickCount: 3, delay: 200 })
    await page.keyboard.press('Backspace')

    await page.type('input[name="nome"]', inputName, {
        delay: mathUtil.random(150, 250),
    })

    // Botao pesquisar
    await Promise.all([
        page.waitForResponse(
            (response) =>
                response.url().includes('https://abcpaint.com.br/studbookzinho/') &&
                response.status() === 200
        ),
        page.click('#search-button > button'),
    ])
}

async function setValueRedis(
    clientRedis,
    combination,
    ultimoIdCavalo,
    urlsRegistros,
    idx
) {
    const expiracao = { EX: process.env.CAVALO_TIMEOUT_REDIS }

    await clientRedis.set('inputLetrasPaint', combination, expiracao)
    await clientRedis.set(
        'ultimoIdCavaloPaint',
        ultimoIdCavalo ?? urlsRegistros[idx],
        expiracao
    )

    await clientRedis.set(`paint_${urlsRegistros[idx]}`, 'true', expiracao)


}

async function coletaSalvaRegistros(
    combination,
    ultimoIdCavalo,
    clientRedis,
    page,
    nomesCavalos
) {

    await page.waitForSelector('input[name="nome"]')

    logger.info('Letra pesquisada ->', combination)
    logUltimaLetraPesquisada = combination
    // limpa o nome que já está escrito
    await pesqNomeCavalo(page, combination)

    logger.info('Pesquisou nome do cavalo')

    // aguarda vir as informações
    await page.waitForTimeout(1500)

    // coleta todos os href
    const urlsRegistros = await page.evaluate(() => {
        const tdDados = Array.from(
            document.querySelectorAll('#content > div > table > tbody > tr')
        )

        //Pega apenas o texto das tags
        return tdDados
            ? tdDados.map((td) => td.getAttribute('onclick').match(/\d+/g)[0])
            : []
    })

    // pega o ultim index, salvo no Redis, no array urlsRegistros
    let idxCavalo = 0
    urlsRegistros.forEach((registro, index) => {
        if (ultimoIdCavalo == registro) {
            idxCavalo = index + 1
        }
    })

    // coleta registros por pagina
    const dadosRegistro = await page.evaluate(() => {
        const tdDadosCadastro = Array.from(
            document.querySelectorAll("#content > div > table > tbody > tr")
        )

        //Pega apenas o texto das tags
        return tdDadosCadastro.map((td) => td.innerText)
    })

    // coleta nomes cavalos
    const arrayNomesCavalos = dadosRegistro.map(reg => reg?.split('\t')[0]?.trim())

    // coleta data nascimento cavalos
    const arrayNascimentoCavalo = dadosRegistro.map(reg => reg?.split('\t')[5]?.trim())

    // loop em cada registro
    for (idxCavalo; idxCavalo < urlsRegistros.length; idxCavalo++) {
        // valida se existe o cavalo no banco ou o nascimento é incompativel
        if (nomesCavalos.some(horse => horse.csc_nome_cavalo === arrayNomesCavalos[idxCavalo]) || moment(
            arrayNascimentoCavalo[idxCavalo],
            'DD/MM/YYYY'
        ).format('YYYY/MM/DD') < moment().year() - 35) {
            continue
        }

        // verifica se ja foi coletado esse cavalo
        const verificaSeJaColetadoRedis = await clientRedis.get(
            `paint_${urlsRegistros[idxCavalo]}`
        )

        // Verifica, baseando-se pela chave do cavalo pelo ID se ele já foi coletado para não clicar no link e passar para o próximo
        if (verificaSeJaColetadoRedis) {
            continue
        }

        // monta a url que vai para a pagina do registro
        // Carrega a pagina
        const res = await page.goto(
            `https://abcpaint.com.br/dados?id=${urlsRegistros[idxCavalo]}`,
            { waitUntil: 'networkidle0' }
        )
        logger.info('PESQUISANDO COMBINAÇÃO: ', combination)
        //valida se pagina carregou
        puppeteerUtil.isResponseOk(res, SIGLA, URL)

        await page.waitForSelector('#container-studbook')

        // coleta registro
        const registro = await coletaInformacoes(page)

        if (Object.keys(registro).length > 0) {
            // manda para o orquestrador salvar os registros no banco
            orquestradorApi.sendResultParcialCavalo({ sigla: SIGLA, registro })
            logger.info('nome cavalo: ' + registro.nome_cavalo)
        }

        // registra no Redis o array para caso os dados sejam perdidos e possam ser recuperados depois
        await setValueRedis(
            clientRedis,
            combination,
            ultimoIdCavalo,
            urlsRegistros,
            idxCavalo
        )

        logger.info('Inseriu no Redis')

        await page.waitForTimeout(1500)
    }
}
