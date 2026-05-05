require("dotenv").config();

module.exports = {
  kafka: {
    broker: process.env.KAFKA_BROKER,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
  },
  db: {
    host: process.env.DB_COMERCIAL_HOST || "localhost",
    port: parseInt(process.env.DB_COMERCIAL_PORT || "5432"),
    database: process.env.DB_COMERCIAL_NAME || "comercial",
    user: process.env.DB_COMERCIAL_USER || "admin",
    password: process.env.DB_COMERCIAL_PASSWORD || "secret123",
  },
  service:{
    port:process.env.API_PORT
  }
};
