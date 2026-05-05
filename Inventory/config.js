module.exports = {
  kafka: {
    broker: process.env.KAFKA_BROKER || 'localhost:9092',
  },
  db: {
    host:     process.env.LOGISTICS_DB_HOST     || 'localhost',
    port:     parseInt(process.env.LOGISTICS_DB_PORT || '5432'),
    database: process.env.LOGISTICS_DB_NAME     || 'logistica',
    user:     process.env.LOGISTICS_DB_USER     || 'admin',
    password: process.env.LOGISTICS_DB_PASSWORD || 'secret123',
  },
};