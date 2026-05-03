function handleOrder(data) {
  const { to, product, quantity } = data;

  return {
    from: process.env.EMAIL_USER,
    to,
    subject: "Orden recibida",
    text: `Tu orden de ${quantity} ${product}(s) fue creada correctamente.`,
  };
}

function handlePayment(data) {
  const { to, orderId, amount } = data;

  return {
    from: process.env.EMAIL_USER,
    to,
    subject: "Pago confirmado",
    text: `Tu pago para la orden ${orderId} por $${amount} fue exitoso.`,
  };
}

function handleShipment(data) {
  const { to, product, service } = data;

  return {
    from: process.env.EMAIL_USER,
    to,
    subject: "Envío en camino",
    text: `Tu producto ${product} fue enviado por ${service}.`,
  };
}

module.exports = {
  handleOrder,
  handlePayment,
  handleShipment
};