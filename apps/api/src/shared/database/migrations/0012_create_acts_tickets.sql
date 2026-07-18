-- Migración: Libro de Actas + Tickets de Soporte Comunitario

-- ═══════════════════════════════════════════════════════════════
-- ACTAS - Libro de Actas Digital (requisito legal)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `acts` (
    `id` text PRIMARY KEY NOT NULL,
    `book_type` text NOT NULL DEFAULT 'asamblea_ciudadanos',
    -- Tipos de libro:
    --   asamblea_ciudadanos → Asamblea de Ciudadanos
    --   coordinacion       → Colectivo de Coordinación Comunitaria
    --   ejecutiva          → Unidad Ejecutiva
    --   administrativa     → Unidad Administrativa Financiera Comunitaria
    --   contraloria        → Contraloría Social
    `folio_number` integer NOT NULL,
    `fecha` text NOT NULL,
    `hora` text,
    `lugar` text,
    `tipo` text NOT NULL DEFAULT 'ordinaria', -- ordinaria / extraordinaria
    `quorum` integer DEFAULT 0,
    `contenido` text NOT NULL, -- puntos tratados + desarrollo
    `voceros_presentes` text, -- JSON: [{nombre, cargo}]
    `acuerdos` text, -- JSON: [{numero, descripcion, votos_favor, votos_contra}]
    `pdf_url` text,
    `is_published` integer DEFAULT false NOT NULL,
    `created_by` text NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch())
);

-- Cada libro de actas tiene su propia secuencia de folios
CREATE UNIQUE INDEX IF NOT EXISTS `acts_book_folio_idx` ON `acts`(`book_type`, `folio_number`);

-- ═══════════════════════════════════════════════════════════════
-- TICKETS - Reportes de incidencias comunitarias
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `tickets` (
    `id` text PRIMARY KEY NOT NULL,
    `title` text NOT NULL,
    `description` text NOT NULL,
    `category` text NOT NULL DEFAULT 'otro',
    -- Categorías:
    --   electricidad, agua, gas, alumbrado, areas_verdes, seguridad, vialidad, otro
    `status` text NOT NULL DEFAULT 'recibido', -- recibido / en_proceso / resuelto
    `submitted_by` text NOT NULL,
    `assigned_to` text,
    `resolution_notes` text,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS `tickets_status_idx` ON `tickets`(`status`);
CREATE INDEX IF NOT EXISTS `tickets_submitted_idx` ON `tickets`(`submitted_by`);

-- Agregar módulos a la tabla modules
INSERT OR IGNORE INTO modules (key, name, description, route, icon, group_key, group_label, sort_order) VALUES
  ('acts', 'Libro de Actas', 'Gestión del libro de actas digital del consejo comunal', '/acts', 'FileText', 'system', 'Sistema', 21),
  ('tickets', 'Reportes', 'Reportes de incidencias comunitarias', '/tickets', 'AlertTriangle', 'system', 'Sistema', 22);
