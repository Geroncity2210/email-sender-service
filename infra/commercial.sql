CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- DB Comercial — PostgreSQL
-- Compartida por: Ordering y Billing
--
-- NOTA: la base de datos 'commercial_db' la crea Docker via
-- la variable POSTGRES_DB. Este script solo crea tablas y seeds.
-- ============================================================

-- ── Función reutilizable para actualizar updated_at ──────────
-- Reemplaza el ON UPDATE CURRENT_TIMESTAMP de MySQL
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Clientes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id         BIGINT      PRIMARY KEY,
  full_name  VARCHAR(120) NOT NULL,
  email      VARCHAR(180) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Productos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id         BIGINT       PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  price      DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Órdenes ──────────────────────────────────────────────────
-- id: PG genera UUID automáticamente con gen_random_uuid()
-- No existe ON UPDATE CURRENT_TIMESTAMP en PG → trigger
CREATE TABLE IF NOT EXISTS orders (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      BIGINT       NOT NULL,
  status           VARCHAR(30)  NOT NULL DEFAULT 'CREATED',
  total_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
  idempotency_key  VARCHAR(80)  NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE OR REPLACE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Items de orden ────────────────────────────────────────────
-- BIGSERIAL reemplaza BIGINT AUTO_INCREMENT de MySQL
CREATE TABLE IF NOT EXISTS order_items (
  id         BIGSERIAL    PRIMARY KEY,
  order_id   UUID         NOT NULL,
  product_id BIGINT       NOT NULL,
  quantity   INT          NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_items_order   FOREIGN KEY (order_id)   REFERENCES orders(id),
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ── Pagos ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID         NOT NULL UNIQUE,
  status       VARCHAR(30)  NOT NULL,
  amount       DECIMAL(12,2) NOT NULL,
  provider_ref VARCHAR(120) NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE OR REPLACE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Outbox de eventos ─────────────────────────────────────────
-- JSONB reemplaza JSON de MySQL (más eficiente en PG)
-- BOOLEAN reemplaza TINYINT(1) de MySQL
CREATE TABLE IF NOT EXISTS outbox_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id   UUID        NOT NULL,
  event_type     VARCHAR(80) NOT NULL,
  topic_name     VARCHAR(80) NOT NULL,
  payload        JSONB       NOT NULL,
  published      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at   TIMESTAMPTZ NULL
);

-- ── Eventos procesados (idempotencia de consumers) ────────────
CREATE TABLE IF NOT EXISTS processed_events (
  consumer_name VARCHAR(80)  NOT NULL,
  event_id      VARCHAR(80)  NOT NULL,
  processed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (consumer_name, event_id)
);

-- ── Seed data ─────────────────────────────────────────────────
-- ON CONFLICT reemplaza ON DUPLICATE KEY UPDATE de MySQL
INSERT INTO customers (id, full_name, email) VALUES
  (1, 'Daniel Safo',     'danielsafo@unisabana.edu.co'),
  (2, 'Daniel Saavedra', 'daniel.saavedra.fon@gmail.com')
ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email     = EXCLUDED.email;

-- IDs de producto para usar en Postman: 101, 102, 103, 104
INSERT INTO products (id, name, price) VALUES
  (101, 'Laptop Lenovo ThinkPad',       4500000.00),
  (102, 'Mouse Inalámbrico Logitech',     85000.00),
  (103, 'Teclado Mecánico Redragon',     220000.00),
  (104, 'Audífonos Bluetooth JBL',       320000.00)
ON CONFLICT (id) DO UPDATE
  SET name  = EXCLUDED.name,
      price = EXCLUDED.price;