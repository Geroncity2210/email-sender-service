const { Pool } = require('pg');
const config   = require('./config');

const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('[ordering] Error inesperado en pool de DB:', err.message);
});

module.exports = pool;