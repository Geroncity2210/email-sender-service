const { Kafka } = require('kafkajs');
const config    = require('./config');

const kafka = new Kafka({
  clientId: 'ordering-service',
  brokers:  [config.kafka.broker],
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});

const producer = kafka.producer();

async function connectProducer() {
  await producer.connect();
  console.log('[ordering] Kafka producer conectado');
}

module.exports = { producer, connectProducer };