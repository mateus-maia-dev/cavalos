const { DATE, BOOLEAN, STRING, INTEGER } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const TbBasesCavalos = sequelize.define('TbBasesCavalos', {
        tbc_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        tbc_sigla: {
            type: STRING,
            allowNull: false
        },
        tbc_url: {
            type: STRING,
            allowNull: false
        },
        tbc_ativo: {
            type: BOOLEAN,
            default: true
        },
        tbc_prioridade: {
            type: INTEGER,
            default: 1
        },
        tbc_sistema_proxy: {
            type: STRING,
            allowNull: false
        },
        tbc_num_max_tentativas: {
            type: INTEGER,
            default: 3
        },
        tbc_ultima_coleta: {
            type: DATE,
        }
    }, {
        tableName: 'tb_bases_cavalos', // Explicitly define the table name
        timestamps: false // Disable timestamps if not needed
    });

    TbBasesCavalos.associate = function (models) {
        TbBasesCavalos.hasMany(models.ColetaSiteCavalos, {
            foreignKey: 'csc_coleta_site_id',
            sourceKey: 'cst_id',
            as: 'propriedades'
        });
    };

    return TbBasesCavalos;
};
