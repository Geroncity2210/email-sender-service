const kafka = require("./kafka");
const EmailService = require("./EmailSender");
const { handleOrder, handlePayment, handleShipment } = require("./topicHandlers");
const consumer = kafka.consumer({ groupId: "notification-service" });

async function runConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topics: ["orders", "payments", "shipments"], fromBeginning: false });
  const emailService = new EmailService({
    service: "gmail",
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const raw = message.value?.toString();
        console.log(
          `[notification] ← Recibido de [${topic}] partition=${partition} offset=${message.offset}`,
        );
        console.log(`[notification]   payload: ${raw}`);

        let event;
        try {
          event = JSON.parse(raw);
        } catch {
          console.error("[notification] Mensaje inválido (no es JSON), ignorando.");
          return;
        }

        let mailOptions;

        switch (topic) {
          case "orders":
            mailOptions = handleOrder(event);
            break;

          case "payments":
            mailOptions = handlePayment(event);
            break;

          case "shipments":
            mailOptions = handleShipment(event);
            break;

          default:
            console.warn("Topic no manejado:", topic);
            return;
        }

        if (!mailOptions) return;

        const sent = await emailService.send_email(mailOptions);

        console.log("Correo enviado:", sent);

      } catch (error) {
        console.error("Error procesando mensaje:", error);
      }
    }
  });
}

module.exports = runConsumer;