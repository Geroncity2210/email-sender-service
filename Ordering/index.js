const express = require("express");
const config = require("./config");
const { connectProducer } = require("./kafkaClient");
const { createOrder } = require("./createOrder");

const app = express();
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", service: "ordering" }));

// ── POST /orders ──────────────────────────────────────────────
app.post("/orders", async (req, res) => {
  const { customerId, productId, quantity } = req.body;

  if (!customerId || !productId || !quantity) {
    return res.status(400).json({ error: "customerId, productId y quantity son requeridos" });
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: "quantity debe ser un entero positivo" });
  }

  try {
    const order = await createOrder({ customerId, productId, quantity });
    return res.status(201).json({
      message: "Orden creada exitosamente",
      orderId: order.id,
      status: order.status,
    });
  } catch (err) {
    console.error("[ordering] Error al crear orden:", err.message);
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
});

// ── Bootstrap ────────────────────────────────────────────────
async function bootstrap() {
  try {
    await connectProducer();
    app.listen(config.service.port, () => {
      console.log(`[ordering] HTTP escuchando en puerto ${config.service.port}`);
      console.log("[ordering] Listo para recibir órdenes");
      console.log(
        "[ordering] Productos disponibles: 101, 102, 103, 104, 105",
      );
    });
  } catch (err) {
    console.error("[ordering] Error fatal al iniciar:", err.message);
    process.exit(1);
  }
}

bootstrap();
