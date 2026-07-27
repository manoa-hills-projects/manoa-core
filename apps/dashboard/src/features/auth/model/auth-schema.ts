import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email({ message: "Correo inválido" }),
	password: z.string().min(1, { message: "Requerido" }),
});

export const forgotPasswordSchema = z.object({
	email: z.string().email({ message: "Correo inválido" }),
});

export const signUpSchema = z.object({
	dni: z.string().min(5, "DNI requerido"),
	email: z.string().email("Correo inválido"),
	name: z.string().min(2, "Nombre requerido"),
	password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
