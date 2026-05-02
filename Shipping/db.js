const { Pool } = require('pg');
const config   = require('./config');

const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('[shipping] Error inesperado en pool de DB:', err.message);
});

module.exports = pool;