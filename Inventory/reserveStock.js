const pool = require("./db");
const { publish } = require("./producer");

/**
 * Valida stock disponible y lo reserva.
 * Publica StockReserved o StockFailed en el tópico shipments.
 */
async function reserveStock(event) {
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

  // ── Idempotencia: verificar si ya procesamos este orderId ──
  // Usamos un advisory lock de PostgreSQL sobre el orderId
  const lockKey = parseInt(orderId.replace(/-/g, "").slice(0, 8), 16);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey]);

    // Verificar si ya hay un envío creado para esta orden (idempotencia)
    const existing = await client.query("SELECT id FROM shipments WHERE order_id = $1", [orderId]);
    if (existing.rows.length > 0) {
      console.log(
        `[inventory] ⚠ Stock ya reservado para orderId=${orderId} (idempotencia). Ignorando.`,
      );
      await client.query("ROLLBACK");
      return;
    }

    // Verificar stock disponible
    const stockRes = await client.query(
      "SELECT total_stock, reserved FROM inventory WHERE product_id = $1 FOR UPDATE",
      [productId],
    );

    if (stockRes.rows.length === 0) {
      throw new Error(`Producto ${productId} no encontrado en inventario`);
    }

    const { total_stock, reserved } = stockRes.rows[0];
    const available = total_stock - reserved;

    if (available < quantity) {
      await client.query("ROLLBACK");
      console.warn(
        `[inventory] Stock insuficiente para ${productId}: disponible=${available}, requerido=${quantity}`,
      );

      await publish("shipments", orderId, {
        eventType: "StockFailed",
        orderId,
        customerId,
        customerEmail,
        customerName,
        productId,
        productName,
        quantity,
        totalPrice,
        paymentId,
        reason: `Stock insuficiente: disponible=${available}`,
      });
      return;
    }

    // Reservar stock
    await client.query(
      "UPDATE inventory SET reserved = reserved + $1, updated_at = NOW() WHERE product_id = $2",
      [quantity, productId],
    );

    await client.query("COMMIT");

    console.log(
      `[inventory] Stock reservado: ${quantity}x ${productId} para orderId=${orderId} | disponible restante=${available - quantity}`,
    );

    await publish("shipments", orderId, {
      eventType: "StockReserved",
      orderId,
      customerId,
      customerEmail,
      customerName,
      productId,
      productName,
      quantity,
      totalPrice,
      paymentId,
      reservedAt: new Date().toISOString(),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`[inventory] Error al reservar stock para orderId=${orderId}:`, err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { reserveStock };
