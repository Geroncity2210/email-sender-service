CREATE DATABASE IF NOT EXISTS commercial_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE commercial_db;

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  idempotency_key VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  provider_ref VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id CHAR(36) PRIMARY KEY,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id CHAR(36) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  topic_name VARCHAR(80) NOT NULL,
  payload JSON NOT NULL,
  published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS processed_events (
  consumer_name VARCHAR(80) NOT NULL,
  event_id CHAR(36) NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (consumer_name, event_id)
);

INSERT INTO customers (id, full_name, email) VALUES
(1, 'Daniel Safo', 'danielsafo@unisabana.edu.co'),
(2, 'Daniel Saavedra', 'daniel.saavedra.fon@gmail.com')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email);

INSERT INTO products (id, name, price) VALUES
(101, 'Laptop Lenovo ThinkPad', 4500000.00),
(102, 'Mouse Inalámbrico Logitech', 85000.00),
(103, 'Teclado Mecánico Redragon', 220000.00),
(104, 'Audífonos Bluetooth JBL', 320000.00)
ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price);