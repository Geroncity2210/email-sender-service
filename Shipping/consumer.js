const { consumer } = require("./kafkaClient");
const { createShipment } = require("./createShipment");

async function startConsumer() {
  await consumer.subscribe({ topic: "shipments", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString();
      console.log(
        `[shipping] ← Recibido de [${topic}] partition=${partition} offset=${message.offset}`,
      );
      console.log(`[shipping]   payload: ${raw}`);

      let event;
      try {
        event = JSON.parse(raw);
      } catch {
        console.error("[shipping] Mensaje inválido (no es JSON), ignorando.");
        return;
      }

      if (event.eventType !== "StockReserved") {
        console.log(`[shipping] Evento ${event.eventType} ignorado (solo procesa StockReserved)`);
        return;
      }

      try {
        await createShipment(event);
      } catch (err) {
        console.error(`[shipping] Error en createShipment:`, err.message);
      }
    },
  });

  console.log("[shipping] Consumer escuchando tópico: payments");
}

module.exports = { startConsumer };
