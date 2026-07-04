# 🌱 Sistema de Seeds - Manoa Core

Sistema profesional de seeds usando **Drizzle Seed** para inicializar la base de datos.

## 📋 Características

- ✅ Seeds como código TypeScript (type-safe)
- ✅ Ejecución directa contra la BD (no HTTP)
- ✅ Modular y escalable
- ✅ Funciona local y remoto
- ✅ Más seguro (no expone endpoints públicos)

## 🚀 Uso Rápido

```bash
# Ejecutar todos los seeds
npm run db:seed

# Solo seed de RBAC (perfiles y permisos)
npm run db:seed:rbac

# Solo seed de Admin (super administrador)
npm run db:seed:admin

# Reset + seed (borra y recrea)
npm run db:seed:reset
```

## 📦 Seeds Disponibles

### 1. RBAC (`rbac`)
Crea los perfiles base del sistema:
- **super_admin**: Acceso total al sistema
- **citizen**: Perfil por defecto para ciudadanos

Incluye todos los permisos granulares por módulo y acción.

### 2. Admin (`admin`)
Crea un super administrador con:
- `role: 'superadmin'` (legacy)
- Perfil `super_admin` asignado (RBAC)

**Configuración por defecto:**
- Email: `admin@manoa.com`
- Password: `admin123`
- Nombre: `Administrador`

**Personalizar con variables de entorno:**
```bash
ADMIN_EMAIL=miadmin@ejemplo.com \
ADMIN_PASSWORD=miPassword123 \
ADMIN_NAME="Mi Admin" \
npm run db:seed:admin
```

## 🔧 Comandos Avanzados

```bash
# Ver ayuda
npm run db:seed -- --help

# Solo un seed específico
npm run db:seed -- --only rbac
npm run db:seed -- --only admin

# Reset antes de seed
npm run db:seed -- --reset

# Combinar opciones
npm run db:seed -- --reset --only admin
```

## 📁 Estructura

```
apps/api/src/shared/database/
├── seeds/
│   ├── index.ts          ← Orquestador principal
│   ├── rbac.seed.ts      ← Perfiles y permisos
│   └── admin.seed.ts     ← Super admin
├── schemas/              ← Schemas de Drizzle
└── migrations/           ← Migraciones SQL
```

## 🔄 Flujo de Trabajo

### Desarrollo Local

```bash
# 1. Ejecutar migraciones
npm run db:push:dev

# 2. Ejecutar seeds
npm run db:seed

# 3. Iniciar servidor
npm run dev
```

### Producción / Dev Remoto

```bash
# 1. Deployar API
npm run deploy:dev

# 2. Ejecutar migraciones en D1 remoto
npm run db:push:dev

# 3. Ejecutar seeds (apunta a BD local de wrangler)
npm run db:seed

# 4. Sincronizar BD local con D1 remoto
# (Usar wrangler d1 export/import si es necesario)
```

## 🎯 Agregar Nuevos Seeds

1. Crear archivo en `seeds/`:
```typescript
// seeds/my-seed.seed.ts
export async function seedMyData(db: Database) {
  console.log("🌱 Seed: My Data");
  // Tu lógica aquí
}
```

2. Agregar al orquestador en `index.ts`:
```typescript
import { seedMyData } from "./my-seed.seed";

// En AVAILABLE_SEEDS
const AVAILABLE_SEEDS = ["rbac", "admin", "mydata"] as const;

// En el switch
case "mydata":
  await seedMyData(db);
  break;
```

3. Agregar comando en `package.json`:
```json
"db:seed:mydata": "tsx ./src/shared/database/seeds/index.ts -- --only mydata"
```

## ⚠️ Consideraciones

- Los seeds son **idempotentes**: si los datos ya existen, no los duplican
- El flag `--reset` borra las tablas antes de seed
- Los seeds se ejecutan contra la BD local de wrangler (`.wrangler/state/v3/d1/...`)
- Para seeds en D1 remoto, usar `wrangler d1 execute` directamente

## 🐛 Troubleshooting

**Error: "No se pudo resolver la ruta de la base de datos"**
- Verifica que `drizzle.config.ts` tenga `dbCredentials.url` configurado
- Ejecuta `npm run dev` al menos una vez para crear la BD local

**Error: "Perfil 'super_admin' no encontrado"**
- Ejecuta primero el seed de RBAC: `npm run db:seed:rbac`

**Los seeds no funcionan en producción**
- Los seeds están diseñados para BD local
- Para D1 remoto, usa `wrangler d1 execute` con SQL directo
- O exporta/importa la BD local con `wrangler d1 export/import`

## 📚 Referencias

- [Drizzle Seed Docs](https://orm.drizzle.team/docs/seed-overview)
- [Drizzle Kit](https://orm.drizzle.team/docs/kit-overview)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
