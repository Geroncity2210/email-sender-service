const { Kafka } = require('kafkajs');
const config    = require('./config');

const kafka = new Kafka({
  clientId: 'inventory-service',
  brokers:  [config.kafka.broker],
  retry: { initialRetryTime: 300, retries: 10 },
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'inventory-group' });

async function connect() {
  await producer.connect();
  await consumer.connect();
  console.log('[inventory] Kafka producer y consumer conectados');
}

module.exports = { producer, consumer, connect };