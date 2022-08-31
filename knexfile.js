const connections = {
  development: {
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: 'rootroot',
      database: 'test_deploy',
    },
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DB_URL,
      ssl: true
    }
  },
};

module.exports = 
  process.env.NODE_ENV === 'production'
    ? connections.production
    : connections.development;