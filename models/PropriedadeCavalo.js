const ColetaSite = require("./ColetaSite");

// Definir mapeamento ORM
module.exports = (sequelize, DataTypes) => {
    const PropriedadeCavalo = sequelize.define('PropriedadeCavalo', {
        csc_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        csc_registro_cavalo: DataTypes.STRING,
        csc_nome_cavalo: DataTypes.STRING,
        csc_nascimento_cavalo: DataTypes.DATE,
        csc_sexo_cavalo: DataTypes.CHAR,
        csc_nome_proprietario_cavalo: DataTypes.STRING,
        csc_endereco_proprietario: DataTypes.STRING,
        csc_nome_criador: DataTypes.STRING,
        csc_is_vivo: DataTypes.BOOLEAN,
        csc_data_importacao: DataTypes.DATE,
        csc_coleta_site_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'ColetaSite',
                key: 'cst_id'
            },
        },
        csc_uf_criador: DataTypes.STRING,
        csc_data_obito: DataTypes.DATE,
        csc_nome_cidade_criador: DataTypes.STRING,
        csc_dados_origem: DataTypes.TEXT,
        csc_hash: DataTypes.STRING,
        csc_is_ativo: {
            type: DataTypes.BOOLEAN,
            default: true
        }
    }, {
        tableName: 'coleta_site_cavalo',
        timestamps: false,
        primaryKey: false,
    });

    PropriedadeCavalo.associate = function (models) {
        PropriedadeCavalo.belongsTo(models.ColetaSite, {
            foreignKey: 'csc_coleta_site_id',
            targetKey: 'cst_id',
            as: 'coletaSite'
        });
    };

    return PropriedadeCavalo;
};

