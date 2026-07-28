/**
 * Kiosko — Búsqueda unificada
 *
 * Un solo endpoint paginado con joins: GET /api/kiosko/search
 * Filtros: family, address, dni, sector
 * Los autocomplete solo llenan el input, no disparan búsqueda.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	DownloadIcon,
	HomeIcon,
	Loader2Icon,
	RotateCcwIcon,
	SearchIcon,
	UserIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { api } from "@/shared/api/api-client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

export const Route = createFileRoute("/_authenticated/")({
	component: RouteComponent,
});

interface CitizenRow {
	citizenId: string;
	dni: string;
	firstName: string;
	lastName: string;
	birthDate: string;
	gender: string;
	isHeadOfHousehold: boolean;
	phone: string | null;
	familyId: string | null;
	familyName: string | null;
	houseAddress: string | null;
	houseSector: string | null;
	houseNumber: string | null;
}

interface Metadata {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

// ─── Page ───
function RouteComponent() {
	const [familyName, setFamilyName] = useState("");
	const [address, setAddress] = useState("");
	const [cedula, setCedula] = useState("");
	const [dniPrefix, setDniPrefix] = useState("V");
	const [selectedSector, setSelectedSector] = useState("");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<CitizenRow[]>([]);
	const [metadata, setMetadata] = useState<Metadata | null>(null);
	const [searched, setSearched] = useState(false);
	const [generating, setGenerating] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [sectors, setSectors] = useState<{ sector: string; count: number }[]>([]);

	// Sugerencias
	const [famSug, setFamSug] = useState<{ label: string }[]>([]);
	const [addrSug, setAddrSug] = useState<{ label: string }[]>([]);
	const timer = useRef<ReturnType<typeof setTimeout>>();

	const debounce = useCallback((q: string, cb: (q: string) => Promise<void>) => {
		if (timer.current) clearTimeout(timer.current);
		if (q.length < 2) { setFamSug([]); setAddrSug([]); return; }
		timer.current = setTimeout(() => cb(q), 300);
	}, []);

	// Cargar manzanas
	useEffect(() => {
		api.get("houses?limit=999").json<{ data: { sector: string }[] }>()
			.then((res) => {
				const map = new Map<string, number>();
				for (const h of res.data ?? []) map.set(h.sector, (map.get(h.sector) ?? 0) + 1);
				setSectors([...map.entries()].map(([s, c]) => ({ sector: s, count: c })).sort((a, b) => a.sector.localeCompare(b.sector)));
			}).catch(() => null);
	}, []);

	// Búsqueda principal
	const doSearch = useCallback(async (p = 1) => {
		if (!familyName && !address && !cedula) { toast.error("Completá al menos un campo"); return; }
		setLoading(true); setSearched(true); setPage(p);
		try {
			const params = new URLSearchParams();
			if (familyName) params.set("family", familyName);
			if (address) params.set("address", address);
			if (cedula) params.set("dni", `${dniPrefix}-${cedula}`);
			if (selectedSector) params.set("sector", selectedSector);
			params.set("page", String(p));
			params.set("limit", "20");

			const res = await api.get(`kiosko/search?${params}`).json<{ data: CitizenRow[]; metadata: Metadata }>();
			setResults(res.data ?? []);
			setMetadata(res.metadata ?? null);
		} catch { toast.error("Error al buscar"); setResults([]); }
		finally { setLoading(false); }
	}, [familyName, address, cedula, dniPrefix, selectedSector]);

	const resetSearch = useCallback(() => {
		setFamilyName(""); setAddress(""); setCedula(""); setDniPrefix("V");
		setSelectedSector(""); setResults([]); setSearched(false); setMetadata(null); setPage(1);
	}, []);

	const handleGenerate = useCallback(async (citizenId: string, name: string) => {
		setGenerating(citizenId);
		try {
			const r = await api.post("certifications/generar", { json: { documentType: "carta_residencia", residentId: citizenId } }).json<{ success: boolean; data: { hash: string } }>();
			if (r.success) { toast.success(`✅ Carta generada para ${name}`); window.open(`/verify/${r.data.hash}`, "_blank"); }
		} catch { toast.error("Error al generar la carta"); }
		finally { setGenerating(null); }
	}, []);

	const handleSectorClick = useCallback((sector: string) => {
		setSelectedSector(sector === selectedSector ? "" : sector);
		setAddress(`Manzana ${sector}`);
	}, [selectedSector]);

	const isMinor = (bd: string) => (Date.now() - new Date(bd).getTime()) / 31557600000 < 18;
	const isElderly = (bd: string) => (Date.now() - new Date(bd).getTime()) / 31557600000 >= 60;

	// Agrupar resultados por familia
	const grouped = results.reduce<Record<string, CitizenRow[]>>((acc, r) => {
		const key = r.familyId || r.citizenId;
		if (!acc[key]) acc[key] = [];
		acc[key].push(r);
		return acc;
	}, {});
	const familyGroups = Object.entries(grouped).map(([key, members]) => ({
		key,
		familyName: members[0]?.familyName ?? "Sin familia",
		address: `${members[0]?.houseSector ? `Manzana ${members[0].houseSector}` : ""}${members[0]?.houseNumber ? ` · Casa ${members[0].houseNumber}` : ""}`,
		members,
	}));

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-10 pb-12 pt-6">
			<div className="text-center">
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Descargar Carta de Residencia</h1>
				<p className="mt-3 text-xl text-muted-foreground">Completá los campos y buscanos</p>
			</div>

			<div className="grid gap-10 xl:grid-cols-[1fr_280px]">
				<div className="space-y-10">
					<section className="space-y-6 rounded-2xl border-2 p-8 shadow-sm">
						<div className="grid gap-6 md:grid-cols-2">
							{/* Familia */}
							<div className="relative space-y-2">
								<label className="text-lg font-medium">Nombre de la Familia</label>
								<div className="relative">
									<UsersIcon className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
									<Input value={familyName} onChange={(e) => {
										setFamilyName(e.target.value);
										debounce(e.target.value, async (q) => {
											try {
												const r = await api.get(`families?search=${encodeURIComponent(q)}&limit=8`).json<{ data: { name: string }[] }>();
												setFamSug((r.data ?? []).map((f) => ({ label: f.name })));
											} catch { setFamSug([]); }
										});
									}} placeholder="Ej: Familia Pérez" className="h-14 pl-12 pr-12 text-lg" />
									{familyName && <button type="button" onClick={() => setFamilyName("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"><XIcon className="size-5" /></button>}
								</div>
								{famSug.length > 0 && (
									<div className="absolute z-50 mt-1 w-full rounded-xl border bg-background shadow-lg">
										{famSug.map((s) => (
											<button key={s.label} type="button" className="flex w-full rounded-lg px-3 py-2.5 text-left text-base hover:bg-muted" onClick={() => { setFamilyName(s.label); setFamSug([]); }}>{s.label}</button>
										))}
									</div>
								)}
							</div>

							{/* Dirección */}
							<div className="relative space-y-2">
								<label className="text-lg font-medium">Dirección / Manzana</label>
								<div className="relative">
									<HomeIcon className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
									<Input value={address} onChange={(e) => {
										setAddress(e.target.value);
										debounce(e.target.value, async (q) => {
											try {
												const r = await api.get(`houses?search=${encodeURIComponent(q)}&limit=8`).json<{ data: { address: string; sector: string; number: string }[] }>();
												setAddrSug((r.data ?? []).map((h) => ({ label: `Manzana ${h.sector} · Casa ${h.number}` })));
											} catch { setAddrSug([]); }
										});
									}} placeholder="Ej: Manzana 10 Casa 20" className="h-14 pl-12 pr-12 text-lg" />
									{address && <button type="button" onClick={() => setAddress("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"><XIcon className="size-5" /></button>}
								</div>
								{addrSug.length > 0 && (
									<div className="absolute z-50 mt-1 w-full rounded-xl border bg-background shadow-lg">
										{addrSug.map((s) => (
											<button key={s.label} type="button" className="flex w-full rounded-lg px-3 py-2.5 text-left text-base hover:bg-muted" onClick={() => { setAddress(s.label); setAddrSug([]); }}>{s.label}</button>
										))}
									</div>
								)}
							</div>

							{/* Cédula */}
							<div className="space-y-2 md:col-span-2">
								<label className="text-lg font-medium">O buscá por Cédula de Identidad</label>
								<div className="flex gap-2">
									<Select value={dniPrefix} onValueChange={setDniPrefix}>
										<SelectTrigger className="h-14 w-20 shrink-0 text-lg"><SelectValue /></SelectTrigger>
										<SelectContent>
											<SelectItem value="V">V</SelectItem>
											<SelectItem value="E">E</SelectItem>
										</SelectContent>
									</Select>
									<div className="relative flex-1">
										<UserIcon className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
										<Input value={cedula} onChange={(e) => setCedula(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} placeholder="12345678" className="h-14 pl-12 text-lg" />
									</div>
								</div>
							</div>
						</div>
						<div className="flex flex-wrap gap-3">
							<Button size="lg" className="h-14 gap-3 px-10 text-lg" onClick={() => doSearch()} disabled={loading}>
								{loading ? <Loader2Icon className="size-6 animate-spin" /> : <SearchIcon className="size-6" />}
								{loading ? "Buscando..." : "Buscar"}
							</Button>
							{(searched || familyName || address || cedula) && (
								<Button size="lg" variant="outline" className="h-14 gap-2 px-6 text-lg" onClick={resetSearch}>
									<RotateCcwIcon className="size-5" /> Limpiar
								</Button>
							)}
						</div>
					</section>

					{/* Resultados */}
					{loading && <div className="flex items-center justify-center py-20"><Loader2Icon className="size-12 animate-spin text-muted-foreground" /></div>}

					{!loading && searched && results.length === 0 && (
						<Card className="border-dashed py-16">
							<CardContent className="flex flex-col items-center gap-4 text-center">
								<UsersIcon className="size-16 text-muted-foreground/30" />
								<p className="text-2xl text-muted-foreground">No se encontraron resultados</p>
							</CardContent>
						</Card>
					)}

					{!loading && familyGroups.map((g) => (
						<div key={g.key} className="space-y-4">
							<div className="flex flex-col gap-3 rounded-2xl border-2 bg-muted/30 p-5 md:flex-row md:items-center md:justify-between">
								<div className="flex items-center gap-3">
									<div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><UsersIcon className="size-6" /></div>
									<div>
										<p className="text-xl font-bold">{g.familyName}</p>
										<p className="text-sm text-muted-foreground">{g.address || "—"}</p>
									</div>
								</div>
								<div className="text-center md:text-right">
									<p className="text-xs uppercase text-muted-foreground">Miembros</p>
									<p className="text-2xl font-bold">{g.members.length}</p>
								</div>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								{g.members.map((m) => (
									<Card key={m.citizenId} className={`flex flex-col justify-between p-5 ${isMinor(m.birthDate) ? "border-dashed opacity-70" : "shadow-sm"}`}>
										<div>
											<div className="mb-3 flex flex-wrap gap-1.5">
												{m.isHeadOfHousehold && <Badge className="px-3 py-1 text-sm">Jefe</Badge>}
												{isElderly(m.birthDate) && <Badge variant="secondary" className="px-3 py-1 text-sm">Adulto Mayor</Badge>}
												{isMinor(m.birthDate) && <Badge variant="outline" className="px-3 py-1 text-sm">Menor</Badge>}
											</div>
											<p className="text-xl font-bold">{m.firstName} {m.lastName}</p>
											<p className="text-base text-muted-foreground">{m.dni}</p>
											{m.phone && <p className="mt-1 text-sm text-muted-foreground">📞 {m.phone}</p>}
										</div>
										{!isMinor(m.birthDate) ? (
											<Button size="lg" className="mt-5 h-12 w-full gap-2 text-base" onClick={() => handleGenerate(m.citizenId, m.firstName)} disabled={generating === m.citizenId}>
												{generating === m.citizenId ? <Loader2Icon className="size-5 animate-spin" /> : <DownloadIcon className="size-5" />}
												{generating === m.citizenId ? "Generando..." : "Descargar Carta"}
											</Button>
										) : (
											<div className="mt-5 flex h-12 items-center justify-center rounded-xl border-2 border-dashed text-sm text-muted-foreground">No disponible</div>
										)}
									</Card>
								))}
							</div>
						</div>
					))}

					{/* Paginación */}
					{metadata && metadata.totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 pt-4">
							<Button variant="outline" size="sm" disabled={page <= 1} onClick={() => doSearch(page - 1)}>Anterior</Button>
							<span className="text-sm text-muted-foreground">Pág {page} de {metadata.totalPages}</span>
							<Button variant="outline" size="sm" disabled={page >= metadata.totalPages} onClick={() => doSearch(page + 1)}>Siguiente</Button>
						</div>
					)}
				</div>

				{/* Manzanas */}
				<Card className="sticky top-6 self-start">
					<CardContent className="p-5">
						<p className="mb-3 text-lg font-semibold">Manzanas</p>
						<div className="space-y-1">
							{sectors.map((s) => (
								<button key={s.sector} type="button" onClick={() => handleSectorClick(s.sector)}
									className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base transition-colors hover:bg-muted ${selectedSector === s.sector ? "bg-muted font-bold" : ""}`}>
									<HomeIcon className="size-5 shrink-0" />
									<div className="flex w-full items-center justify-between">
										<span>Manzana {s.sector}</span>
										<span className="text-sm text-muted-foreground">{s.count}</span>
									</div>
								</button>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
