import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import {
	loginSchema,
	forgotPasswordSchema,
	type LoginFormValues,
	type ForgotPasswordFormValues,
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

	const onSubmit = useCallback(async (values: ForgotPasswordFormValues) => {
		setErrorMessage(null);
		setSuccessMessage(null);

		try {
			await authClient.$fetch("/request-password-reset", {
				method: "POST",
				body: {
					email: values.email,
					redirectTo: `${window.location.origin}/auth`,
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
	}, [form]);

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
