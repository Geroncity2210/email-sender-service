const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "email-service",
  brokers: [process.env.CONFLUENT_BROKER] // o tu cluster de Confluent
});

module.exports = kafka;