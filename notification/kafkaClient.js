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
    eachMessage: async ({ topic, message }) => {
      try {
        const data = JSON.parse(message.value.toString());

        console.log("Evento recibido:", topic, data);

        let mailOptions;

        switch (topic) {
          case "orders":
            mailOptions = handleOrder(data);
            break;

          case "payments":
            mailOptions = handlePayment(data);
            break;

          case "shipments":
            mailOptions = handleShipment(data);
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