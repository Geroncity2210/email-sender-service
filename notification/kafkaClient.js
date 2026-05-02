const kafka = require("./kafka");

const consumer = kafka.consumer({ groupId: "notification-service" });
async function runConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "Orders", fromBeginning: false });
  await consumer.subscribe({ topic: "Payments", fromBeginning: false });
  await consumer.subscribe({ topic: "Shipments", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        switch (topic) {
          case "Orders":
            let {to, product, quantity} = message.value;  
            // ...
            break;
      
          case "Payments":
            let {to, orderId, product, mount, quantity} = message.value;
            // ...
            break;
          case "Shipment":
            let {to, product, service } = message.value;
            // ...
            break;
          
          default:
            break;
        }
        
        
        const data = JSON.parse(message.value.toString());

        console.log("Evento recibido:", data);

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: data.to,
          subject: ``,
          text: data.text
        };

        const sent = await emailService.send_email(mailOptions);

        console.log("Correo enviado:", sent);

      } catch (error) {
        console.error("Error procesando mensaje:", error);
      }
    }
  });
}

module.exports = runConsumer;