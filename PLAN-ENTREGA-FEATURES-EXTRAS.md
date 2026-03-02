# Plan de entrega — Features extras (Miércoles/Jueves)

Este plan está pensado para **cerrar extras reales** sobre el estado actual del proyecto (`api` + `dashboard`) usando **Cloudflare capa gratuita**.

## 0) Aclaratoria de alcance (si te lo piden “sí o sí”)

Si en la evaluación te exigen explícitamente:
- IA,
- carta de resiliencia,
- carga masiva de usuarios por CSV,
- exportación para reportes,

entonces esas 4 pasan a **obligatorias** y deben quedar en la demo.

## 1) Módulos extras a implementar

## Módulo A — Autenticación y protección de rutas (obligatorio)

### Objetivo
Tener login/logout/session funcional y proteger todo `/_authenticated`.

### Backend (`apps/api`)
- Integrar `better-auth` de forma real en [apps/api/src/index.ts](apps/api/src/index.ts).
- Exponer endpoints de auth (ruta base `/api/auth/*` o equivalente según Better Auth).
- Conectar `better-auth` a D1 con el adapter Drizzle (ya tienes base en [apps/api/src/shared/utils/auth.util.ts](apps/api/src/shared/utils/auth.util.ts)).

### Frontend (`apps/dashboard`)
- Reemplazar placeholder de [apps/dashboard/src/routes/auth/index.tsx](apps/dashboard/src/routes/auth/index.tsx) por formulario real.
- Consumir `authClient` en [apps/dashboard/src/lib/auth-client.ts](apps/dashboard/src/lib/auth-client.ts).
- Agregar guard en [apps/dashboard/src/routes/_authenticated/route.tsx](apps/dashboard/src/routes/_authenticated/route.tsx) para redirigir si no hay sesión.

### Criterio de terminado
- Usuario puede iniciar sesión y cerrar sesión.
- Si no está autenticado, no puede entrar a `/_authenticated/*`.

---

## Módulo B — CRUD completo con `delete` + errores consistentes

### Objetivo
Completar operaciones faltantes en `houses`, `families`, `citizens`.

### Backend
- Agregar `DELETE /houses/:id`, `DELETE /families/:id`, `DELETE /citizens/:id`.
- Validar casos de “no encontrado” y devolver respuesta uniforme.
- Mantener patrón de utilidades en [apps/api/src/shared/utils/api-reponse.ts](apps/api/src/shared/utils/api-reponse.ts).

### Frontend
- Botón eliminar en tablas:
  - [apps/dashboard/src/widgets/house-table](apps/dashboard/src/widgets/house-table)
  - [apps/dashboard/src/widgets/family-table](apps/dashboard/src/widgets/family-table)
  - [apps/dashboard/src/widgets/citizen-table](apps/dashboard/src/widgets/citizen-table)
- Confirmación antes de borrar.
- Invalidación de query con React Query tras eliminación.

### Criterio de terminado
- Se puede crear, listar, editar y eliminar en las 3 entidades.

---

## Módulo C — Dashboard de métricas rápidas (feature extra visible)

### Objetivo
Mostrar KPIs útiles para la comunidad al entrar al sistema.

### Backend
- Crear endpoint `GET /api/stats/overview` con:
  - total de viviendas
  - total de familias
  - total de ciudadanos
  - ciudadanos por sexo
  - promedio de integrantes por familia (si aplica)

### Frontend
- Nueva vista “Resumen” (puede ser ruta index autenticada).
- Cards + gráfico simple (ya tienes componentes de chart en `shared/ui`).

### Criterio de terminado
- Al abrir el sistema se ven métricas en tiempo real, no datos hardcodeados.

---

## Módulo D — Exportación CSV de listados (extra práctico)

### Objetivo
Poder descargar datos para informes comunitarios.

### Backend (opción recomendada)
- Endpoint por entidad para exportar CSV (ej: `/api/citizens/export.csv`).
# Plan obligatorio y priorizado (alineado al PDF)

## 1) Qué va obligatorio según el PDF

## Obligatorio explícito (sí aparece en el PDF)
- Interfaz accesible.
- Automatización de trámites.
- Generador de documentos legales con IA.
- Módulo colaborativo (mensajería/canales, videollamadas, asambleas y votaciones).
- Actualización normativa.
- Soporte/capacitación (incluye chatbot).
- Integración con plataformas externas por API.

## Obligatorio para tu demo técnica (aunque no esté textual)
- Carga masiva por CSV (acelera censo).
- Exportación de reportes (evidencia y seguimiento).

## No obligatorio explícito
- “Carta de resiliencia” no está escrita literal, pero encaja perfecto como tipo de documento dentro del generador IA.

---

## 2) Estado actual del proyecto (lo que ya tienes)

- API base Hono + Drizzle + D1 con módulos de casas/familias/ciudadanos en [apps/api/src/index.ts](apps/api/src/index.ts).
- CRUD parcial (create/list/update) en routers de:
  - [apps/api/src/modules/house/house.router.ts](apps/api/src/modules/house/house.router.ts)
  - [apps/api/src/modules/family/family.router.ts](apps/api/src/modules/family/family.router.ts)
  - [apps/api/src/modules/citizen/citizen.router.ts](apps/api/src/modules/citizen/citizen.router.ts)
