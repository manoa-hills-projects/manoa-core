/**
 * Kiosko — Página principal
 *
 * Interfaz ultra-simple para buscar familias/ciudadanos y
 * descargar carta de residencia.
 *
 * Letras grandes, botones enormes, mucho espacio, 0 distracciones.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	DownloadIcon,
	HomeIcon,
	Loader2Icon,
	SearchIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import { api } from "@/shared/api/api-client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Separator } from "@/shared/ui/separator";

export const Route = createFileRoute("/_authenticated/")({
	component: RouteComponent,
});

interface FamilyData {
	id: string;
	name: string;
	address?: string;
	sector?: string;
	members: MemberData[];
}

interface MemberData {
	id: string;
	dni: string;
	firstName: string;
	lastName: string;
	birthDate: string;
	gender: string;
	isHeadOfHousehold: boolean;
	phone: string | null;
	disabilities?: string[];
}

function RouteComponent() {
	const [familyName, setFamilyName] = useState("");
	const [address, setAddress] = useState("");
	const [cedula, setCedula] = useState("");
	const [loading, setLoading] = useState(false);
	const [family, setFamily] = useState<FamilyData | null>(null);
	const [searched, setSearched] = useState(false);
	const [generating, setGenerating] = useState<string | null>(null);
	const [sectors, setSectors] = useState<string[]>([]);
	const [selectedSector, setSelectedSector] = useState("");

	// Cargar sectores disponibles
	useEffect(() => {
		api.get("houses")
			.json<{ data: { sector: string }[] }>()
			.then((res) => {
				const secs = [...new Set((res.data ?? []).map((h) => h.sector))];
				setSectors(secs.sort());
			})
			.catch(() => null);
	}, []);

	const handleSearch = useCallback(async () => {
		if (!familyName.trim() && !address.trim() && !cedula.trim()) {
			toast.error("Completá al menos un campo");
			return;
		}
		setLoading(true);
		setSearched(true);
		setFamily(null);
		try {
			let famData: FamilyData | null = null;

			if (cedula.trim()) {
				// Buscar por cédula
				const res = await api
					.get(`citizens?search=${encodeURIComponent(cedula.trim())}&limit=1`)
					.json<{ data: { id: string; familyId: string | null }[] }>();
				const citizen = res.data?.[0];
				if (citizen?.familyId) {
					const famRes = await api
						.get(`families/${citizen.familyId}`)
						.json<{ data: FamilyData }>();
					famData = famRes.data;
				}
			}

			if (!famData && (familyName.trim() || address.trim())) {
				const params = new URLSearchParams();
				if (familyName.trim()) params.set("search", familyName.trim());
				if (address.trim()) params.set("search", address.trim());
				const res = await api
					.get(`families?${params.toString()}&limit=1`)
					.json<{ data: FamilyData[] }>();
				famData = res.data?.[0] ?? null;
			}

			if (famData) {
				const membersRes = await api
					.get(`citizens?familyId=${famData.id}`)
					.json<{ data: MemberData[] }>();
				setFamily({ ...famData, members: membersRes.data ?? [] });
				setFamilyName(famData.name);
			} else {
				setFamily(null);
			}
		} catch {
			toast.error("Error al buscar");
		} finally {
			setLoading(false);
		}
	}, [familyName, address, cedula]);

	const handleSectorClick = useCallback(async (sector: string) => {
		setSelectedSector(sector === selectedSector ? "" : sector);
		setLoading(true);
		try {
			const res = await api
				.get(`families?sector=${sector}&limit=1`)
				.json<{ data: FamilyData[] }>();
			if (res.data?.[0]) {
				const f = res.data[0];
				const membersRes = await api
					.get(`citizens?familyId=${f.id}`)
					.json<{ data: MemberData[] }>();
				setFamily({ ...f, members: membersRes.data ?? [] });
				setFamilyName(f.name);
				setSearched(true);
			}
		} catch {
			// silent
		} finally {
			setLoading(false);
		}
	}, [selectedSector]);

	const handleGenerate = useCallback(async (member: MemberData) => {
		setGenerating(member.id);
		try {
			const res = await api
				.post("certifications/generar", {
					json: { documentType: "carta_residencia", residentId: member.id },
				})
				.json<{ success: boolean; data: { hash: string } }>();
			if (res.success) {
				toast.success(`✅ Carta generada para ${member.firstName}`);
				window.open(`/verify/${res.data.hash}`, "_blank");
			}
		} catch {
			toast.error("Error al generar la carta");
		} finally {
			setGenerating(null);
		}
	}, []);

	const isMinor = (bd: string) => (Date.now() - new Date(bd).getTime()) / 31557600000 < 18;
	const isElderly = (bd: string) => (Date.now() - new Date(bd).getTime()) / 31557600000 >= 60;

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-10 pb-12 pt-4">
			{/* ─── TÍTULO ─── */}
			<div className="text-center">
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
					Descargar Carta de Residencia
				</h1>
				<p className="mt-3 text-xl text-muted-foreground">
					Ingresá los datos de tu familia para localizar el registro
				</p>
			</div>

			<div className="grid gap-10 xl:grid-cols-[1fr_300px]">
				{/* ═══ COLUMNA PRINCIPAL ═══ */}
				<div className="space-y-10">
					{/* ─── BUSCADOR ─── */}
					<section className="space-y-6 rounded-2xl border-2 p-8 shadow-sm">
						<div className="grid gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<label className="text-lg font-medium" htmlFor="fam">
									Nombre de la Familia
								</label>
								<div className="relative">
									<UsersIcon className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="fam"
										value={familyName}
										onChange={(e) => setFamilyName(e.target.value)}
										placeholder="Ej: Familia Pérez"
										className="h-14 pl-12 text-lg"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<label className="text-lg font-medium" htmlFor="addr">
									Dirección / Manzana
								</label>
								<div className="relative">
									<HomeIcon className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="addr"
										value={address}
										onChange={(e) => setAddress(e.target.value)}
										placeholder="Ej: Manzana 10 Casa 20"
										className="h-14 pl-12 text-lg"
									/>
								</div>
							</div>
							<div className="space-y-2 md:col-span-2">
								<label className="text-lg font-medium" htmlFor="ci">
									O buscá por Cédula de Identidad
								</label>
								<div className="relative">
									<UserIcon className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="ci"
										value={cedula}
										onChange={(e) => setCedula(e.target.value)}
										placeholder="V-12345678"
										className="h-14 pl-12 text-lg"
									/>
								</div>
							</div>
						</div>

						<Button
							size="lg"
							className="h-14 gap-3 px-10 text-lg"
							onClick={handleSearch}
							disabled={loading}
						>
							{loading ? (
								<Loader2Icon className="size-6 animate-spin" />
							) : (
								<SearchIcon className="size-6" />
							)}
							{loading ? "Buscando..." : "Buscar Familia"}
						</Button>
					</section>

					{/* ─── RESULTADOS ─── */}
					{loading && (
						<div className="flex items-center justify-center py-20">
							<Loader2Icon className="size-12 animate-spin text-muted-foreground" />
						</div>
					)}

					{!loading && searched && !family && (
						<Card className="border-dashed py-16">
							<CardContent className="flex flex-col items-center gap-4 text-center">
								<UsersIcon className="size-16 text-muted-foreground/30" />
								<p className="text-2xl text-muted-foreground">
									No se encontraron resultados
								</p>
								<p className="text-lg text-muted-foreground/70">
									Probá con otro nombre, dirección o verificá en el consejo comunal.
								</p>
							</CardContent>
						</Card>
					)}

					{/* ─── FAMILIA ENCONTRADA ─── */}
					{!loading && family && (
						<div className="space-y-6">
							{/* Info de la familia */}
							<div className="flex flex-col gap-4 rounded-2xl border-2 bg-muted/30 p-6 md:flex-row md:items-center md:justify-between">
								<div className="flex items-center gap-4">
									<div className="flex size-16 items-center justify-center rounded-full bg-primary text-3xl text-primary-foreground">
										<UsersIcon className="size-8" />
									</div>
									<div>
										<p className="text-2xl font-bold">{family.name}</p>
										<p className="text-base text-muted-foreground">
											{family.address || `Manzana ${family.sector || "—"}`}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-8">
									<div className="text-center">
										<p className="text-xs uppercase tracking-wider text-muted-foreground">
											Miembros
										</p>
										<p className="text-3xl font-bold">{family.members.length}</p>
									</div>
									<div className="hidden h-12 w-px bg-border md:block" />
									<div className="text-center md:text-left">
										<p className="text-xs uppercase tracking-wider text-muted-foreground">
											Jefe
										</p>
										<p className="text-lg font-medium">
											{family.members.find((m) => m.isHeadOfHousehold)
												?.firstName || "—"}
										</p>
									</div>
								</div>
							</div>

							{/* Grid de miembros */}
							<div className="grid gap-6 md:grid-cols-2">
								{family.members.map((m) => (
									<Card
										key={m.id}
										className={`flex flex-col justify-between p-6 ${
											isMinor(m.birthDate)
												? "border-dashed opacity-70"
												: "shadow-sm"
										}`}
									>
										<div>
											{/* Badges */}
											<div className="mb-4 flex flex-wrap gap-2">
												{m.isHeadOfHousehold && (
													<Badge className="px-3 py-1 text-sm">Jefe</Badge>
												)}
												{isElderly(m.birthDate) && (
													<Badge
														variant="secondary"
														className="px-3 py-1 text-sm"
													>
														Adulto Mayor
													</Badge>
												)}
												{isMinor(m.birthDate) && (
													<Badge
														variant="outline"
														className="px-3 py-1 text-sm"
													>
														Menor de edad
													</Badge>
												)}
												{m.disabilities && m.disabilities.length > 0 && (
													<Badge
														variant="destructive"
														className="px-3 py-1 text-sm"
													>
														Discapacidad
													</Badge>
												)}
											</div>

											{/* Nombre + CI */}
											<p className="text-2xl font-bold">
												{m.firstName} {m.lastName}
											</p>
											<p className="mt-1 text-lg text-muted-foreground">
												{m.dni}
											</p>
											{m.phone && (
												<p className="mt-2 text-base text-muted-foreground">
													📞 {m.phone}
												</p>
											)}
										</div>

										{!isMinor(m.birthDate) ? (
											<Button
												size="lg"
												className="mt-6 h-14 w-full gap-3 text-lg"
												onClick={() => handleGenerate(m)}
												disabled={generating === m.id}
											>
												{generating === m.id ? (
													<Loader2Icon className="size-6 animate-spin" />
												) : (
													<DownloadIcon className="size-6" />
												)}
												{generating === m.id
													? "Generando..."
													: "Descargar Carta"}
											</Button>
										) : (
											<div className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-base text-muted-foreground">
												No disponible para menores
											</div>
										)}
									</Card>
								))}
							</div>
						</div>
					)}
				</div>

				{/* ═══ SIDEBAR: MANZANAS ═══ */}
				<aside className="space-y-4">
					<p className="text-lg font-semibold">Manzanas</p>
					<div className="space-y-1">
						{sectors.map((s) => (
							<div key={s}>
								<button
									type="button"
									onClick={() => handleSectorClick(s)}
									className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base transition-colors hover:bg-muted ${
										selectedSector === s ? "bg-muted font-bold" : ""
									}`}
								>
									<HomeIcon className="size-5 shrink-0" />
									Manzana {s}
								</button>
							</div>
						))}
						{sectors.length === 0 && (
							<p className="px-4 py-3 text-sm text-muted-foreground">
								Cargando...
							</p>
						)}
					</div>
				</aside>
			</div>

			{/* ─── LINK ADMIN (discreto) ─── */}
			<Separator />
			<div className="flex items-center justify-between text-sm text-muted-foreground/60">
				<p>Manoa - Consejo Comunal</p>
				<Link to="/dashboard" className="underline-offset-2 hover:underline">
					Dashboard
				</Link>
			</div>
		</div>
	);
}
