const { consumer }         = require('./kafkaClient');
const { processPayment }   = require('./handlers/processPayment');

async function startConsumer() {
  await consumer.subscribe({ topic: 'orders', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString();
      console.log(`[billing] ← Recibido de [${topic}] partition=${partition} offset=${message.offset}`);
      console.log(`[billing]   payload: ${raw}`);

      let event;
      try {
        event = JSON.parse(raw);
      } catch {
        console.error('[billing] Mensaje inválido (no es JSON), ignorando.');
        return;
      }

      if (event.eventType !== 'OrderCreated') {
        console.log(`[billing] Evento ${event.eventType} ignorado (no es OrderCreated)`);
        return;
      }

      try {
        await processPayment(event);
      } catch (err) {
        console.error(`[billing] Error en processPayment:`, err.message);
        // En producción: mover a dead-letter topic
      }
    },
  });

  console.log('[billing] Consumer escuchando tópico: orders');
}

module.exports = { startConsumer };