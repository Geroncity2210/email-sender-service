const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.COMMERCIAL_DB_HOST || "localhost",
  port: parseInt(process.env.COMMERCIAL_DB_PORT || "5432"),
  user: process.env.COMMERCIAL_DB_USER || "admin",
  password: process.env.COMMERCIAL_DB_PASSWORD || "secret123",
  database: process.env.COMMERCIAL_DB_NAME || "commercial_db",
});

pool.on("error", (err) => {
  console.error("[ordering] Error inesperado en pool de DB:", err.message);
});

module.exports = pool;
