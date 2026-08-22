const mysql = require('mysql2/promise');

let pool;
let migrationFailed = false;

async function initializePool() {
  const username = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;

  if (!username || !password) {
    console.warn('WARNING: DB_USERNAME and DB_PASSWORD not set - migrations will be skipped');
    migrationFailed = true;
    return;
  }

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME || 'emailSummarizer',
      user: username,
      password: password,
      ssl: process.env.DB_SSL === 'true'
    });

    await pool.execute('SELECT 1');
    console.log('Database pool initialized successfully');
  } catch (err) {
    console.warn('Database connection failed, migrations skipped:', err.message);
    migrationFailed = true;
  }
}

initializePool().catch(err => {
  console.error('Database initialization error:', err.message);
  migrationFailed = true;
});

const db = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'emailSummarizer',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true',
  query: async (sql, params = []) => {
    if (!pool) throw new Error('Database pool not initialized');
    const [results] = await pool.execute(sql, params);
    return results;
  },
  getConnection: () => pool
};

module.exports = db;