const { Kafka } = require('kafkajs');
const config    = require('./config');

const kafka = new Kafka({
  clientId: 'billing-service',
  brokers:  [config.kafka.broker],
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'billing-group' });

async function connect() {
  await producer.connect();
  await consumer.connect();
  console.log('[billing] Kafka producer y consumer conectados');
}

module.exports = { producer, consumer, connect };