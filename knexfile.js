require('dotenv').config({ path: './.env' });

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'StrongPass123',
      database: process.env.DB_NAME || 'tourist_app_db',
    },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' }
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }
    },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' }
  }
};