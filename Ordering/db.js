const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.COMMERCIAL_DB_HOST,
  port: Number(process.env.COMMERCIAL_DB_PORT || 3306),
  user: process.env.COMMERCIAL_DB_USER,
  password: process.env.COMMERCIAL_DB_PASSWORD,
  database: process.env.COMMERCIAL_DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

module.exports = pool;