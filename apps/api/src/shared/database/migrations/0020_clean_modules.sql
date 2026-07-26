-- Migración: Reset de la tabla modules
-- Elimina duplicados y reordena módulos según el orden del sidebar
-- Basado en apps/dashboard/src/entities/navigation/config/menu.ts

-- 1. Eliminar registros duplicados (misma key, id más alto)
DELETE FROM modules WHERE id NOT IN (
  SELECT MIN(id) FROM modules GROUP BY key
);

-- 2. Respetar FKs: temporalmente desactivar chequeos (solo D1 lo permite en este contexto)
-- En D1 no hay PRAGMA foreign_keys, así que procedemos directamente

-- 3. Resetear todos los módulos a su estado canónico
DELETE FROM modules;

-- 4. Insertar módulos canónicos
INSERT INTO modules (key, name, description, route, icon, group_key, group_label, sort_order) VALUES
  -- ═══ CENSO ═══
  ('houses',     'Viviendas',   'Gestión del censo de viviendas',   '/houses',    'Home',      'census',        'Censo',             1),
  ('families',   'Familias',    'Gestión del censo de familias',    '/families',  'Users',     'census',        'Censo',             2),
  ('citizens',   'Ciudadanos',  'Gestión del censo de ciudadanos',  '/citizens',  'User',      'census',        'Censo',             3),

  -- ═══ PARTICIPACIÓN ═══
  ('polls',      'Proyectos',   'Gestión de votaciones y proyectos','/polls',     'Vote',      'participation', 'Participación',     4),
  ('events',     'Asambleas',   'Gestión de asambleas',             '/meetings',  'Calendar',  'participation', 'Participación',     5),

  -- ═══ TRÁMITES ═══
  ('requests',   'Solicitudes', 'Gestión de solicitudes y trámites','/requests',  'FileText',  'requests',      'Trámites',          6),
  ('validations','Validaciones','Validaciones comunitarias',        '/validations','ShieldCheck','requests',     'Trámites',          7),

  -- ═══ TESORERÍA ═══
  ('treasury',   'Tesorería',   'Gestión financiera y transparencia','/treasury', 'Wallet',    'finance',       'Tesorería',         8),

  -- ═══ SISTEMA ═══
  ('laws',       'Normativas',  'Gestión de leyes y normativas',     '/laws',     'Scale',     'system',        'Sistema',           9),
  ('ai',         'Asistente IA','Asistente virtual con IA',          '/ai-assistant','Sparkles','system',       'Sistema',          10),
  ('tickets',    'Reportes',    'Reportes de incidencias',           '/tickets',  'AlertTriangle','system',     'Sistema',          11),
  ('acts',       'Libro de Actas','Libro de actas digital',         '/acts',     'FileText',  'system',        'Sistema',          12),
  ('users',      'Usuarios',    'Gestión de usuarios del sistema',   '/users',    'UserCog',   'system',        'Sistema',          13),
  ('profiles',   'Perfiles',    'Gestión de perfiles y permisos',    '/profiles', 'Shield',    'system',        'Sistema',          14),
  ('settings',   'Configuración','Configuración del sistema',       '/settings', 'Settings',  'system',        'Sistema',          15);
