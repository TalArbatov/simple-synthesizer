module.exports = {
    postgresql: {
        host: process.env.POSTGRESQL_HOST || "localhost",
        port: process.env.POSTGRESQL_PORT || 5432,
        user: process.env.POSTGRESQL_USER || "postgres",
        database: process.env.POSTGRESQL_DATABASE || "psynth",
        password: process.env.POSTGRESQL_PASSWORD || "postgres",
    },

    ["web-server"]: {
        port: 4000,
        clientDir: "../client/dist",
    },
};
