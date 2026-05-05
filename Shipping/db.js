const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.LOGISTICS_DB_HOST || "localhost",
  port: parseInt(process.env.LOGISTICS_DB_PORT || "5433"),
  user: process.env.LOGISTICS_DB_USER || "admin",
  password: process.env.LOGISTICS_DB_PASSWORD || "secret123",
  database: process.env.LOGISTICS_DB_NAME || "logistics_db",
});

pool.on("error", (err) => {
  console.error("[shipping] Error inesperado en pool de DB:", err.message);
});

module.exports = pool;
