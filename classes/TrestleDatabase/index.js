const { Sequelize } = require('sequelize')
const EventEmitter = require('node:events')

/**
 * TrestleDatabase is a class that handles the database connection and models.
 * We utilize EventEmitter to communicate when the database is connected and ready to use.
 * sequelize and mysql2 are our primary dependencies, everything else is up to the user.
 * @class TrestleDatabase
 * @extends EventEmitter
 */

class TrestleDatabase extends EventEmitter {
  _host = 'localhost' // Database Host (IP or Domain)
  _port = 3306 // Database Port, defaults to 3306
  _username = undefined // Database User, password will just be used at runtime and not stored.
  database = undefined // Database Name

  _instance = undefined // Database connection instance


  constructor (databaseName, username, password, options) {
    super()

    if (!databaseName) throw new Error('TrestleDatabase "databaseName" field is a required parameter.')
    if (!username) throw new Error('TrestleDatabase "username" field is a required parameter.')
    if (!password) throw new Error('TrestleDatabase "password" field is a required parameter.')

    const { host, port } = options || {}

    if (host) this._host = host
    if (port) this._port = port

    this.database = databaseName
    this._username = username

    this._instance = new Sequelize(this.database, this._username, password, {
      host: this._host,
      port: this._port,
      dialect: 'mysql',
      logging: false,
      define: {
        dialectOptions: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_520_ci'
        }
      },
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_520_ci'
    })
  }
}

module.exports = { TrestleDatabase }