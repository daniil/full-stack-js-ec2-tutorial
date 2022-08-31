const connections = {
  development: {
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: 'YourRootPassword',
      database: 'YourDatabaseName',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DB_URL,
  },
};

module.exports = 
  process.env.NODE_ENV === 'production'
    ? connections.production
    : connections.development;