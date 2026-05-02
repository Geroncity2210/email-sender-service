const { consumer }     = require('./kafkaClient');
const { reserveStock } = require('./handlers/reserveStock');

async function startConsumer() {
  await consumer.subscribe({ topic: 'payments', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString();
      console.log(`[inventory] ← Recibido de [${topic}] partition=${partition} offset=${message.offset}`);
      console.log(`[inventory]   payload: ${raw}`);

      let event;
      try {
        event = JSON.parse(raw);
      } catch {
        console.error('[inventory] Mensaje inválido (no es JSON), ignorando.');
        return;
      }

      if (event.eventType !== 'PaymentProcessed') {
        console.log(`[inventory] Evento ${event.eventType} ignorado`);
        return;
      }

      if (event.paymentStatus !== 'APPROVED') {
        console.log(`[inventory] Pago no aprobado para orderId=${event.orderId}, estado=${event.paymentStatus}. No se reserva stock.`);
        return;
      }

      try {
        await reserveStock(event);
      } catch (err) {
        console.error(`[inventory] Error en reserveStock:`, err.message);
      }
    },
  });

  console.log('[inventory] Consumer escuchando tópico: payments');
}

module.exports = { startConsumer };