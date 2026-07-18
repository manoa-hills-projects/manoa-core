-- Migración: Limpiar tabla modules - solo módulos que realmente existen
-- Elimina módulos fantasma que no tienen página real en el frontend

DELETE FROM modules WHERE key IN (
  'documents',
  'signatories',
  'payments',
  'tickets',
  'inventory',
  'stats',
  'reports'
);