- Dashboard con tablas y búsqueda ya funcional en rutas autenticadas:
  - [apps/dashboard/src/routes/_authenticated/houses.tsx](apps/dashboard/src/routes/_authenticated/houses.tsx)
  - [apps/dashboard/src/routes/_authenticated/families.tsx](apps/dashboard/src/routes/_authenticated/families.tsx)
  - [apps/dashboard/src/routes/_authenticated/citizens.tsx](apps/dashboard/src/routes/_authenticated/citizens.tsx)
- Auth aún incompleta (placeholder y sin guard robusto):
  - [apps/dashboard/src/routes/auth/index.tsx](apps/dashboard/src/routes/auth/index.tsx)
  - [apps/dashboard/src/routes/_authenticated/route.tsx](apps/dashboard/src/routes/_authenticated/route.tsx)

---

## 3) Orden de prioridad recomendado (para entregar)

1. Auth + control de acceso.
2. Carga CSV + exportación reportes.
3. IA para preguntas del sistema (consultas sobre datos).
4. Generación de documentos IA (incluye carta de resiliencia como plantilla).
5. Votaciones comunitarias.
6. Mensajería/salas.
7. Videollamadas.

---

## 4) Integración en Cloudflare (free-first)

## Núcleo
- Workers: API principal.
- D1: datos transaccionales (usuarios, familias, pagos, votos, mensajes).
- Pages: dashboard.

## IA (preguntas y documentos)
- Workers AI: inferencia de LLM desde el Worker.
- AI Gateway: control de consumo/logs y fallback de modelos.
- Flujo recomendado:
  1) endpoint `/api/ai/query` recibe pregunta,
  2) normaliza filtros y consulta D1,
  3) entrega contexto al modelo,
  4) retorna respuesta con trazabilidad.

## Documentos (carta de resiliencia)
- Endpoint `/api/documents/generate`.
- Plantillas por tipo (`resiliencia`, `constancia`, etc.).
- Guardado en D1 + opcional en R2 (`.txt/.html/.pdf`).

## Colaboración
- Mensajería/salas: Durable Objects + WebSockets.
- Videollamadas: Cloudflare Calls (si no llegas, deja MVP con link de sala + chat y “próxima fase calls”).
- Votaciones: D1 + reglas de elegibilidad + cierre por fecha + auditoría básica.

## Seguridad
- Turnstile en formularios sensibles.
- WAF/rate limit básico en endpoints de IA.

---

## 5) Mapa de módulos a atacar (paso a paso)

## Módulo 1 — Auth (bloqueante)
- Backend: integrar Better Auth real en [apps/api/src/index.ts](apps/api/src/index.ts).
- Frontend: login real y guard de sesión.
- Resultado: acceso protegido.

## Módulo 2 — CSV import/export (entregable visible rápido)
- Import: `POST /api/import/citizens-csv`.
- Export: `GET /api/reports/citizens.csv` y `families.csv`.
- Resultado: carga y descarga operativa para demo.

## Módulo 3 — IA de consultas (tu caso principal)
- Endpoint: `POST /api/ai/query`.
- Casos ejemplo:
  - “¿Cuántas personas no han pagado?”
  - “Muéstrame familias sin jefe asignado”.
- Resultado: respuestas en lenguaje natural basadas en D1.

## Módulo 4 — IA de documentos
- Endpoint: `POST /api/documents/generate`.
- Plantilla “carta de resiliencia” como uno de los tipos.
- Resultado: documento generado + exportable.

## Módulo 5 — Votaciones
- Crear proyecto, opciones, periodo, voto único por usuario.
- Resultado: asamblea digital demostrable.

## Módulo 6 — Mensajería y salas
- Canal general + canal por proyecto.
- Resultado: comunicación interna funcional.

## Módulo 7 — Videollamadas
- MVP: creación de sala, invitados y registro de sesión.
- Resultado: evidencia de módulo colaborativo.

---

## 6) Sprint corto (Miércoles/Jueves)

## Miércoles
- [ ] Módulo 1 listo.
- [ ] Módulo 2 listo.
- [ ] Backend Módulo 3 listo (endpoint IA consultas).

## Jueves
- [ ] Frontend Módulo 3 listo (chat de preguntas).
- [ ] Módulo 4 MVP (carta de resiliencia).
- [ ] Módulo 5 MVP (votaciones).
- [ ] Módulo 6 MVP (mensajería básica).
- [ ] Deploy final en Workers + Pages.

---

## 7) Criterio final de aprobación de demo

- El usuario inicia sesión.
- Carga CSV y ve datos en tablas.
- Exporta reportes CSV.
- Pregunta a la IA sobre el estado del sistema y obtiene respuesta útil.
- Genera documento (incluyendo carta de resiliencia).
- Realiza una votación comunitaria.
- Demuestra canal de comunicación y propuesta de videollamada.

