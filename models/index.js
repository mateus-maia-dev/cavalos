const Sequelize = require('sequelize');
const { PropriedadeCavalo } = require('./PropriedadeCavalo');
const { ColetaSite } = require('./ColetaSite');
const config = require('../config/config.json')['development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.PropriedadeCavalo = require('./PropriedadeCavalo')(sequelize, Sequelize.DataTypes);
db.ColetaSite = require('./ColetaSite')(sequelize, Sequelize.DataTypes);

module.exports = db;
