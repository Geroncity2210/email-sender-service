const pool = require("./db");
const { publish } = require("./producer");

/**
 * Procesa el pago de una orden.
 * Garantiza idempotencia: si ya existe un pago para este orderId, no vuelve a procesar.
 */
async function processPayment(event) {
  const {
    orderId,
    customerId,
    customerEmail,
    customerName,
    productId,
    productName,
    quantity,
    totalPrice,
  } = event;

  // ── Idempotencia: verificar si ya procesamos este pago ────
  const existing = await pool.query("SELECT id, status FROM payments WHERE order_id = $1", [
    orderId,
  ]);
  if (existing.rows.length > 0) {
    console.log(`[billing] ⚠ Pago ya procesado para orderId=${orderId} (idempotencia). Ignorando.`);
    return;
  }

  // ── Simular aprobación del pago ───────────────────────────
  const approved = true;
  const paymentStatus = approved ? "APPROVED" : "REJECTED";
  const newOrderStatus = approved ? "PAID" : "FAILED";

  // ── Persistir pago en transacción ────────────────────────
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const paymentRes = await client.query(
      `INSERT INTO payments (order_id, amount, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [orderId, totalPrice, paymentStatus],
    );
    const payment = paymentRes.rows[0];

    await client.query("UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2", [
      newOrderStatus,
      orderId,
    ]);

    await client.query("COMMIT");

    console.log(
      `[billing] Pago ${paymentStatus} | orderId=${orderId} | paymentId=${payment.id} | amount=$${totalPrice}`,
    );

    // ── Publicar evento PaymentProcessed ─────────────────────
    const outEvent = {
      eventType: "PaymentProcessed",
      paymentId: payment.id,
      orderId,
      customerId,
      customerEmail,
      customerName,
      productId,
      productName,
      quantity,
      totalPrice,
      paymentStatus,
      processedAt: payment.created_at,
    };

    await publish("payments", orderId, outEvent);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`[billing] Error procesando pago para orderId=${orderId}:`, err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { processPayment };
