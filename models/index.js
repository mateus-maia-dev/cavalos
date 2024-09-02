const Sequelize = require('sequelize');
const ColetaSiteCavalos = require('./ColetaSiteCavalos');
const TbBasesCavalos = require('./TbBasesCavalos');
const MonitoraColetaCavalos = require('./MonitoraColetaCavalos');
const config = require('../config/config.json')['development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    timezone: '+00:00',
    logging: false
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.ColetaSiteCavalos = ColetaSiteCavalos(sequelize, Sequelize.DataTypes);
db.TbBasesCavalos = TbBasesCavalos(sequelize, Sequelize.DataTypes);
db.MonitoraColetaCavalos = MonitoraColetaCavalos(sequelize, Sequelize.DataTypes);

module.exports = db;
