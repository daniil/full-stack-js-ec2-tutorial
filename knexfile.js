const connections = {
  development: {
    client: "mysql",
    connection: {
        host: "127.0.0.1",
        user: "root",
        password: "rootroot",
        database: "woodstock",
    }
  }
};

module.exports = connections.development;