/**
 * Tests para constantes del sistema RBAC
 *
 * Valida que las constantes de módulos, acciones y perfiles
 * estén correctamente definidas.
 */

import { describe, it, expect } from "vitest";
import {
  MODULES,
  MODULE_LIST,
  MODULE_LABELS,
} from "../src/shared/constants/modules";
import {
  ACTIONS,
  ACTION_LIST,
  ACTION_LABELS,
} from "../src/shared/constants/actions";
import {
  SYSTEM_PROFILES,
  SYSTEM_PROFILE_KEYS,
  isSystemProfile,
  isProfileDeletable,
  DEFAULT_PROFILE_KEY,
} from "../src/shared/constants/profiles";

describe("Constantes RBAC", () => {
  describe("Módulos", () => {
    it("debe tener todos los módulos esperados", () => {
      expect(MODULES.HOUSES).toBe("houses");
      expect(MODULES.FAMILIES).toBe("families");
      expect(MODULES.CITIZENS).toBe("citizens");
      expect(MODULES.REQUESTS).toBe("requests");
      expect(MODULES.POLLS).toBe("polls");
      expect(MODULES.TREASURY).toBe("treasury");
      expect(MODULES.TICKETS).toBe("tickets");
      expect(MODULES.INVENTORY).toBe("inventory");
      expect(MODULES.USERS).toBe("users");
      expect(MODULES.PROFILES).toBe("profiles");
    });

    it("debe tener etiquetas para todos los módulos", () => {
      for (const module of MODULE_LIST) {
        expect(MODULE_LABELS[module]).toBeDefined();
        expect(typeof MODULE_LABELS[module]).toBe("string");
        expect(MODULE_LABELS[module].length).toBeGreaterThan(0);
      }
    });

    it("no debe tener módulos duplicados", () => {
      const values = Object.values(MODULES);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe("Acciones", () => {
    it("debe tener todas las acciones CRUD básicas", () => {
      expect(ACTIONS.CREATE).toBe("create");
      expect(ACTIONS.READ).toBe("read");
      expect(ACTIONS.UPDATE).toBe("update");
      expect(ACTIONS.DELETE).toBe("delete");
    });

    it("debe tener acciones especiales", () => {
      expect(ACTIONS.EXPORT).toBe("export");
      expect(ACTIONS.IMPORT).toBe("import");
      expect(ACTIONS.APPROVE).toBe("approve");
      expect(ACTIONS.VOTE).toBe("vote");
      expect(ACTIONS.ASSIGN).toBe("assign");
    });

    it("debe tener etiquetas para todas las acciones", () => {
      for (const action of ACTION_LIST) {
        expect(ACTION_LABELS[action]).toBeDefined();
        expect(typeof ACTION_LABELS[action]).toBe("string");
      }
    });
  });

  describe("Perfiles del Sistema", () => {
    it("debe tener super_admin y citizen", () => {
      expect(SYSTEM_PROFILES.SUPER_ADMIN).toBe("super_admin");
      expect(SYSTEM_PROFILES.CITIZEN).toBe("citizen");
    });

    it("debe identificar correctamente perfiles del sistema", () => {
      expect(isSystemProfile("super_admin")).toBe(true);
      expect(isSystemProfile("citizen")).toBe(true);
      expect(isSystemProfile("custom_profile")).toBe(false);
    });

    it("debe identificar perfiles eliminables", () => {
      expect(isProfileDeletable("super_admin")).toBe(false);
      expect(isProfileDeletable("citizen")).toBe(false);
      expect(isProfileDeletable("treasurer")).toBe(true);
      expect(isProfileDeletable("custom")).toBe(true);
    });

    it("debe tener citizen como perfil por defecto", () => {
      expect(DEFAULT_PROFILE_KEY).toBe(SYSTEM_PROFILES.CITIZEN);
    });
  });
});
