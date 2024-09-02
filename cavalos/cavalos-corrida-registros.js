// var logger = require('../../winston')(__filename)

const puppeteer = require('puppeteer');
const { PropriedadeCavalo } = require('../models');

// const guaraxaimUtil = require('../../util/guaraxaim-util')
// const puppeteerUtil = require('../../util/puppeteer-util')
const mathUtil = require('../utils/math-util')
// const { createClient } = require('redis')
const moment = require('moment');
const { createPropriedadeCavaloRecord } = require('../services/cavalos-services');
// const orquestradorApi = require('../../service/orquestrador-api-service')
// const GetRegistrosCavalos =
//     require('../../service/registrosCavalos').GetRegistrosCavalos

const SIGLA = 'CAVALOS-CORRIDA-REGISTROS'
// exports.sigla = SIGLA
let logUltimaLetraPesquisada = ''
// Parametros
const URL = 'https://expo.abcca.com.br/studbook/abcca_stud_pesq.asp'

// const getRegistrosCavalos = new GetRegistrosCavalos()

/**
 * Start script
 * @param {object} page
 * @param {object} docSite
 * @returns {object}
 * 
 */


exports.runRobo = async () => {
    let clientRedis = null

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
    const page = await browser.newPage()
    try {
        // abre uma conexão com o Redis
        // clientRedis = await createClient({ url: process.env.REDIS_CAVALO })
        //     .on('error', (err) => console.log('Redis Client Error', err))
        //     .connect()

        // retorna os ultimos registros coletados, se esses existirem
        const dadosRedis = []

        // dadosRedis[0] =
        //     (await clientRedis.get('inputLetrasArabeCavalos')) || 'a'
        // dadosRedis[1] = (await clientRedis.get('idxUltimaCavalosArabe')) || 0

        // Traz apenas os nomes dos cavalos
        // const nomesCavalos = (await registrosCavalos).map(
        //     (reg) => reg.csc_nome_cavalo
        // )
        const nomesCavalos = []

        try {
            await coleta(page, dadosRedis, clientRedis, nomesCavalos, URL)
        } catch (error) {
            console.error("Ocorreu um erro: ", error.message);

            // tentativa de chamar o cod 3x
            for (let tentativa = 1; tentativa <= 3; tentativa++) {
                await page.waitForTimeout(20000)
                // logger.info(`Resetando... Tentativa ${tentativa}`);
                try {
                    await coleta(page, dadosRedis, clientRedis, nomesCavalos)
                    break
                } catch (error) {
                    if (tentativa === 3) {
                        // logger.info('Falhou as 3 tentativas')
                    }
                }
            }
        }

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
        // chama a coleta 3 vezes
        throw error;
    } finally {
        if (clientRedis != null) {
            // desconectar o client do Redis
            await clientRedis.disconnect()
        }
    }
}

