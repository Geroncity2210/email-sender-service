const { randomUUID } = require("crypto");
const pool = require("./db");
const { publish } = require("./producer");

/**
 * Persiste la orden en DB (orders + order_items) y publica OrderCreated en el tópico orders.
 * @param {object} body - { customerId, productId, quantity }
 * @returns {object}    - { id, status }
 */
async function createOrder({ customerId, productId, quantity }) {
  // 1. Validar que el cliente existe
  const customerRes = await pool.query("SELECT id, full_name, email FROM customers WHERE id = $1", [
    customerId,
  ]);
  if (customerRes.rows.length === 0) {
    throw Object.assign(new Error("Cliente no encontrado"), { statusCode: 404 });
  }

  // 2. Validar que el producto existe
  const productRes = await pool.query("SELECT id, name, price FROM products WHERE id = $1", [
    productId,
  ]);
  if (productRes.rows.length === 0) {
    throw Object.assign(new Error("Producto no encontrado"), { statusCode: 404 });
  }

  const customer = customerRes.rows[0];
  const product = productRes.rows[0];
  const totalAmount = (parseFloat(product.price) * quantity).toFixed(2);
  const idempotencyKey = randomUUID();

  // 3. Persistir orden en transacción
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderRes = await client.query(
      `INSERT INTO orders (customer_id, status, total_amount, idempotency_key)
       VALUES ($1, 'CREATED', $2, $3)
       RETURNING *`,
      [customerId, totalAmount, idempotencyKey],
    );
    const order = orderRes.rows[0];

    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)`,
      [order.id, productId, quantity, product.price],
    );

    await client.query("COMMIT");

    console.log(
      `[ordering] Orden creada: ${order.id} | cliente: ${customer.email} | producto: ${product.name} | total: $${totalAmount}`,
    );

    // 4. Publicar evento OrderCreated
    const event = {
      eventType: "OrderCreated",
      orderId: order.id,
      customerId: customer.id,
      customerEmail: customer.email,
      customerName: customer.full_name,
      productId: product.id,
      productName: product.name,
      quantity,
      totalPrice: parseFloat(totalAmount),
      createdAt: order.created_at,
    };

    await publish("orders", order.id, event);

    return { id: order.id, status: order.status };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`[ordering] Error al persistir orden:`, err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createOrder };
