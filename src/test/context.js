const { randomBytes } = require('crypto')
const { default: migrate } = require('node-pg-migrate')
const format = require('pg-format')
const pool = require('../pool')

const DEFAULT_OPTS = {
  host: 'localhost',
  port: 5432,
  database: 'socialnetwork-test',
  user: 'sergeyankarenko',
  password: ''
}

class Context {
  static async build() {
    // randomly generating a role to connect to PG as
    const roleName = 'a' + randomBytes(4).toString('hex')

    // connect to PG as usual
    await pool.connect(DEFAULT_OPTS)

    // create a new role
    await pool.query(format(
      'CREATE ROLE %I WITH LOGIN PASSWORD %L;',
      roleName, roleName
    ))

    // create a schema with the same name
    await pool.query(format(
      'CREATE SCHEMA %I AUTHORIZATION %I', roleName, roleName
    ))

    // disconnect entirely from PG
    await pool.close()

    // run our migrations in the new schema
    await migrate({
      schema: roleName,
      direction: 'up',
      log: () => {},
      noLock: true,
      dir: 'migrations',
      databaseUrl: {
        ...DEFAULT_OPTS,
        user: roleName,
        password: roleName
      }
    })

    // connect to PG as the newly created role
    await pool.connect({
      ...DEFAULT_OPTS,
      user: roleName,
      password: roleName
    })

    return new Context(roleName)
  }

  constructor(roleName) {
    this.roleName = roleName
  }

  async reset() {
    return pool.query(`
      DELETE FROM users;
    `)
  }

  async close() {
    // diconnect from PG
    await pool.close()
    
    // reconnect as our root user
    await pool.connect(DEFAULT_OPTS)

    // delete the role and schema we created
    await pool.query(format(
      'DROP SCHEMA %I CASCADE;', this.roleName
    ))

    await pool.query(format(
      'DROP ROLE %I;', this.roleName
    ))

    // disconnect
    await pool.close()
  }
}

module.exports = Context