async function coleta(page, dadosRedis, clientRedis, nomesCavalos, URL) {
    // Initialize an empty array to hold the combinations
    // const combinations = arrayCombinacoes()

    const combLetras = dadosRedis[0] ?? ''
    const ultimoCavalo = dadosRedis[1] ?? ''

    // carrega as letras usadas na busca
    const primeiraLetra = combLetras[0] ?? 'a'
    const segundaLetra = combLetras[1] ?? 'a'
    const terceiraLetra = combLetras[2] ?? 'a'

    const combination = primeiraLetra + segundaLetra + terceiraLetra

    let idx = 0
    // combinations.forEach((comb, index) => {
    //     if (comb === combination) {
    //         idx = index
    //     }
    // })

    // expiração chave redis
    // const expiracao = { EX: process.env.CAVALO_TIMEOUT_REDIS }

    // logger.info('Buscou registros salvos no Redis')

    for (idx; idx < 3; idx++) {
        //Carrega a pagina
        await page.goto(URL)
        // await carregaPagina(page, URL)

        await page.waitForSelector('input[name="txtNOME"]')

        // limpa o nome que já está escrito
        await pesqNomeCavalo(page, 'CAB')

        // salva no Redis
        // await clientRedis.set(
        //     'inputLetrasArabeCavalos',
        //     combinations[idx],
        //     expiracao
        // )

        // logger.info('COLETANDO LETRAS: ', combinations[idx])
        // logUltimaLetraPesquisada = combinations[idx]

        await Promise.all([
            page.waitForResponse(
                (response) =>
                    response
                        .url()
                        .includes(
                            'https://expo.abcca.com.br/studbook/'
                        ) && response.ok()
            ),
            page.keyboard.press('Enter'),
        ])

        await page.waitForTimeout(mathUtil.random(500, 800))

        //Pega o valor de cada resultado encontrado
        const arrayRegistros = await page.evaluate(() => {
            //Trás as funções js a seres executadas no console
            const trDados = Array.from(
                document.querySelectorAll('table > tbody > tr > td > a')
            )
            const arrayUrls = trDados.map((tr) =>
                tr.getAttribute('href')
            )
            const arrayNomesCavalos = trDados.map((tr) => tr.innerText)
            //Mapeia o array com o href
            return { urls: arrayUrls, cavalos: arrayNomesCavalos }
        })

        let idxCavalo = 0
        arrayRegistros.urls.forEach((cavaloUrl, index) => {
            if (cavaloUrl === ultimoCavalo) {
                idxCavalo = index
            }
        })
        // loop que percorre cada jsFunction
        for (idxCavalo; idxCavalo < arrayRegistros.urls.length; idxCavalo++) {
            // await clientRedis.set(
            //     'idxUltimaCavalosArabe',
            //     arrayRegistros.urls[idxCavalo],
            //     expiracao
            // )
            if (nomesCavalos.includes(arrayRegistros.cavalos[idxCavalo])) {
                continue
            }

            // const id = arrayRegistros.urls[idxCavalo]?.split('=')?.[1]
            // const verificaSeJaColetadoRedis = await clientRedis.get(
            //     `arabe_${id}`
            // )

            // // Verifica, baseando-se pela chave do cavalo pelo ID se ele já foi coletado para não clicar no link e passar para o próximo
            // if (verificaSeJaColetadoRedis) {
            //     continue
            // }

            await carregaPagina(
                page,
                `https://expo.abcca.com.br/studbook/${arrayRegistros.urls[[idxCavalo]]}`
            )

            // logger.info('Carregou página do registro.')

            await page.waitForTimeout(mathUtil.random(500, 800))
            await page.waitForSelector('body > div.single-blog-page-area > div h4')

            const registro = await coletaRegistrosPorPagina(page)

            if (Object.keys(registro).length > 0) {

                // manda para o orquestrador salvar os registros no banco
                await createPropriedadeCavaloRecord(registro, SIGLA)
                // await PropriedadeCavalo.create(registro, SIGLA);
                // logger.info('nome cavalo: ' + registro.nome_cavalo)
            }

            // await clientRedis.set(`arabe_${id}`, 'true', expiracao)
            await page.waitForTimeout(1000)
        }

        // logger.warn('Salvou no Redis')
    }

    // logger.info('Coleta finalizada')
}

/**
 * Func que pesquisa o nome do cavalo
 * @param {object} page
 * @param {string} combination
 */
async function pesqNomeCavalo(page, combination) {
    //limpa o nome que já está escrito
    await page.click('input[name="txtNOME"]', { clickCount: 3 })
    await page.keyboard.press('Backspace')

    await page.waitForTimeout(1500)

    //insere o nome do animal
    await page.type('input[name="txtNOME"]', combination, {
        delay: mathUtil.random(150, 250),
    })

    await page.waitForTimeout(1000)
}

/**
 * Função que faz a coleta de registros
 * @param {object} page
 * @returns {array}
 */
