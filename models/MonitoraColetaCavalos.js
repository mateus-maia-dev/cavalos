module.exports = (sequelize, DataTypes) => {
    const MonitoraColetaCavalos = sequelize.define('MonitoraColetaCavalos', {
        can_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        can_sigla: DataTypes.STRING,
        can_inicio: DataTypes.DATE,
        can_fim: DataTypes.DATE,
        can_com_falha: {
            type: DataTypes.BOOLEAN,
            default: false
        },
        can_coleta_finalizada: {
            type: DataTypes.BOOLEAN
        },
        can_pesquisa_em_andamento: DataTypes.BOOLEAN,
        can_motivo_falha: DataTypes.STRING,
        can_quantidade_coletada: DataTypes.INTEGER
    },
        {
            tableName: 'monitora_coleta_cavalos',
            timestamps: false,
            primaryKey: false
        }
    )

    // MonitoraColetaCavalos.associates = function (models) {
    //     MonitoraColetaCavalos.belongsTo(models.ColetaSite, {
    //         foreignKey: 'can_site',
    //         targetKey: 'cst_id',
    //         as: 'coletaSite'
    //     })
    // }
    return MonitoraColetaCavalos
}