require("dotenv").config();

module.exports = {
  kafka: {
    broker: process.env.KAFKA_BROKER,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
  },
  db: {
    host:     process.env.DB_LOGISTICA_HOST     || 'localhost',
    port:     parseInt(process.env.DB_LOGISTICA_PORT || '5432'),
    database: process.env.DB_LOGISTICA_NAME     || 'logistica',
    user:     process.env.DB_LOGISTICA_USER     || 'admin',
    password: process.env.DB_LOGISTICA_PASSWORD || 'secret123',
  },
};