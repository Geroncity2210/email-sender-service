const { producer } = require('./kafkaClient');

async function publish(topic, key, event) {
  await producer.send({
    topic,
    messages: [
      {
        key,
        value: JSON.stringify(event),
        headers: {
          eventType:  event.eventType,
          occurredAt: new Date().toISOString(),
        },
      },
    ],
  });

  console.log(`[billing] → Publicado en [${topic}]:`, JSON.stringify(event));
}

module.exports = { publish };