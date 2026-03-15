import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { queryCedula } from "./validations.handler";

const cedulaQuerySchema = z.object({
  nac: z.enum(["V", "E"], {
    errorMap: () => ({ message: "La nacionalidad debe ser V o E" }),
  }),
  cedula: z
    .string()
    .min(5, "La cédula debe tener al menos 5 dígitos")
    .max(9, "La cédula no puede tener más de 9 dígitos")
    .regex(/^\d+$/, "La cédula solo debe contener números"),
});

const validationsRouter = new Hono<HonoConfig>()

  .get("/cedula", zValidator("query", cedulaQuerySchema), async (c) => {
    const { nac, cedula } = c.req.valid("query");

    const result = await queryCedula(nac, cedula);

    if (result.status !== 200) {
      return c.json({ status: result.status, message: result.message }, result.status as 301 | 302 | 303 | 404 | 500 | 503 | 504);
    }

    return c.json(result, 200);
  });

export default validationsRouter;
