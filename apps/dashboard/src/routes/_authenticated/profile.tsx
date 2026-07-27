/**
 * Página de perfil de usuario (self-service)
 *
 * Muestra la información del usuario autenticado, permite editar nombre,
 * cambiar contraseña, ver datos del ciudadano vinculado y cerrar sesión.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	CalendarIcon,
	LockIcon,
	LogOutIcon,
	MailIcon,
	PhoneIcon,
	SaveIcon,
	UserCogIcon,
	UserIcon,
	VenetianMaskIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { api } from "@/shared/api/api-client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
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

interface UserProfile {
	id: string;
	key: string;
	name: string;
}

function ProfilePage() {
	const { data: session, isPending: sessionLoading } = authClient.useSession();
	const [citizen, setCitizen] = useState<CitizenData | null | "loading">("loading");
	const [profile, setProfile] = useState<UserProfile | null>(null);

	// ── Formulario editar nombre ──
	const [editName, setEditName] = useState(false);
	const [newName, setNewName] = useState("");
	const [savingName, setSavingName] = useState(false);

	// ── Formulario cambiar contraseña ──
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [changingPassword, setChangingPassword] = useState(false);

	const user = session?.user;

	// ── Cargar datos del ciudadano + perfil ──
	useEffect(() => {
		api.get("citizens/me")
			.json<{ data: CitizenData | null }>()
			.then((res) => setCitizen(res.data))
			.catch(() => setCitizen(null));

		api.get("profiles/me/profile")
			.json<{ profile: UserProfile | null }>()
			.then((res) => setProfile(res.profile))
			.catch(() => null);
	}, []);

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
		} catch {
			toast.error("Error al actualizar el nombre");
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
		} catch {
			toast.error("Error al cambiar la contraseña");
		} finally {
			setChangingPassword(false);
		}
	};

	const handleSignOut = async () => {
		try {
			await authClient.signOut();
		} catch {
			toast.error("Error al cerrar sesión");
		}
	};

	if (sessionLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
				Cargando perfil...
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-8">
			<SectionHeader
				name="Mi Perfil"
				description="Gestiona tu información personal y los datos de tu cuenta."
			/>

			{/* ═══ CARD DE IDENTIDAD ═══ */}
			<Card className="overflow-hidden">
				<div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
					<div className="flex items-center gap-4">
						<div className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
							<UserIcon className="size-8" />
						</div>
						<div className="flex-1 min-w-0">
							<h2 className="text-xl font-semibold truncate">
								{user?.name || "Usuario"}
							</h2>
							<p className="text-sm text-muted-foreground truncate">
								{user?.email || ""}
							</p>
							{profile && (
								<Badge variant="secondary" className="mt-1.5 text-xs">
									{profile.name}
								</Badge>
							)}
						</div>
					</div>
				</div>
			</Card>

			<div className="grid gap-6 md:grid-cols-2">
				{/* ═══ MI CUENTA ═══ */}
				<Card>
					<CardHeader className="flex flex-row items-center gap-2">
						<UserCogIcon className="size-4 text-muted-foreground" />
						<CardTitle className="text-base">Mi Cuenta</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">Correo electrónico</Label>
							<div className="flex items-center gap-2 text-sm">
								<MailIcon className="size-3.5 text-muted-foreground shrink-0" />
								<span>{user?.email || ""}</span>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">Nombre</Label>
							{editName ? (
								<div className="space-y-2">
									<Input
										value={newName}
										onChange={(e) => setNewName(e.target.value)}
										placeholder="Tu nombre completo"
										autoFocus
									/>
									<div className="flex gap-2">
										<Button size="sm" onClick={handleUpdateName} disabled={savingName}>
											<SaveIcon className="size-3.5 mr-1" />
											{savingName ? "Guardando..." : "Guardar"}
										</Button>
										<Button
											size="sm"
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
								<div className="flex items-center justify-between gap-2">
									<span className="text-sm">{user?.name || ""}</span>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setNewName(user?.name ?? "");
											setEditName(true);
										}}
									>
										Editar
									</Button>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* ═══ CAMBIAR CONTRASEÑA ═══ */}
				<Card>
					<CardHeader className="flex flex-row items-center gap-2">
						<LockIcon className="size-4 text-muted-foreground" />
						<CardTitle className="text-base">Cambiar Contraseña</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleChangePassword} className="space-y-3">
							<div className="space-y-1.5">
								<Label htmlFor="cp" className="text-xs text-muted-foreground">
									Contraseña actual
								</Label>
								<Input
									id="cp"
									type="password"
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									placeholder="••••••••"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="np" className="text-xs text-muted-foreground">
									Nueva contraseña
								</Label>
								<Input
									id="np"
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="Mínimo 6 caracteres"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="cnp" className="text-xs text-muted-foreground">
									Confirmar nueva contraseña
								</Label>
								<Input
									id="cnp"
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Repite la nueva contraseña"
								/>
							</div>
							<Button
								type="submit"
								size="sm"
								disabled={changingPassword}
								className="mt-1"
							>
								{changingPassword ? "Cambiando..." : "Cambiar Contraseña"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>

			{/* ═══ DATOS DEL CIUDADANO ═══ */}
			<Card>
				<CardHeader className="flex flex-row items-center gap-2">
					<VenetianMaskIcon className="size-4 text-muted-foreground" />
					<CardTitle className="text-base">Mis Datos de Ciudadano</CardTitle>
				</CardHeader>
				<CardContent>
					{citizen === "loading" ? (
						<div className="grid grid-cols-2 gap-4">
							{Array.from({ length: 6 }).map((_, i) => (
								<div key={i} className="space-y-1.5">
									<Skeleton className="h-3 w-16" />
									<Skeleton className="h-5 w-32" />
								</div>
							))}
						</div>
					) : citizen ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
							<CitizenField
								icon={<UserIcon className="size-3.5" />}
								label="Nombres"
								value={`${citizen.names} ${citizen.surnames}`}
							/>
							<CitizenField icon={<UserIcon className="size-3.5" />} label="Cédula" value={citizen.cedula} />
							<CitizenField
								icon={<MailIcon className="size-3.5" />}
								label="Tipo DNI"
								value={citizen.dni_type === "NATIONAL" ? "V" : citizen.dni_type === "FOREIGN" ? "E" : "SINTÉTICO"}
							/>
							<CitizenField
								icon={<PhoneIcon className="size-3.5" />}
								label="Teléfono"
								value={citizen.phone || "—"}
							/>
							<CitizenField
								icon={<CalendarIcon className="size-3.5" />}
								label="Fecha de nacimiento"
								value={citizen.birth_date}
							/>
							<CitizenField
								icon={<VenetianMaskIcon className="size-3.5" />}
								label="Género"
								value={
									citizen.gender === "MASCULINO" || citizen.gender === "male"
										? "Masculino"
										: citizen.gender === "FEMENINO" || citizen.gender === "female"
											? "Femenino"
											: citizen.gender
								}
							/>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-10 text-center">
							<UserIcon className="size-10 text-muted-foreground/30 mb-3" />
							<p className="text-sm text-muted-foreground max-w-sm">
								No estás vinculado a ningún ciudadano del censo. Si eres residente,
								contacta a la directiva del consejo comunal para que te vinculen.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* ═══ CERRAR SESIÓN ═══ */}
			<div className="flex items-center gap-4 pt-2">
				<Button variant="destructive" onClick={handleSignOut}>
					<LogOutIcon className="size-4 mr-1.5" />
					Cerrar sesión
				</Button>
			</div>
		</div>
	);
}

function CitizenField({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="space-y-1">
			<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
				{icon}
				{label}
			</p>
			<p className="text-sm font-medium">{value}</p>
		</div>
	);
}
