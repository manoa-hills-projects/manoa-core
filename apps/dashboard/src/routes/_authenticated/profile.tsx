/**
 * Página de perfil de usuario (self-service)
 *
 * Permite al usuario autenticado gestionar su información personal:
 * - Ver datos de su cuenta (nombre, email)
 * - Editar su nombre
 * - Cambiar su contraseña
 * - Ver datos de ciudadano vinculado (si existe)
 * - Cerrar sesión
 *
 * @route /_authenticated/profile
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { api } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { SectionHeader } from "@/widgets/section-header/ui/section-header";

export const Route = createFileRoute("/_authenticated/profile")({
	component: ProfilePage,
	staticData: {
		breadcrumb: "Mi Perfil",
	},
});

interface CitizenData {
	id: string;
	cedula: string;
	dni_type: string;
	phone: string | null;
	names: string;
	surnames: string;
	birth_date: string;
	gender: string;
	is_head_of_household: boolean;
	family_id: string | null;
	user_id: string;
}

function ProfilePage() {
	const { data: session, isPending: sessionLoading } = authClient.useSession();
	const [citizen, setCitizen] = useState<CitizenData | null | "loading">("loading");

	// ── Estado formulario editar nombre ──
	const [editName, setEditName] = useState(false);
	const [newName, setNewName] = useState("");
	const [savingName, setSavingName] = useState(false);

	// ── Estado formulario cambiar contraseña ──
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [changingPassword, setChangingPassword] = useState(false);

	// ── Cargar datos del ciudadano ──
	useEffect(() => {
		api
			.get("citizens/me")
			.json<{ data: CitizenData | null }>()
			.then((res) => setCitizen(res.data))
			.catch(() => setCitizen(null));
	}, []);

	if (sessionLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
				Cargando perfil...
			</div>
		);
	}

	const user = session?.user;

	const handleUpdateName = async () => {
		if (!newName.trim()) {
			toast.error("El nombre no puede estar vacío");
			return;
		}

		setSavingName(true);
		try {
			const { error } = await authClient.updateUser({ name: newName.trim() });
			if (error) {
				toast.error(error.message || "Error al actualizar el nombre");
				return;
			}
			toast.success("Nombre actualizado correctamente");
			setEditName(false);
		} catch (err: any) {
			toast.error(err?.message || "Error al actualizar el nombre");
		} finally {
			setSavingName(false);
		}
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!currentPassword) {
			toast.error("La contraseña actual es obligatoria");
			return;
		}

		if (!newPassword || newPassword.length < 6) {
			toast.error("La nueva contraseña debe tener al menos 6 caracteres");
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error("Las contraseñas no coinciden");
			return;
		}

		setChangingPassword(true);
		try {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword,
			});
			if (error) {
				toast.error(error.message || "Error al cambiar la contraseña");
				return;
			}
			toast.success("Contraseña cambiada correctamente");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (err: any) {
			toast.error(err?.message || "Error al cambiar la contraseña");
		} finally {
			setChangingPassword(false);
		}
	};

	const handleSignOut = async () => {
		try {
			await authClient.signOut();
			// La redirección la maneja el layout _authenticated
		} catch (err: any) {
			toast.error(err?.message || "Error al cerrar sesión");
		}
	};

	return (
		<div className="space-y-6">
			<SectionHeader
				name="Mi Perfil"
				description="Gestiona tu información personal y los datos de tu cuenta."
			/>

			{/* ════════════════════════════════════════════ */}
			{/* MI CUENTA                                    */}
			{/* ════════════════════════════════════════════ */}
			<Card>
				<CardHeader>
					<CardTitle>Mi Cuenta</CardTitle>
				</CardHeader>
				<CardContent className="space-y-5">
					{/* Email (solo lectura) */}
					<div className="space-y-2">
						<Label>Correo electrónico</Label>
						<Input value={user?.email ?? ""} disabled />
					</div>

					{/* Nombre */}
					{editName ? (
						<div className="space-y-3">
							<div className="space-y-2">
								<Label htmlFor="name">Nombre</Label>
								<Input
									id="name"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder="Tu nombre completo"
									autoFocus
								/>
							</div>
							<div className="flex items-center gap-2">
								<Button onClick={handleUpdateName} disabled={savingName}>
									{savingName ? "Guardando..." : "Guardar"}
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setEditName(false);
										setNewName("");
									}}
								>
									Cancelar
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-2">
							<Label>Nombre</Label>
							<div className="flex items-center gap-3">
								<Input value={user?.name ?? ""} disabled className="flex-1" />
								<Button
									variant="outline"
									onClick={() => {
										setNewName(user?.name ?? "");
										setEditName(true);
									}}
								>
									Editar
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* ════════════════════════════════════════════ */}
			{/* CAMBIAR CONTRASEÑA                            */}
			{/* ════════════════════════════════════════════ */}
			<Card>
				<CardHeader>
					<CardTitle>Cambiar Contraseña</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleChangePassword} className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="currentPassword">Contraseña actual</Label>
							<Input
								id="currentPassword"
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								placeholder="Ingresa tu contraseña actual"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="newPassword">Nueva contraseña</Label>
							<Input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Mínimo 6 caracteres"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Repite la nueva contraseña"
							/>
						</div>

						<Button type="submit" disabled={changingPassword}>
							{changingPassword ? "Cambiando..." : "Cambiar Contraseña"}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* ════════════════════════════════════════════ */}
			{/* MIS DATOS DE CIUDADANO                        */}
			{/* ════════════════════════════════════════════ */}
			<Card>
				<CardHeader>
					<CardTitle>Mis Datos de Ciudadano</CardTitle>
				</CardHeader>
				<CardContent>
					{citizen === "loading" ? (
						<p className="text-sm text-muted-foreground">
							Cargando datos del censo...
						</p>
					) : citizen ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
									Nombres
								</p>
								<p className="text-sm font-medium">{citizen.names}</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
									Apellidos
								</p>
								<p className="text-sm font-medium">{citizen.surnames}</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
									Cédula / DNI
								</p>
								<p className="text-sm font-medium">{citizen.cedula}</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
									Teléfono
								</p>
								<p className="text-sm font-medium">
									{citizen.phone || "—"}
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
									Fecha de nacimiento
								</p>
								<p className="text-sm font-medium">{citizen.birth_date}</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
									Género
								</p>
								<p className="text-sm font-medium capitalize">
									{citizen.gender === "male"
										? "Masculino"
										: citizen.gender === "female"
											? "Femenino"
											: citizen.gender}
								</p>
							</div>
							<div className="space-y-1 sm:col-span-2">
								<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
									Jefe de familia
								</p>
								<p className="text-sm font-medium">
									{citizen.is_head_of_household ? "Sí" : "No"}
								</p>
							</div>
						</div>
					) : (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								No estás vinculado a ningún ciudadano del censo.
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Si eres residente de Manoa, contacta a la directiva del
								consejo comunal para que te vinculen.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* ════════════════════════════════════════════ */}
			{/* CERRAR SESIÓN                                 */}
			{/* ════════════════════════════════════════════ */}
			<Separator />

			<div>
				<Button variant="destructive" onClick={handleSignOut}>
					Cerrar sesión
				</Button>
			</div>
		</div>
	);
}
