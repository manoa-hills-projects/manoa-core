import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email({ message: "Correo inválido" }),
	password: z.string().min(1, { message: "Requerido" }),
});

export const forgotPasswordSchema = z.object({
	email: z.string().email({ message: "Correo inválido" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
