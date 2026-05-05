const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: [process.env.KAFKA_BROKER],
  ssl: true,

  sasl: {
    mechanism: 'plain',
    username: process.env.API_KEY,
    password: process.env.API_SECRET,
  },
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});


module.exports = kafka;