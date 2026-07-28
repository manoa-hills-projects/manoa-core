/**
 * Modo Kiosko — Página principal
 *
 * Interfaz ultra-simple para que cualquier vecino pueda buscar sus datos
 * y generar carta de residencia sin necesidad de saber usar un computador.
 *
 * Letras grandes, botones gordos, cero distracciones.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	BadgeCheckIcon,
	Loader2Icon,
	PrinterIcon,
	SearchIcon,
	UserIcon,
} from "lucide-react";
import { api } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

export const Route = createFileRoute("/_authenticated/")({
	component: RouteComponent,
});

interface CitizenResult {
	id: string;
	dni: string;
	firstName: string;
	lastName: string;
	phone: string | null;
	familyName?: string;
	sector?: string;
	address?: string;
}

function RouteComponent() {
	const [dni, setDni] = useState("");
	const [loading, setLoading] = useState(false);
	const [citizen, setCitizen] = useState<CitizenResult | null | "not_found">(null);
	const [generating, setGenerating] = useState(false);

	const handleSearch = useCallback(async () => {
		const q = dni.trim();
		if (!q || q.length < 5) {
			toast.error("Escribí la cédula completa (ej: V-12345678)");
			return;
		}
		setLoading(true);
		setCitizen(null);
		try {
			const res = await api
				.get(`citizens?search=${encodeURIComponent(q)}&limit=5`)
				.json<{ data: CitizenResult[] }>();

			if (res.data && res.data.length > 0) {
				setCitizen(res.data[0]);
			} else {
				setCitizen("not_found");
			}
		} catch {
			toast.error("Error al buscar. Intentá de nuevo.");
			setCitizen("not_found");
		} finally {
			setLoading(false);
		}
	}, [dni]);

	const handleGenerate = useCallback(async () => {
		if (!citizen || citizen === "not_found") return;
		setGenerating(true);
		try {
			const res = await api
				.post("certifications/generar", {
					json: {
						documentType: "carta_residencia",
						residentId: citizen.id,
					},
				})
				.json<{ success: boolean; data: { hash: string } }>();

			if (res.success) {
				toast.success("✅ Carta generada correctamente");
				window.open(`/verify/${res.data.hash}`, "_blank");
			}
		} catch {
			toast.error("Error al generar la carta");
		} finally {
			setGenerating(false);
		}
	}, [citizen]);

	return (
		<div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center gap-6 px-4 py-8 text-center">
			{/* ── Logo / Título ── */}
			<div className="space-y-2">
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
					🏘️ Manoa
				</h1>
				<p className="text-xl text-muted-foreground">
					Consejo Comunal
				</p>
			</div>

			{/* ── No hay resultado / ni buscando ── */}
			{!citizen && !loading && (
				<div className="w-full max-w-md space-y-4">
					<label className="text-lg font-medium" htmlFor="dni-input">
						Ingresá tu número de cédula
					</label>
					<Input
						id="dni-input"
						value={dni}
						onChange={(e) => setDni(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						placeholder="V-12345678"
						className="h-16 text-center text-2xl shadow-sm"
						autoFocus
					/>
					<Button
						size="lg"
						className="h-16 w-full gap-3 text-xl"
						onClick={handleSearch}
						disabled={loading || dni.trim().length < 5}
					>
						{loading ? (
							<Loader2Icon className="size-7 animate-spin" />
						) : (
							<SearchIcon className="size-7" />
						)}
						Buscar
					</Button>

					<p className="pt-4 text-xs text-muted-foreground">
						¿No tenés cédula?{" "}
						<Link to="/auth" className="underline underline-offset-2">
							Iniciar sesión
						</Link>
					</p>
				</div>
			)}

			{/* ── Cargando ── */}
			{loading && (
				<div className="flex flex-col items-center gap-3 py-12">
					<Loader2Icon className="size-12 animate-spin text-primary" />
					<p className="text-lg text-muted-foreground">Buscando...</p>
				</div>
			)}

			{/* ── No encontrado ── */}
			{citizen === "not_found" && (
				<Card className="w-full max-w-md border-destructive/30">
					<CardContent className="space-y-4 py-8">
						<UserIcon className="mx-auto size-16 text-muted-foreground/30" />
						<p className="text-xl font-medium">
							No se encontró este número de cédula
						</p>
						<p className="text-muted-foreground">
							Verificá que esté escrito correctamente. Si el problema persiste,
							consultá con la directiva del consejo comunal.
						</p>
						<Button
							variant="outline"
							size="lg"
							className="mt-2"
							onClick={() => {
								setCitizen(null);
								setDni("");
							}}
						>
							Volver a intentar
						</Button>
					</CardContent>
				</Card>
			)}

			{/* ── Ciudadano encontrado ── */}
			{citizen && citizen !== "not_found" && (
				<Card className="w-full max-w-md border-primary/20 shadow-lg">
					<CardContent className="space-y-5 py-8">
						<div className="space-y-1">
							<p className="text-3xl font-bold">
								{citizen.firstName} {citizen.lastName}
							</p>
							<p className="text-xl text-muted-foreground">{citizen.dni}</p>
						</div>

						<div className="space-y-1 text-left text-lg">
							{citizen.familyName && (
								<p>
									<span className="text-muted-foreground">Familia: </span>
									<span className="font-medium">{citizen.familyName}</span>
								</p>
							)}
							{(citizen.sector || citizen.address) && (
								<p>
									<span className="text-muted-foreground">Dirección: </span>
									<span className="font-medium">
										{citizen.sector && `Sector ${citizen.sector}`}
										{citizen.sector && citizen.address && " · "}
										{citizen.address}
									</span>
								</p>
							)}
							{citizen.phone && (
								<p>
									<span className="text-muted-foreground">Teléfono: </span>
									<span className="font-medium">{citizen.phone}</span>
								</p>
							)}
						</div>

						<Button
							size="lg"
							className="h-16 w-full gap-3 text-xl"
							onClick={handleGenerate}
							disabled={generating}
						>
							{generating ? (
								<Loader2Icon className="size-7 animate-spin" />
							) : (
								<PrinterIcon className="size-7" />
							)}
							{generating ? "Generando..." : "Sacar mi carta de residencia"}
						</Button>

						<Button
							variant="ghost"
							size="lg"
							className="w-full text-lg"
							onClick={() => {
								setCitizen(null);
								setDni("");
							}}
						>
							Buscar otra persona
						</Button>
					</CardContent>
				</Card>
			)}

			{/* ── Link al dashboard (solo visible si tiene permisos) ── */}
			<div className="fixed bottom-4 right-4">
				<Link
					to="/dashboard"
					className="text-xs text-muted-foreground/50 hover:text-muted-foreground"
				>
					Admin
				</Link>
			</div>
		</div>
	);
}
