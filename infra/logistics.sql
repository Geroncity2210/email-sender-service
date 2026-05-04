CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- DB Logística — PostgreSQL
-- Compartida por: Shipping e Inventory
--
-- NOTA: la base de datos 'logistics_db' normalmente la crea Docker
-- vía la variable POSTGRES_DB. Este script solo crea tablas y seeds.
-- ============================================================

-- Función reutilizable para actualizar updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Inventario ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  product_id    BIGINT       PRIMARY KEY,
  available_qty INT          NOT NULL,
  reserved_qty  INT          NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Reservas de stock ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_reservations (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID         NOT NULL UNIQUE,
  product_id   BIGINT       NOT NULL,
  quantity     INT          NOT NULL,
  status       VARCHAR(30)  NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER stock_reservations_updated_at
  BEFORE UPDATE ON stock_reservations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Envíos ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID         NOT NULL UNIQUE,
  customer_id      BIGINT       NOT NULL,
  address_json     JSONB        NULL,
  payment_status   VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  stock_status     VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  shipment_status  VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  tracking_number  VARCHAR(120) NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Outbox de eventos ─────────────────────────────────────────
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
  event_id      UUID         NOT NULL,
  processed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (consumer_name, event_id)
);

-- ── Seed data ─────────────────────────────────────────────────
INSERT INTO inventory (product_id, available_qty, reserved_qty) VALUES
  (101, 10, 0),
  (102, 50, 0),
  (103, 25, 0),
  (104, 18, 0)
ON CONFLICT (product_id) DO UPDATE
  SET available_qty = EXCLUDED.available_qty,
      reserved_qty  = EXCLUDED.reserved_qty;