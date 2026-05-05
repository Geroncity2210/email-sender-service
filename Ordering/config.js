module.exports = {
  kafka: {
    broker: process.env.KAFKA_BROKER || "localhost:9092",
  },
  db: {
    host: process.env.DB_COMERCIAL_HOST || "localhost",
    port: parseInt(process.env.DB_COMERCIAL_PORT || "5432"),
    database: process.env.DB_COMERCIAL_NAME || "comercial",
    user: process.env.DB_COMERCIAL_USER || "admin",
    password: process.env.DB_COMERCIAL_PASSWORD || "secret123",
  },
  service:{
    port:8080
  }
};
