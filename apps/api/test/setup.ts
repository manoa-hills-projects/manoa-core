/**
 * Setup global para tests
 *
 * Configura el entorno de testing con D1 en memoria usando Miniflare
 */

import { beforeAll, afterAll } from "vitest";
import { Miniflare } from "miniflare";

// Variable global para Miniflare
declare global {
  var mf: Miniflare;
}

beforeAll(async () => {
  // Crear instancia de Miniflare con D1
  globalThis.mf = new Miniflare({
    modules: true,
    script: `export default { fetch() { return new Response("ok"); } }`,
    d1Databases: ["DB"],
  });
});

afterAll(async () => {
  if (globalThis.mf) {
    await globalThis.mf.dispose();
  }
});
