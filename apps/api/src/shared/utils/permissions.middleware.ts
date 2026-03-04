import { createMiddleware } from "hono/factory";
import type { AppContext } from "./app-context";
import { statement, user, admin, superadmin } from "./permissions";

type Resource = keyof typeof statement;
type Action<T extends Resource> = (typeof statement)[T][number];

export const requirePermission = <T extends Resource>(
  resource: T,
  action: Action<T>
) => {
  return createMiddleware<AppContext>(async (c, next) => {
    const session = c.get("session");

    if (!session || !session.user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const userRole = (session.user as any).role || "user";

    let roleObj = user;
    if (userRole === "admin") roleObj = admin;
    else if (userRole === "superadmin") roleObj = superadmin;

    // Revisa si el rol del usuario tiene permisos para la acción sobre el recurso
    const auth = roleObj.authorize({
      [resource]: [action],
    } as any);

    if (!auth.success) {
      return c.json(
        {
          error: "Acceso denegado: No tienes permisos para realizar esta acción",
        },
        403
      );
    }

    await next();
  });
};