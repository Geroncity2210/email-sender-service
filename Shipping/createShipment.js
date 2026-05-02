const { v4: uuidv4 }  = require('uuid');
const pool            = require('../db');
const { publish }     = require('../producer');

/**
 * Genera el registro de envío y publica ShipmentCreated.
 * Garantiza idempotencia con índice UNIQUE en order_id.
 */
async function createShipment(event) {
  const { orderId, customerId, customerEmail, customerName, productId, productName, quantity, totalPrice, paymentId } = event;

  // Generar código de seguimiento único
  const trackingCode = `TRK-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

  try {
    const res = await pool.query(
      `INSERT INTO shipments (order_id, product_id, customer_id, quantity, status, tracking_code)
       VALUES ($1, $2, $3, $4, 'IN_TRANSIT', $5)
       ON CONFLICT (order_id) DO NOTHING
       RETURNING *`,
      [orderId, productId, customerId, quantity, trackingCode]
    );

    // Si no insertó nada, ya existía (idempotencia)
    if (res.rows.length === 0) {
      console.log(`[shipping] ⚠ Envío ya creado para orderId=${orderId} (idempotencia). Ignorando.`);
      return;
    }

    const shipment = res.rows[0];
    console.log(`[shipping] Envío creado: ${shipment.id} | tracking=${shipment.tracking_code} | orderId=${orderId} | cliente=${customerEmail}`);

    await publish('shipments', orderId, {
      eventType:    'ShipmentCreated',
      shipmentId:   shipment.id,
      orderId,
      customerId,
      customerEmail,
      customerName,
      productId,
      productName,
      quantity,
      totalPrice,
      paymentId,
      trackingCode: shipment.tracking_code,
      status:       shipment.status,
      createdAt:    shipment.created_at,
    });

  } catch (err) {
    console.error(`[shipping] Error al crear envío para orderId=${orderId}:`, err.message);
    throw err;
  }
}

module.exports = { createShipment };