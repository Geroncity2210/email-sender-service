const { randomUUID } = require("crypto");
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

  const lockKey = parseInt(orderId.replace(/-/g, "").slice(0, 8), 16);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    // pg_advisory_xact_lock es válido en PostgreSQL — previene race conditions
    await client.query("SELECT pg_advisory_xact_lock($1)", [lockKey]);

    // ── Idempotencia: verificar en stock_reservations, no en shipments ──
    const existing = await client.query("SELECT id FROM stock_reservations WHERE order_id = $1", [
      orderId,
    ]);
    if (existing.rows.length > 0) {
      console.log(
        `[inventory] ⚠ Stock ya reservado para orderId=${orderId} (idempotencia). Ignorando.`,
      );
      await client.query("ROLLBACK");
      return;
    }

    // ── Verificar stock disponible con bloqueo de fila ────────
    const stockRes = await client.query(
      "SELECT available_qty, reserved_qty FROM inventory WHERE product_id = $1 FOR UPDATE",
      [productId],
    );

    if (stockRes.rows.length === 0) {
      await client.query("ROLLBACK");
      throw new Error(`Producto ${productId} no encontrado en inventario`);
    }

    const { available_qty, reserved_qty } = stockRes.rows[0];
    const available = available_qty - reserved_qty;

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

    // ── Reservar stock ─────────────────────────────────────────
    await client.query(
      "UPDATE inventory SET reserved_qty = reserved_qty + $1, updated_at = NOW() WHERE product_id = $2",
      [quantity, productId],
    );

    // ── Registrar reserva para idempotencia ───────────────────
    await client.query(
      `INSERT INTO stock_reservations (id, order_id, product_id, quantity, status)
       VALUES ($1, $2, $3, $4, 'RESERVED')`,
      [randomUUID(), orderId, productId, quantity],
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
