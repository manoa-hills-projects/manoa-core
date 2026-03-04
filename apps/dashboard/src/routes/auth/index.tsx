import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import {
	type FormEvent,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { env } from "@/env";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

export const Route = createFileRoute("/auth/")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate({ from: "/auth/" });
	const [mode, setMode] = useState<"login" | "forgot">("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [forgotEmail, setForgotEmail] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const emailInputId = useId();
	const passwordInputId = useId();
	const forgotEmailInputId = useId();
	const { data, isPending, refetch } = authClient.useSession();

	const turnstileSiteKey = env.VITE_TURNSTILE_SITE_KEY;
	const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
	const turnstileWidgetIdRef = useRef<string | null>(null);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

	const turnstileEnabled = useMemo(
		() => Boolean(turnstileSiteKey && mode === "login"),
		[mode, turnstileSiteKey],
	);

	useEffect(() => {
		if (!turnstileEnabled) {
			setTurnstileToken(null);
			return;
		}

		const scriptId = "cf-turnstile-script";
		let cancelled = false;

		const renderWidget = () => {
			if (cancelled || !turnstileContainerRef.current || !turnstileSiteKey) {
				return;
			}

			const turnstile = (
				window as Window & {
					turnstile?: {
						render: (
							element: HTMLElement,
							options: Record<string, unknown>,
						) => string;
						remove: (id: string) => void;
						reset: (id: string) => void;
					};
				}
			).turnstile;

			if (!turnstile) {
				return;
			}

			if (turnstileWidgetIdRef.current) {
				turnstile.remove(turnstileWidgetIdRef.current);
				turnstileWidgetIdRef.current = null;
			}

			turnstileWidgetIdRef.current = turnstile.render(
				turnstileContainerRef.current,
				{
					sitekey: turnstileSiteKey,
					callback: (token: string) => {
						setTurnstileToken(token);
					},
					"expired-callback": () => {
						setTurnstileToken(null);
					},
					"error-callback": () => {
						setTurnstileToken(null);
					},
				},
			);
		};

		const existingScript = document.getElementById(
			scriptId,
		) as HTMLScriptElement | null;
		let onLoadHandler: (() => void) | null = null;

		if (!existingScript) {
			const script = document.createElement("script");
			script.id = scriptId;
			script.src =
				"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
			script.async = true;
			script.defer = true;
			script.onload = renderWidget;
			document.head.appendChild(script);
		} else {
			const turnstile = (
				window as Window & {
					turnstile?: unknown;
				}
			).turnstile;

			if (turnstile) {
				renderWidget();
			} else {
				onLoadHandler = () => {
					renderWidget();
				};

				existingScript.addEventListener("load", onLoadHandler, { once: true });
			}
		}

		return () => {
			cancelled = true;

			if (existingScript && onLoadHandler) {
				existingScript.removeEventListener("load", onLoadHandler);
			}
		};
	}, [turnstileEnabled, turnstileSiteKey]);

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

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);
		setSuccessMessage(null);

		if (turnstileEnabled && !turnstileToken) {
			setErrorMessage("Completa el captcha antes de iniciar sesión.");
			return;
		}

		setIsSubmitting(true);

		try {
			await authClient.$fetch("/sign-in/email", {
				method: "POST",
				body: {
					email,
					password,
				},
				headers:
					turnstileToken && turnstileEnabled
						? { "X-Turnstile-Token": turnstileToken }
						: undefined,
			});

			await refetch();
			navigate({ to: "/" });
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "No se pudo iniciar sesión",
			);
		} finally {
			setIsSubmitting(false);
			const turnstile = (
				window as Window & {
					turnstile?: { reset: (id: string) => void };
				}
			).turnstile;

			if (turnstileWidgetIdRef.current && turnstile?.reset) {
				turnstile.reset(turnstileWidgetIdRef.current);
				setTurnstileToken(null);
			}
		}
	};

	const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);
		setSuccessMessage(null);
		setIsSubmitting(true);

		try {
			await authClient.$fetch("/request-password-reset", {
				method: "POST",
				body: {
					email: forgotEmail,
					redirectTo: `${window.location.origin}/auth`,
				},
			});

			setSuccessMessage(
				"Si el correo existe, enviamos un enlace para restablecer la contraseña.",
			);
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: "No se pudo procesar la solicitud",
			);
		} finally {
			setIsSubmitting(false);
		}
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
					{errorMessage ? (
						<p className="mb-3 text-sm text-destructive">{errorMessage}</p>
					) : null}
					{successMessage ? (
						<p className="mb-3 text-sm text-emerald-600">{successMessage}</p>
					) : null}

					{mode === "login" ? (
						<form className="space-y-4" onSubmit={handleLogin}>
							<div className="space-y-2">
								<label htmlFor={emailInputId} className="text-sm font-medium">
									Correo
								</label>
								<Input
									id={emailInputId}
									type="email"
									autoComplete="email"
									required
									value={email}
									onChange={(event) => setEmail(event.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<label
									htmlFor={passwordInputId}
									className="text-sm font-medium"
								>
									Contraseña
								</label>
								<Input
									id={passwordInputId}
									type="password"
									autoComplete="current-password"
									required
									value={password}
									onChange={(event) => setPassword(event.target.value)}
								/>
							</div>

							{!turnstileSiteKey ? (
								<p className="text-xs text-amber-600">
									Captcha no configurado: define VITE_TURNSTILE_SITE_KEY en
									.env.local
								</p>
							) : null}

							{turnstileEnabled ? <div ref={turnstileContainerRef} /> : null}

							<Button type="submit" className="w-full" disabled={isSubmitting}>
								{isSubmitting ? "Ingresando..." : "Entrar"}
							</Button>
						</form>
					) : (
						<form className="space-y-4" onSubmit={handleForgotPassword}>
							<div className="space-y-2">
								<label
									htmlFor={forgotEmailInputId}
									className="text-sm font-medium"
								>
									Correo
								</label>
								<Input
									id={forgotEmailInputId}
									type="email"
									autoComplete="email"
									required
									value={forgotEmail}
									onChange={(event) => setForgotEmail(event.target.value)}
								/>
							</div>

							<Button type="submit" className="w-full" disabled={isSubmitting}>
								{isSubmitting ? "Enviando..." : "Enviar enlace"}
							</Button>
						</form>
					)}

					<div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
						{mode !== "login" ? (
							<button
								type="button"
								className="text-primary underline-offset-4 hover:underline"
								onClick={() => {
									setMode("login");
									setErrorMessage(null);
									setSuccessMessage(null);
								}}
							>
								Volver a iniciar sesión
							</button>
						) : null}

						{mode !== "forgot" ? (
							<button
								type="button"
								className="text-primary underline-offset-4 hover:underline"
								onClick={() => {
									setMode("forgot");
									setErrorMessage(null);
									setSuccessMessage(null);
								}}
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
