import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ForgotPasswordForm } from "@/features/auth/ui/forgot-password-form";
import { LoginForm } from "@/features/auth/ui/login-form";
import { ResetPasswordForm } from "@/features/auth/ui/reset-password-form";
import { SignUpForm } from "@/features/auth/ui/signup-form";
import { authClient } from "@/lib/auth-client";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";

const authSearchSchema = z.object({
	token: z.string().optional(),
	mode: z.string().optional(),
});

export const Route = createFileRoute("/auth/")({
	validateSearch: authSearchSchema,
	component: RouteComponent,
});

type Mode = "login" | "forgot" | "signup" | "reset-password";

function RouteComponent() {
	const navigate = useNavigate({ from: "/auth/" });
	const { token, mode: modeParam } = Route.useSearch();
	const [localMode, setLocalMode] = useState<Mode | null>(null);

	// Derive mode: token present → reset-password, otherwise from search param or local state
	const mode: Mode = token
		? "reset-password"
		: modeParam === "reset-password"
			? "reset-password"
			: localMode ?? "login";

	const setMode = (newMode: Mode) => {
		setLocalMode(newMode);
		// Reset search params to avoid stale token
		navigate({ to: "/auth/", search: {} });
	};

	const { data, isPending, refetch } = authClient.useSession();

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
				Cargando...
			</div>
		);
	}

	if (data?.session) {
		return <Navigate to="/" replace />;
	}

	const handleLoginSuccess = async () => {
		await refetch();
		navigate({ to: "/" });
	};

	const cardConfig = {
		title:
			mode === "login"
				? "Iniciar sesión"
				: mode === "signup"
					? "Crear cuenta"
					: mode === "reset-password"
						? "Restablecer contraseña"
						: "Olvidé mi contraseña",
		description:
			mode === "login"
				? "Accede al panel de gestión comunitaria"
				: mode === "signup"
					? "Regístrate para gestionar tu comunidad"
					: mode === "reset-password"
						? "Ingresa tu nueva contraseña"
						: "Te enviaremos un enlace para recuperar tu acceso",
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>{cardConfig.title}</CardTitle>
					<CardDescription>{cardConfig.description}</CardDescription>
				</CardHeader>
				<CardContent>
					{mode === "login" ? (
						<LoginForm onSuccess={handleLoginSuccess} />
					) : mode === "signup" ? (
						<SignUpForm onSuccess={handleLoginSuccess} />
					) : mode === "reset-password" ? (
						<ResetPasswordForm token={token ?? ""} />
					) : 
						<ForgotPasswordForm />
					)}

					<div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
						{mode !== "login" ? (
							<button
								type="button"
								className="text-primary underline-offset-4 hover:underline"
								onClick={() => setMode("login")}
							>
								Volver a iniciar sesión
							</button>
						) : null}

						{mode !== "forgot" && mode !== "reset-password" ? (
							<button
								type="button"
								className="text-primary underline-offset-4 hover:underline"
								onClick={() => setMode("forgot")}
							>
								¿Olvidaste tu contraseña?
							</button>
						) : null}

						{mode !== "signup" ? (
							<button
								type="button"
								className="text-primary underline-offset-4 hover:underline"
								onClick={() => setMode("signup")}
							>
								¿No tienes cuenta? Regístrate
							</button>
						) : null}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