async function coletaRegistrosPorPagina(page) {
    //loop para percorrer cada registro
    let objRegistro = {}

    const dadosRegistro = await page.evaluate(() => {
        const tdDadosCadastro = Array.from(
            document.querySelectorAll('table tbody tr')
        )

        //Pega apenas o texto das tags
        return tdDadosCadastro.map((td) => td.innerText)
    })

    // verifica se o nascimento do cavalo esta depois de 1990
    // caso contrario nao adiciona no array de resultados
    let campo_nascimento = dadosRegistro.filter((el) =>
        el.includes('NASCIMENTO')
    )

    let ano_nascimento = campo_nascimento[0]
        ? campo_nascimento[0].split('\t')[1]
        : ''

    // inicializa as variaveis
    // nome criador ou proprietario
    let nome_criador
    let nome_criador_tratado
    let nome_proprietario_cavalo_tratado
    if (
        dadosRegistro.filter((el) => el.includes('CRIADOR E PROPRIETÁRIO'))
            .length > 0
    ) {
        nome_criador = dadosRegistro.filter((el) =>
            el.includes('CRIADOR E PROPRIETÁRIO')
        )
        nome_criador_tratado = nome_criador[0]?.split('\t')[1]
        nome_proprietario_cavalo_tratado = nome_criador[0]?.split('\t')[1]
    } else {
        //dados_proprietario
        let nome_proprietario_cavalo = dadosRegistro.filter((el) =>
            el.includes('PROPRIETÁRIO')
        )
        nome_proprietario_cavalo_tratado = nome_proprietario_cavalo[0]
            ? nome_proprietario_cavalo[0]?.split('\t')[1]
            : ''

        //nome_criador
        nome_criador = dadosRegistro.filter((el) => el.includes('CRIADOR'))
        nome_criador_tratado = nome_criador[0]
            ? nome_criador[0]?.split('\t')[1]
            : ''
    }

    // verifica se estao os nomes criadores ou proprietarios ou ano nascimento
    if (
        (nome_proprietario_cavalo_tratado || nome_criador_tratado) &&
        moment(ano_nascimento, 'DD/MM/YYYY').year() > moment().year() - 35
    ) {
        //extração de dados
        //nome
        objRegistro.csc_nome_cavalo = await page.$eval(
            'h4 > a',
            (el) => el.innerText
        )
        //registro
        let registro = dadosRegistro.filter((el) => el.includes('REGISTRO'))
        objRegistro.csc_registro_cavalo = registro[0]
            ? registro[0]?.split('\t')[1]
            : ''

        //sexo
        let sexoCavalo = dadosRegistro.filter((el) => el.includes('SEXO'))
        let sexoCavaloTratado = sexoCavalo[0]
            ? sexoCavalo[0]?.split('\t')[1]
            : ''

        objRegistro.csc_sexo_cavalo = sexoCavaloTratado == 'FÊMEA' ? 'F' : 'M'

        //nascimento_cavalo
        const nascimento = moment(
            campo_nascimento[0]?.split('\t')[1],
            'DD/MM/YYYY'
        )

        objRegistro.csc_nascimento_cavalo = moment(
            ano_nascimento,
            'DD/MM/YYYY'
        ).format('YYYY/MM/DD')

        objRegistro.csc_nome_proprietario_cavalo = nome_proprietario_cavalo_tratado
        objRegistro.csc_nome_criador = nome_criador_tratado

        let checkIsbloqueado = await page.evaluate(() => {
            const tdDadosCadastro = document.querySelector('h4')
            if (tdDadosCadastro && tdDadosCadastro.innerText) {
                if (tdDadosCadastro.innerText.includes('BLOQUEADO')) {
                    return true
                }
            }
            return false
        })

        //observação
        objRegistro.registro_bloqueado = checkIsbloqueado

        // morte
        let cavaloMorto = dadosRegistro.filter((el) => el.includes('MORTE'))

        objRegistro.csc_is_vivo = !(cavaloMorto.length > 0)

        let dataMorte = cavaloMorto[0]
            ? cavaloMorto[0]?.split('\t')[1]
            : ''

        if (dataMorte) {
            let dataMorteTratada = moment(dataMorte, 'DD/MM/YYYY').format(
                'YYYY-MM-DD'
            )

            objRegistro.csc_data_obito = dataMorteTratada
        }
    }

    //retorna a pagina anterior e vai para o proximo registro
    return objRegistro
}

/**
 * Func que carrega a pagina do site
 * @param {object} page
 */
async function carregaPagina(page, url) {
    await Promise.all([
        page.goto(url),
        page.waitForResponse(
            (response) =>
                response
                    .url()
                    .includes(
                        'https://expo.abcca.com.br/'
                    ) && response.ok()
        )
    ])

    await page.waitForTimeout(800)
    //valida se pagina carregou
    // puppeteerUtil.isResponseOk(res, SIGLA, URL)
}

function arrayCombinacoes() {
    let combinations = []

    // Loop through the alphabet for the first letter
    for (let i = 65; i <= 90; i++) {
        let firstLetter = String.fromCharCode(i)

        // Loop through the alphabet for the second letter
        for (let j = 65; j <= 90; j++) {
            let secondLetter = String.fromCharCode(j)

            // Loop through the alphabet for the third letter
            for (let k = 65; k <= 90; k++) {
                let thirdLetter = String.fromCharCode(k)

                // Combine the three letters and add to the combinations array
                combinations.push(firstLetter + secondLetter + thirdLetter)
            }
        }
    }

    return combinations
};
