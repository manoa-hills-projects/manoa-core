/**
 * Tests para tipos y funciones auxiliares RBAC
 *
 * Valida las funciones helper para manejo de permisos.
 */

import { describe, it, expect } from "vitest";
import {
  createPermissionKey,
  parsePermissionKey,
  toPermissionMap,
} from "../src/shared/types/rbac";
import type { ProfilePermission } from "../src/shared/database/schemas/rbac.schema";

describe("Tipos y Helpers RBAC", () => {
  describe("createPermissionKey", () => {
    it("debe crear clave de permiso correctamente", () => {
      const key = createPermissionKey("citizens", "read");
      expect(key).toBe("citizens:read");
    });

    it("debe manejar diferentes módulos y acciones", () => {
      expect(createPermissionKey("houses", "create")).toBe("houses:create");
      expect(createPermissionKey("polls", "vote")).toBe("polls:vote");
      expect(createPermissionKey("treasury", "export")).toBe("treasury:export");
    });
  });

  describe("parsePermissionKey", () => {
    it("debe parsear clave de permiso correctamente", () => {
      const result = parsePermissionKey("citizens:read");
      expect(result).toEqual({
        module: "citizens",
        action: "read",
      });
    });

    it("debe retornar null para clave inválida", () => {
      expect(parsePermissionKey("invalid")).toBeNull();
      expect(parsePermissionKey("a:b:c")).toBeNull();
      expect(parsePermissionKey("")).toBeNull();
    });
  });

  describe("toPermissionMap", () => {
    it("debe convertir permisos a mapa", () => {
      const permissions = [
        {
          id: "1",
          profileId: "p1",
          module: "citizens",
          action: "read",
          allowed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          profileId: "p1",
          module: "citizens",
          action: "create",
          allowed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as ProfilePermission[];

      const map = toPermissionMap(permissions);

      expect(map.get("citizens:read")).toBe(true);
      expect(map.get("citizens:create")).toBe(false);
      expect(map.has("houses:read")).toBe(false);
    });

    it("debe manejar lista vacía", () => {
      const map = toPermissionMap([]);
      expect(map.size).toBe(0);
    });
  });
});
