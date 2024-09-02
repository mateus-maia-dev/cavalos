const path = require('path');
const db = require('../models'); // Adjust the path as needed
const moment = require('moment');
const { getOneBase, createCavalo, getNumTentativas, verificaExistenciaRegistro, createColeta } = require('../repository/status-andamento-coletas');
const hash = require('object-hash')

const { TbBasesCavalos, ColetaSiteCavalos, MonitoraColetaCavalos } = db;

async function createPropriedadeCavaloRecord(registro, SIGLA) {
    try {
        // transforma o registro para hash
        const hashRegistro = hash(registro)
        // avaliar, através do hash, se já não existe esse registro
        const existeRegistro = await verificaExistenciaRegistro(hashRegistro)

        if (existeRegistro) {
            return false
        }

        // Step 1: Retrieve the cst_id from the coleta_site table based on the SIGLA
        const coletaSite = await TbBasesCavalos.findOne({
            where: { tbc_sigla: SIGLA }
        });

        if (!coletaSite) {
            throw new Error(`Nenhuma base de cavalos para a sigla: ${SIGLA}`);
        }

        const idBase = coletaSite.dataValues.tbc_id; // Extract cst_id from the query result

        // data da coleta
        const data_coleta = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')

        // Step 2: Create a new PropriedadeCavalo record using the retrieved cst_id
        const newPropriedadeCavalo = await ColetaSiteCavalos.create({
            ...registro,
            csc_coleta_site_id: idBase,
            csc_data_importacao: data_coleta,
            csc_hash: hash(registro)
        });

        console.log('New PropriedadeCavalo record created:', newPropriedadeCavalo);

        return true
    } catch (error) {
        console.error('Error creating PropriedadeCavalo record:', error.message);
    }

    return false
}

async function updateStatusColeta(sigla, comFalha, fim_coleta, motivoFalha, terminouColeta, qtdadeCavalosColetados) {
    // busca a coleta

    // atualiza status coleta
    await MonitoraColetaCavalos.update({
        can_pesquisa_em_andamento: false,
        can_com_falha: comFalha,
        can_fim: fim_coleta,
        can_motivo_falha: motivoFalha,
        can_coleta_finalizada: terminouColeta,
        can_quantidade_coletada: qtdadeCavalosColetados,
    }, {
        where: {
            can_sigla: sigla,
            can_pesquisa_em_andamento: true
        }
    })

    // atualiza status base na tabela tb_bases_cavalos se terminou a coleta
    if (terminouColeta) {

    }
}

async function updateStatusBase(sigla) {
    await TbBasesCavalos.update({ tbc_ultima_coleta: new Date() }, {
        where: { tbc_sigla: sigla }
    })
}

function convertSiglaToFilename(sigla) {
    return sigla.toLowerCase().replace(/\s+/g, '-') + '.js';
}

function getFile(sigla) {
    const filename = convertSiglaToFilename(sigla);
    const scriptPath = path.join(__dirname, '..', 'cavalos', filename);

    // localiza o arquivo para a execução
    const file = require(scriptPath);
    return file;
}

async function getBase(basesCavalos) {
    let siglaBase = ''
    for (const base of basesCavalos) {
        siglaBase = base.dataValues.tbc_sigla

        // TODO tratar esse retorno
        // Nao existem bases a serem processadas
        if (!siglaBase) {
            return
        }

        // verifica se já existe uma pesquisa em andamento com essa base
        const pesquisaJaEmAndamento = await getOneBase(siglaBase)

        if (pesquisaJaEmAndamento) {
            console.log(`Não foi possivel adicionar base ${siglaBase}. Coleta já está em andamento.`)
            continue
        }

        // traz o numero de tentativas para essa base
        // e verifica se já atingiu o numero máximo
        const tentativasColetas = await getNumTentativas(siglaBase)
        if (tentativasColetas.length > 5) {  // passar para .env
            // logger.info(
            //     'Já atingiu o numero máximo de tentativas para a base: ' + siglaBase
            // )

            console.log('Já atingiu o numero máximo de tentativas para a base: ' + siglaBase)
            continue
        }

        // usar validações do Sequelize depois
        // setar a pesquisa da base como em andamento
        try {
            // TODO REMOVER CAVALOS-CAMPOLINA-REGISTROS
            await createColeta(siglaBase)
        } catch (error) {
            console.error(error)
        }

        console.log('Adicionado uma nova pesquisa: ', siglaBase);

        break
    }
    // transforma a sigla no caminho arquivo
    // TODO REMOVER CAVALOS-CAMPOLINA-REGISTROS
    const baseCavalo = getFile('CAVALOS-CAMPOLINA-REGISTROS');

    return baseCavalo
}


// await createPropriedadeCavaloRecord(registro, SIGLA);
exports.createPropriedadeCavaloRecord = createPropriedadeCavaloRecord
exports.updateStatusColeta = updateStatusColeta
exports.updateStatusBase = updateStatusBase
exports.getBase = getBase
