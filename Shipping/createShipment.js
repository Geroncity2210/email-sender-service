const { randomUUID } = require("crypto");
const pool = require("./db");
const { publish } = require("./producer");

/**
 * Genera el registro de envío y publica ShipmentCreated en el tópico shipments.
 * Garantiza idempotencia con ON CONFLICT (order_id) DO NOTHING.
 */
async function createShipment(event) {
  const {
    orderId,
    customerId,
    customerEmail,
    customerName,
    productId,
    productName,
    quantity,
    totalPrice,
    paymentId,
  } = event;

  const trackingNumber = `TRK-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

  try {
    const res = await pool.query(
      `INSERT INTO shipments
         (id, order_id, customer_id, payment_status, stock_status, shipment_status, tracking_number)
       VALUES ($1, $2, $3, 'APPROVED', 'RESERVED', 'IN_TRANSIT', $4)
       ON CONFLICT (order_id) DO NOTHING
       RETURNING *`,
      [randomUUID(), orderId, customerId, trackingNumber],
    );

    // Si no insertó nada, ya existía (idempotencia)
    if (res.rows.length === 0) {
      console.log(
        `[shipping] ⚠ Envío ya creado para orderId=${orderId} (idempotencia). Ignorando.`,
      );
      return;
    }

    const shipment = res.rows[0];
    console.log(
      `[shipping] Envío creado: ${shipment.id} | tracking=${shipment.tracking_number} | orderId=${orderId} | cliente=${customerEmail}`,
    );

    await publish("shipments", orderId, {
      eventType: "ShipmentCreated",
      shipmentId: shipment.id,
      orderId,
      customerId,
      customerEmail,
      customerName,
      productId,
      productName,
      quantity,
      totalPrice,
      paymentId,
      trackingNumber: shipment.tracking_number,
      status: shipment.shipment_status,
      createdAt: shipment.created_at,
    });
  } catch (err) {
    console.error(`[shipping] Error al crear envío para orderId=${orderId}:`, err.message);
    throw err;
  }
}

module.exports = { createShipment };
