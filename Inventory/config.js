require("dotenv").config();
module.exports = {
  kafka: {
    broker: process.env.KAFKA_BROKER,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
  },
  db: {
    host:     process.env.LOGISTICS_DB_HOST     || 'localhost',
    port:     parseInt(process.env.LOGISTICS_DB_PORT || '5432'),
    database: process.env.LOGISTICS_DB_NAME     || 'logistica',
    user:     process.env.LOGISTICS_DB_USER     || 'admin',
    password: process.env.LOGISTICS_DB_PASSWORD || 'secret123',
  },
};