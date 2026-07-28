/**
 * Modo Kiosko — Página principal
 *
 * Busca ciudadanos por familia, dirección o cédula.
 * Muestra los miembros de la familia con sus datos y permite
 * descargar carta de residencia para cada uno.
 *
 * Diseñado para adultos mayores: letras grandes, botones grandes,
 * interfaz minimalista.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
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

// ─── Types ───

interface FamilyResult {
	id: string;
	name: string;
	houseId: string | null;
	sector?: string;
	address?: string;
	members: MemberResult[];
}

interface MemberResult {
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

interface SectorGroup {
	sector: string;
	houses: { number: string; families: { id: string; name: string }[] }[];
}

// ─── Component ───

function RouteComponent() {
	const [familyName, setFamilyName] = useState("");
	const [address, setAddress] = useState("");
	const [dni, setDni] = useState("");
	const [loading, setLoading] = useState(false);
	const [family, setFamily] = useState<FamilyResult | null>(null);
	const [sectors, setSectors] = useState<SectorGroup[]>([]);
	const [selectedSector, setSelectedSector] = useState<string>("");
	const [selectedHouse, setSelectedHouse] = useState<string>("");
	const [generating, setGenerating] = useState<string | null>(null);
	const [searched, setSearched] = useState(false);

	// ── Cargar sectores al inicio ──
	useMemo(() => {
		api.get("houses")
			.json<{ data: { id: string; sector: string; number: string }[] }>()
			.then((res) => {
				const map = new Map<string, { number: string; id: string }[]>();
				for (const h of res.data ?? []) {
					if (!map.has(h.sector)) map.set(h.sector, []);
					map.get(h.sector)!.push({ number: h.number, id: h.id });
				}
				const groups: SectorGroup[] = [];
				for (const [sector, houses] of map) {
					groups.push({
						sector,
						houses: houses.map((h) => ({ number: h.number, families: [] })),
					});
				}
				setSectors(groups.sort((a, b) => a.sector.localeCompare(b.sector)));
			})
			.catch(() => null);
	}, []);

	// ── Buscar ──
	const handleSearch = useCallback(async () => {
		if (!familyName.trim() && !address.trim() && !dni.trim()) {
			toast.error("Completá al menos un campo");
			return;
		}
		setLoading(true);
		setSearched(true);
		setFamily(null);
		try {
			const params = new URLSearchParams();
			if (familyName.trim()) params.set("search", familyName.trim());
			if (address.trim()) params.set("address", address.trim());
			if (dni.trim()) params.set("dni", dni.trim());

			const res = await api
				.get(`families?${params.toString()}&limit=5`)
				.json<{ data: FamilyResult[] }>();

			if (res.data && res.data.length > 0) {
				// Cargar miembros de la primera familia
				const fam = res.data[0];
				const membersRes = await api
					.get(`citizens?familyId=${fam.id}`)
					.json<{ data: MemberResult[] }>();
				setFamily({ ...fam, members: membersRes.data ?? [] });
			} else {
				setFamily(null);
			}
		} catch {
			toast.error("Error al buscar. Intentá de nuevo.");
		} finally {
			setLoading(false);
		}
	}, [familyName, address, dni]);

	// ── Filtrar por sector/manzana ──
	const handleSectorFilter = useCallback(async (sector: string, houseNumber?: string) => {
		setSelectedSector(sector);
		if (houseNumber) setSelectedHouse(houseNumber);
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set("sector", sector);
			if (houseNumber) params.set("number", houseNumber);

			const res = await api
				.get(`families?sector=${sector}${houseNumber ? `&number=${houseNumber}` : ""}&limit=20`)
				.json<{ data: FamilyResult[] }>();

			if (res.data && res.data.length > 0) {
				const fam = res.data[0];
				const membersRes = await api
					.get(`citizens?familyId=${fam.id}`)
					.json<{ data: MemberResult[] }>();
				setFamily({ ...fam, members: membersRes.data ?? [] });
				setFamilyName(fam.name);
				setAddress(houseNumber ? `Manzana ${sector} Casa ${houseNumber}` : `Manzana ${sector}`);
				setSearched(true);
			}
		} catch {
			toast.error("Error al buscar");
		} finally {
			setLoading(false);
		}
	}, []);

	// ── Generar carta ──
	const handleGenerate = useCallback(async (member: MemberResult) => {
		setGenerating(member.id);
		try {
			const res = await api
				.post("certifications/generar", {
					json: {
						documentType: "carta_residencia",
						residentId: member.id,
					},
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

	const isMinor = (birthDate: string) => {
		const age = (Date.now() - new Date(birthDate).getTime()) / 31557600000;
		return age < 18;
	};

	const isElderly = (birthDate: string) => {
		const age = (Date.now() - new Date(birthDate).getTime()) / 31557600000;
		return age >= 60;
	};

	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6 pb-24">
			{/* ═══ Header ═══ */}
			<header className="flex items-center justify-between border-b pb-4">
				<div className="flex items-center gap-3">
					<h1 className="text-2xl font-bold sm:text-3xl">Manoa</h1>
					<span className="hidden text-lg text-muted-foreground sm:inline">
						Consejo Comunal
					</span>
				</div>
				<Link
					to="/dashboard"
					className="text-xs text-muted-foreground/50 hover:text-muted-foreground"
				>
					Admin
				</Link>
			</header>

			<div className="grid gap-8 lg:grid-cols-[1fr_280px]">
				{/* ═══ Columna principal: búsqueda + resultados ═══ */}
				<div className="space-y-6">
					{/* ── Formulario de búsqueda ── */}
					<section className="rounded-xl border-2 p-6 shadow-sm">
						<h2 className="mb-1 text-xl font-bold">
							Descargar Carta de Residencia
						</h2>
						<p className="mb-6 text-muted-foreground">
							Ingresá los datos de tu familia para localizar el registro.
						</p>

						<div className="grid gap-5 sm:grid-cols-2">
							<div className="space-y-2">
								<label className="text-sm font-medium" htmlFor="fam-name">
									Nombre de la Familia
								</label>
								<div className="relative">
									<UsersIcon className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="fam-name"
										value={familyName}
										onChange={(e) => setFamilyName(e.target.value)}
										placeholder="Ej: Familia Pérez"
										className="h-12 pl-10 text-base"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium" htmlFor="address-input">
									Dirección / Manzana y Casa
								</label>
								<div className="relative">
									<HomeIcon className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="address-input"
										value={address}
										onChange={(e) => setAddress(e.target.value)}
										placeholder="Ej: Manzana 10 Casa 20"
										className="h-12 pl-10 text-base"
									/>
								</div>
							</div>

							<div className="space-y-2 sm:col-span-2">
								<label className="text-sm font-medium" htmlFor="dni-input">
									O buscá por Cédula de Identidad
								</label>
								<div className="relative">
									<UserIcon className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="dni-input"
										value={dni}
										onChange={(e) => setDni(e.target.value)}
										placeholder="V-12345678"
										className="h-12 pl-10 text-base"
									/>
								</div>
							</div>
						</div>

						<div className="mt-5">
							<Button
								size="lg"
								className="h-12 gap-2 px-8 text-base"
								onClick={handleSearch}
								disabled={loading}
							>
								{loading ? (
									<Loader2Icon className="size-5 animate-spin" />
								) : (
									<SearchIcon className="size-5" />
								)}
								Buscar Familia
							</Button>
						</div>
					</section>

					{/* ── Resultados ── */}
					{loading && (
						<div className="flex items-center justify-center py-16">
							<Loader2Icon className="size-10 animate-spin text-muted-foreground" />
						</div>
					)}

					{!loading && searched && !family && (
						<Card className="border-dashed">
							<CardContent className="flex flex-col items-center gap-3 py-16 text-center">
								<UsersIcon className="size-12 text-muted-foreground/30" />
								<p className="text-lg text-muted-foreground">
									No se encontraron resultados
								</p>
								<p className="text-sm text-muted-foreground/70">
									Probá con otro nombre de familia, dirección o verificá que esté registrada en el censo.
								</p>
							</CardContent>
						</Card>
					)}

					{!loading && family && (
						<>
							{/* ── Cabecera de resultados ── */}
							<div className="space-y-4">
								<h3 className="text-xl font-bold">
									Resultados para: {family.name}
								</h3>

								<div className="flex flex-col gap-4 rounded-xl border-2 bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
									<div className="flex items-center gap-4">
										<div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
											<UsersIcon className="size-7" />
										</div>
										<div>
											<h4 className="text-lg font-bold">{family.name}</h4>
											<p className="text-sm text-muted-foreground">
												{family.address || `Manzana ${family.sector || "—"}`}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-6 text-sm">
										<div className="text-center">
											<p className="text-xs uppercase tracking-wider text-muted-foreground">
												Miembros
											</p>
											<p className="text-2xl font-bold">
												{family.members.length} Registrados
											</p>
										</div>
										<div className="hidden h-10 w-px bg-border sm:block" />
										<div className="hidden sm:block">
											<p className="text-xs uppercase tracking-wider text-muted-foreground">
												Jefe de familia
											</p>
											<p className="text-sm font-medium">
												{family.members.find((m) => m.isHeadOfHousehold)?.firstName ||
													"—"}
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* ── Grid de miembros ── */}
							<div className="grid gap-4 sm:grid-cols-2">
								{family.members.map((member) => (
									<Card
										key={member.id}
										className={`flex flex-col justify-between ${
											isMinor(member.birthDate) ? "opacity-70 border-dashed" : "shadow-sm"
										}`}
									>
										<CardContent className="p-5">
											{/* Badges */}
											<div className="mb-3 flex flex-wrap gap-1.5">
												{member.isHeadOfHousehold && (
													<Badge variant="default" className="text-xs">
														Jefe de familia
													</Badge>
												)}
												{isElderly(member.birthDate) && (
													<Badge variant="secondary" className="gap-1 text-xs">
														Adulto Mayor
													</Badge>
												)}
												{isMinor(member.birthDate) && (
													<Badge variant="outline" className="text-xs">
														Niño / Adolescente
													</Badge>
												)}
												{member.disabilities && member.disabilities.length > 0 && (
													<Badge
														variant="destructive"
														className="gap-1 text-xs"
													>
														Discapacidad
													</Badge>
												)}
											</div>

											{/* Nombre + CI */}
											<div className="flex items-start justify-between">
												<div>
													<h4 className="text-lg font-bold">
														{member.firstName} {member.lastName}
													</h4>
													<p className="text-sm text-muted-foreground">
														{member.dni}
													</p>
												</div>
												<UserIcon className="size-10 text-muted-foreground/30" />
											</div>

											{/* Teléfono */}
											{member.phone && (
												<p className="mt-2 text-sm text-muted-foreground">
													📞 {member.phone}
												</p>
											)}

											{/* Botón descargar carta */}
											{!isMinor(member.birthDate) ? (
												<Button
													size="lg"
													className="mt-5 h-12 w-full gap-2 text-base"
													onClick={() => handleGenerate(member)}
													disabled={generating === member.id}
												>
													{generating === member.id ? (
														<Loader2Icon className="size-5 animate-spin" />
													) : (
														<SearchIcon className="size-5" />
													)}
													{generating === member.id
														? "Generando..."
														: "Descargar Carta"}
												</Button>
											) : (
												<div className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground">
													No disponible para menores de edad
												</div>
											)}
										</CardContent>
									</Card>
								))}
							</div>
						</>
					)}
				</div>

				{/* ═══ Sidebar: Manzanas ═══ */}
				<aside className="space-y-4">
					<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
						Manzanas
					</h3>
					<div className="space-y-1">
						{sectors.map((s) => (
							<div key={s.sector}>
								<button
									type="button"
									onClick={() => handleSectorFilter(s.sector)}
									className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
										selectedSector === s.sector ? "bg-muted font-medium" : ""
									}`}
								>
									<HomeIcon className="size-4 shrink-0 text-muted-foreground" />
									Manzana {s.sector}
								</button>
								{selectedSector === s.sector && (
									<div className="ml-6 mt-0.5 space-y-0.5">
										{s.houses.map((h) => (
											<button
												key={h.number}
												type="button"
												onClick={() => handleSectorFilter(s.sector, h.number)}
												className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted ${
													selectedHouse === h.number
														? "bg-muted font-medium"
														: "text-muted-foreground"
												}`}
											>
												Casa {h.number}
											</button>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				</aside>
			</div>

			{/* ═══ Footer ═══ */}
			<Separator />
			<footer className="flex flex-col items-center justify-between gap-4 pb-8 text-sm text-muted-foreground sm:flex-row">
				<p>Manoa — Cuidando nuestra comunidad con transparencia.</p>
				<div className="flex gap-4">
					<Link
						to="/dashboard"
						className="underline-offset-4 hover:underline"
					>
						Dashboard
					</Link>
					<Link to="/auth" className="underline-offset-4 hover:underline">
						Iniciar sesión
					</Link>
				</div>
			</footer>
		</div>
	);
}
