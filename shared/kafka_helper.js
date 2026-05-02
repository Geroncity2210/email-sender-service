const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'email-sender-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

module.exports = kafka;