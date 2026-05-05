function handleOrder(data) {
  
  return {
    from: process.env.EMAIL_USER,
    to:data.customerEmail ,
    subject: "Orden recibida",
    text: `Orden generada:${data.orderId}\nProducto solicitado: ${data.productName}\nCantidad:${data.quantity}\nTotal generado: ${data.totalPrice}`,
  };
}

function handlePayment(data) {
  return {
    from: process.env.EMAIL_USER,
    to:data.customerEmail,
    subject: "Pago confirmado",
    text: `Tu pago para la orden ${data.orderId} por $${data.totalPrice} fue exitoso y se generará su envío`,
  };
}

function handleShipment(data) {
  if (data.eventType === 'ShipmentCreated') {
    return {
      from: process.env.EMAIL_USER,
      to:data.customerEmail,
      subject: "Envío en camino",
      text: `Envío generado con ID:${data.shipmentId}\n
       Producto pedido: ${data.productName}\n
       Cantidad: ${data.quantity}`,
    };
  }

  if (data.eventType === 'StockFailed') {
    return {
      from: process.env.EMAIL_USER,
      to:data.customerEmail,
      subject: "Estamos sin stock!",
      text: `La orden ${data.orderId} no se puede generar porque no hay stock suficiente del producto ${data.productName}, lo lamentamos!`,
    };
  }
}

module.exports = {
  handleOrder,
  handlePayment,
  handleShipment
};