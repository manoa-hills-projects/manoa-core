-- Migración: Tabla de módulos del sistema
--
-- Esta tabla es la fuente de verdad para todos los módulos disponibles.
-- El frontend obtiene los módulos desde GET /api/modules para renderizar
-- el sidebar, el editor de perfiles, etc.
--
-- Cada módulo tiene:
--   key         → Identificador único usado en permisos (profile_permissions.module)
--   name        → Nombre visible para el usuario
--   route       → Ruta del frontend (TanStack Router)
--   icon        → Nombre del icono (lucide-react o @tabler/icons-react)
--   group_key   → Agrupación lógica (census, requests, participation, etc.)
--   group_label → Etiqueta visible del grupo
--   sort_order  → Orden de aparición

CREATE TABLE IF NOT EXISTS `modules` (
    `id` integer PRIMARY KEY AUTOINCREMENT,
    `key` text NOT NULL UNIQUE,
    `name` text NOT NULL,
    `description` text,
    `route` text,
    `icon` text,
    `group_key` text NOT NULL DEFAULT 'other',
    `group_label` text NOT NULL DEFAULT 'Otros',
    `sort_order` integer NOT NULL DEFAULT 0,
    `is_active` integer DEFAULT true NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch())
);

-- Seed inicial: 20 módulos del sistema
INSERT INTO modules (key, name, description, route, icon, group_key, group_label, sort_order) VALUES
  -- Censo
  ('houses',     'Viviendas',     'Gestión del censo de viviendas',     '/houses',          'Home',            'census',        'Censo',            1),
  ('families',   'Familias',      'Gestión del censo de familias',      '/families',        'Users',           'census',        'Censo',            2),
  ('citizens',   'Ciudadanos',    'Gestión del censo de ciudadanos',    '/citizens',        'User',            'census',        'Censo',            3),

  -- Trámites
  ('requests',   'Solicitudes',   'Gestión de solicitudes y trámites',  '/requests',        'FileText',        'requests',      'Trámites',         4),
  ('documents',  'Documentos',    'Gestión de documentos',              '/documents',       'File',            'requests',      'Trámites',         5),
  ('signatories','Firmas',        'Gestión de firmantes',               '/signatories',     'PenTool',         'requests',      'Trámites',         6),
  ('validations','Validaciones',  'Validaciones comunitarias',          '/validations',     'ShieldCheck',     'requests',      'Trámites',         7),

  -- Participación
  ('polls',      'Votaciones',    'Gestión de votaciones y proyectos',  '/polls',           'Vote',            'participation', 'Participación',    8),
  ('events',     'Eventos',       'Gestión de eventos y asambleas',     '/meetings',        'Calendar',        'participation', 'Participación',    9),

  -- Finanzas
  ('treasury',   'Tesorería',     'Gestión financiera y transparencia', '/treasury',        'Wallet',          'finance',       'Finanzas',         10),
  ('payments',   'Pagos',         'Gestión de pagos y recibos',         '/treasury/payments','CreditCard',     'finance',       'Finanzas',         11),

  -- Mantenimiento
  ('tickets',    'Tickets',       'Gestión de tickets de mantenimiento','/tickets',         'Wrench',          'maintenance',   'Mantenimiento',    12),

  -- Inventario
  ('inventory',  'Inventario',    'Gestión de inventario',              '/inventory',       'Package',         'inventory',     'Inventario',       13),

  -- Sistema
  ('laws',       'Normativas',    'Gestión de leyes y normativas',      '/laws',            'Scale',           'system',        'Sistema',          14),
  ('ai',         'Asistente IA',  'Asistente virtual con IA',           '/ai-assistant',    'Sparkles',        'system',        'Sistema',          15),
  ('stats',      'Estadísticas',  'Estadísticas y reportes',            '/stats',           'BarChart3',       'system',        'Sistema',          16),
  ('reports',    'Reportes',      'Reportes exportables',               '/reports',         'FileSpreadsheet', 'system',        'Sistema',          17),
  ('users',      'Usuarios',      'Gestión de usuarios del sistema',    '/users',           'UserCog',         'system',        'Sistema',          18),
  ('profiles',   'Perfiles',      'Gestión de perfiles y permisos',     '/profiles',        'Shield',          'system',        'Sistema',          19),
  ('settings',   'Configuración', 'Configuración del sistema',          '/settings',        'Settings',        'system',        'Sistema',          20);
