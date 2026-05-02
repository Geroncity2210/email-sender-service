module.exports = {
  kafka: {
    broker: process.env.KAFKA_BROKER || 'localhost:9092',
  },
  db: {
    host:     process.env.DB_LOGISTICA_HOST     || 'localhost',
    port:     parseInt(process.env.DB_LOGISTICA_PORT || '5432'),
    database: process.env.DB_LOGISTICA_NAME     || 'logistica',
    user:     process.env.DB_LOGISTICA_USER     || 'admin',
    password: process.env.DB_LOGISTICA_PASSWORD || 'secret123',
  },
};