const { TbBasesCavalos, MonitoraColetaCavalos, ColetaSiteCavalos } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// Traz o numero de pesquisas em andamento
// e verifica qual o limite de pesquisas em paralelo
exports.getPesquisasEmAndamento = async () => {
    return await MonitoraColetaCavalos.findAll({
        where: { can_pesquisa_em_andamento: true }
    })
}

exports.getAllBases = async () => {
    // TODO preciso filtrar pela coleta final
    return await TbBasesCavalos.findAll({
        where: {
            tbc_ativo: true,
            [Op.or]: [
                { tbc_ultima_coleta: null },
                {
                    tbc_ultima_coleta: {
                        [Op.lt]: literal(`NOW() - INTERVAL '30 days'`)
                    }
                }
            ]
        }
    })
}

exports.getOneBase = async (siglaBase) => {
    // verifica se já existe uma pesquisa em andamento com essa base
    return await MonitoraColetaCavalos.findOne({
        where: { can_sigla: siglaBase, can_pesquisa_em_andamento: true, can_coleta_finalizada: false }
    })
}

exports.getNumTentativas = async (siglaBase) => {
    return await MonitoraColetaCavalos.findAll({
        where: { can_sigla: siglaBase, can_pesquisa_em_andamento: false, can_com_falha: true }
    })
}

exports.createColeta = async (siglaBase) => {
    return await MonitoraColetaCavalos.create({
        can_sigla: siglaBase,
        can_inicio: new Date(),
        can_pesquisa_em_andamento: true,
    })

}

exports.verificaExistenciaRegistro = async (hash) => {
    return await ColetaSiteCavalos.findOne({
        where: { csc_hash: hash }
    })
}
