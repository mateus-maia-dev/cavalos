const { DATE, BOOLEAN } = require("sequelize");
const PropriedadeCavalo = require("./PropriedadeCavalo");

module.exports = (sequelize, DataTypes) => {
    const ColetaSite = sequelize.define('ColetaSite', {
        cst_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        cst_is_ativo: {
            type: BOOLEAN
        },
        cst_ultima_coleta: {
            type: DATE,
        }
    }, {
        tableName: 'coleta_site', // Explicitly define the table name
        timestamps: false // Disable timestamps if not needed
    });

    // ColetaSite.associate = function (models) {
    //     // Define the relationship with PropriedadeCavalo
    //     ColetaSite.hasMany(models.PropriedadeCavalo, {
    //         foreignKey: 'csc_coleta_site_id',
    //         sourceKey: 'cst_id', // The column in ColetaSite that is the primary key
    //         as: 'propriedades'
    //     });
    // };

    ColetaSite.associate = function (models) {
        ColetaSite.hasMany(models.PropriedadeCavalo, {
            foreignKey: 'csc_coleta_site_id',
            sourceKey: 'cst_id',
            as: 'propriedades'
        });
    };

    return ColetaSite;
};

// const propriedadeCavalo = await PropriedadeCavalo.findOne({
//     where: { csc_coleta_site_id: cst_id },
//     include: [{ model: ColetaSite, as: 'coletaSite' }]
// });

// console.log(propriedadeCavalo.coletaSite); 
