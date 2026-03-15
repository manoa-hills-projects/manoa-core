import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ForgotPasswordForm } from "@/features/auth/ui/forgot-password-form";
import { LoginForm } from "@/features/auth/ui/login-form";
import { authClient } from "@/lib/auth-client";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";

export const Route = createFileRoute("/auth/")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate({ from: "/auth/" });
	const [mode, setMode] = useState<"login" | "forgot">("login");
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

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>
						{mode === "login" ? "Iniciar sesión" : "Olvidé mi contraseña"}
					</CardTitle>
					<CardDescription>
						{mode === "login"
							? "Accede al panel de gestión comunitaria"
							: "Te enviaremos un enlace para recuperar tu acceso"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{mode === "login" ? (
						<LoginForm onSuccess={handleLoginSuccess} />
					) : (
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

						{mode !== "forgot" ? (
							<button
								type="button"
								className="text-primary underline-offset-4 hover:underline"
								onClick={() => setMode("forgot")}
							>
								¿Olvidaste tu contraseña?
							</button>
						) : null}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
