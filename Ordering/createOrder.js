const pool = require("./db");
const { publish } = require("./producer");

/**
 * Persiste la orden en DB y publica OrderCreated en el tópico orders.
 * @param {object} body - { customerId, productId, quantity }
 * @returns {object}    - la orden creada
 */
async function createOrder({ customerId, productId, quantity }) {
  // 1. Validar que el cliente existe
  const customerRes = await pool.query("SELECT id, name, email FROM customers WHERE id = $1", [
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

  const product = productRes.rows[0];
  const customer = customerRes.rows[0];
  const totalPrice = (parseFloat(product.price) * quantity).toFixed(2);

  // 3. Persistir orden
  const orderRes = await pool.query(
    `INSERT INTO orders (customer_id, product_id, quantity, total_price, status)
     VALUES ($1, $2, $3, $4, 'PENDING')
     RETURNING *`,
    [customerId, productId, quantity, totalPrice],
  );
  const order = orderRes.rows[0];

  console.log(
    `[ordering] Orden creada: ${order.id} | cliente: ${customer.email} | producto: ${productId} | total: $${totalPrice}`,
  );

  // 4. Publicar evento OrderCreated
  const event = {
    eventType: "OrderCreated",
    orderId: order.id,
    customerId: customer.id,
    customerEmail: customer.email,
    customerName: customer.name,
    productId: order.product_id,
    productName: product.name,
    quantity: order.quantity,
    totalPrice: parseFloat(totalPrice),
    createdAt: order.created_at,
  };

  await publish("orders", order.id, event);

  return order;
}

module.exports = { createOrder };
