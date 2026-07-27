import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { env } from "@/env";
import {
	type ForgotPasswordFormValues,
	forgotPasswordSchema,
	type LoginFormValues,
	loginSchema,
	type ResetPasswordFormValues,
	resetPasswordSchema,
	type SignUpFormValues,
	signUpSchema,
} from "./auth-schema";

interface UseLoginFormProps {
	onSuccess?: () => void;
}

export function useLoginForm({ onSuccess }: UseLoginFormProps = {}) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
		mode: "onChange",
		reValidateMode: "onChange",
	});

	const onSubmit = useCallback(
		async (values: LoginFormValues) => {
			setErrorMessage(null);

			try {
				await authClient.$fetch("/sign-in/email", {
					method: "POST",
					body: {
						email: values.email,
						password: values.password,
					},
				});

				onSuccess?.();
			} catch (error) {
				setErrorMessage(
					error instanceof Error ? error.message : "No se pudo iniciar sesión",
				);
			}
		},
		[onSuccess],
	);

	return {
		form,
		onSubmit: form.handleSubmit(onSubmit),
		isSubmitting: form.formState.isSubmitting,
		errorMessage,
		setErrorMessage,
	};
}

export function useForgotPasswordForm() {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const form = useForm<ForgotPasswordFormValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			email: "",
		},
		mode: "onChange",
		reValidateMode: "onChange",
	});

	const onSubmit = useCallback(
		async (values: ForgotPasswordFormValues) => {
			setErrorMessage(null);
			setSuccessMessage(null);

			try {
				await authClient.$fetch("/request-password-reset", {
					method: "POST",
					body: {
						email: values.email,
						redirectTo: `${window.location.origin}/auth?reset-password`,
					},
				});

				setSuccessMessage(
					"Si el correo existe, enviamos un enlace para restablecer la contraseña.",
				);
				form.reset();
			} catch (error) {
				setErrorMessage(
					error instanceof Error
						? error.message
						: "No se pudo procesar la solicitud",
				);
			}
		},
		[form],
	);

	return {
		form,
		onSubmit: form.handleSubmit(onSubmit),
		isSubmitting: form.formState.isSubmitting,
		errorMessage,
		setErrorMessage,
		successMessage,
		setSuccessMessage,
	};
}

interface UseResetPasswordFormProps {
	token: string;
	onSuccess?: () => void;
}

export function useResetPasswordForm({ token, onSuccess }: UseResetPasswordFormProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const form = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
		mode: "onChange",
		reValidateMode: "onChange",
	});

	const onSubmit = useCallback(
		async (values: ResetPasswordFormValues) => {
			setErrorMessage(null);
			setSuccessMessage(null);

			try {
				await authClient.$fetch("/reset-password", {
					method: "POST",
					body: {
						newPassword: values.password,
						token,
					},
				});

				setSuccessMessage("Contraseña restablecida correctamente");
				form.reset();
				onSuccess?.();
			} catch (error) {
				setErrorMessage(
					error instanceof Error
						? error.message
						: "No se pudo restablecer la contraseña",
				);
			}
		},
		[form, token, onSuccess],
	);

	return {
		form,
		onSubmit: form.handleSubmit(onSubmit),
		isSubmitting: form.formState.isSubmitting,
		errorMessage,
		successMessage,
	};
}

interface UseSignUpFormProps {
	onSuccess?: () => void;
}

export function useSignUpForm({ onSuccess }: UseSignUpFormProps = {}) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const form = useForm<SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			dni: "",
			email: "",
			name: "",
			password: "",
		},
		mode: "onChange",
		reValidateMode: "onChange",
	});

	const onSubmit = useCallback(
		async (values: SignUpFormValues) => {
			setErrorMessage(null);
			setSuccessMessage(null);

			try {
				const { error: signUpError } = await authClient.signUp.email({
					email: values.email,
					password: values.password,
					name: values.name,
				});

				if (signUpError) {
					setErrorMessage(
						signUpError.message || "No se pudo crear la cuenta",
					);
					return;
				}

				// Vincula el ciudadano por DNI al usuario recién creado
				const apiBase = env.VITE_API_URL || "http://localhost:8787/api";
				const linkRes = await fetch(`${apiBase}/auth/link-citizen`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ dni: values.dni }),
				});

				const linkData = await linkRes.json();

				if (!linkRes.ok) {
					// Mapeo de errores conocidos
					const knownErrors: Record<string, string> = {
						"No se encontró un ciudadano con ese DNI":
							"DNI no encontrado en el censo",
						"Este ciudadano ya tiene un usuario vinculado":
							"Ciudadano ya vinculado a otra cuenta",
						"No autorizado": "Sesión no válida. Intenta de nuevo",
					};

					setErrorMessage(
						knownErrors[linkData.error] ||
							linkData.error ||
							"Error al vincular el ciudadano",
					);
					return;
				}

				setSuccessMessage("Cuenta creada correctamente");
				form.reset();
				onSuccess?.();
			} catch (error) {
				setErrorMessage(
					error instanceof Error
						? error.message
						: "No se pudo completar el registro",
				);
			}
		},
		[form, onSuccess],
	);

	return {
		form,
		onSubmit: form.handleSubmit(onSubmit),
		isSubmitting: form.formState.isSubmitting,
		errorMessage,
		setErrorMessage,
		successMessage,
		setSuccessMessage,
	};
}
