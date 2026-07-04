-- Migración: Sistema de Tesorería (facturación + trazabilidad)
-- Crea las tablas para pagos de ciudadanos, egresos, conceptos y tasa Bs/USD.
-- Los montos se guardan en enteros (centavos) para evitar drift de floats.

-- ═══════════════════════════════════════════════════════════════
-- CATEGORÍAS (agrupador para reportes y transparencia)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `treasury_categories` (
    `id` text PRIMARY KEY NOT NULL,
    `key` text NOT NULL UNIQUE,
    `name` text NOT NULL,
    `description` text,
    `kind` text DEFAULT 'both' NOT NULL,
    `is_active` integer DEFAULT true NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch())
);

-- ═══════════════════════════════════════════════════════════════
-- CONCEPTOS (catálogo del tesorero)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `treasury_concepts` (
    `id` text PRIMARY KEY NOT NULL,
    `key` text NOT NULL UNIQUE,
    `name` text NOT NULL,
    `description` text,
    `category_id` text NOT NULL REFERENCES `treasury_categories`(`id`) ON DELETE RESTRICT,
    `default_bs_cents` integer,
    `default_usd_cents` integer,
    `valid_from` integer DEFAULT (unixepoch()) NOT NULL,
    `valid_until` integer,
    `is_active` integer DEFAULT true NOT NULL,
    `created_by` text NOT NULL REFERENCES `user`(`id`) ON DELETE RESTRICT,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch())
);

-- ═══════════════════════════════════════════════════════════════
-- TASA DE CAMBIO (una por día)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `treasury_rates` (
    `id` text PRIMARY KEY NOT NULL,
    `date` text NOT NULL UNIQUE,
    `bs_per_usd` text NOT NULL,
    `created_by` text NOT NULL REFERENCES `user`(`id`) ON DELETE RESTRICT,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch())
);

-- ═══════════════════════════════════════════════════════════════
-- PAGOS DE CIUDADANOS (workflow pending → approved/rejected)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `treasury_payments` (
    `id` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE RESTRICT,
    `concept_id` text REFERENCES `treasury_concepts`(`id`) ON DELETE SET NULL,
    `description` text,
    `amount_bs_cents` integer NOT NULL,
    `amount_usd_cents` integer NOT NULL,
    `rate_id` text NOT NULL REFERENCES `treasury_rates`(`id`) ON DELETE RESTRICT,
    `receipt_r2_key` text NOT NULL,
    `status` text DEFAULT 'pending' NOT NULL,
    `review_notes` text,
    `reviewed_by` text REFERENCES `user`(`id`) ON DELETE SET NULL,
    `reviewed_at` integer,
    `submitted_at` integer DEFAULT (unixepoch()) NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS `treasury_payments_user_idx` ON `treasury_payments`(`user_id`);
CREATE INDEX IF NOT EXISTS `treasury_payments_status_idx` ON `treasury_payments`(`status`);

-- ═══════════════════════════════════════════════════════════════
-- EGRESOS (registrados por tesorero, sin workflow)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `treasury_expenses` (
    `id` text PRIMARY KEY NOT NULL,
    `category_id` text NOT NULL REFERENCES `treasury_categories`(`id`) ON DELETE RESTRICT,
    `description` text NOT NULL,
    `beneficiary` text,
    `amount_bs_cents` integer NOT NULL,
    `amount_usd_cents` integer NOT NULL,
    `rate_id` text NOT NULL REFERENCES `treasury_rates`(`id`) ON DELETE RESTRICT,
    `receipt_r2_key` text,
    `spent_at` integer DEFAULT (unixepoch()) NOT NULL,
    `registered_by` text NOT NULL REFERENCES `user`(`id`) ON DELETE RESTRICT,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch())
);
