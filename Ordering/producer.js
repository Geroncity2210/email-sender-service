const { producer } = require('./kafkaClient');

/**
 * Publica un evento en el tópico especificado.
 * @param {string} topic  - nombre del tópico Kafka
 * @param {string} key    - clave del mensaje (p.ej. orderId)
 * @param {object} event  - payload del evento
 */
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

  console.log(`[ordering] → Publicado en [${topic}]:`, JSON.stringify(event));
}

module.exports = { publish };