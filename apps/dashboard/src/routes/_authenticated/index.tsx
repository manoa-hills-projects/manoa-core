/**
 * Kiosko — Búsqueda unificada
 *
 * Un solo endpoint paginado: GET /api/kiosko/search
 * Filtros: family, address, dni, sector
 */

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	DownloadIcon,
	HomeIcon,
	Loader2Icon,
	RotateCcwIcon,
	SearchIcon,
	UserIcon,
	UsersIcon,
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
interface Metadata { total: number; page: number; limit: number; totalPages: number; }

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

	// Cargar manzanas
	useEffect(() => {
		api.get("houses?limit=999").json<{ data: { sector: string }[] }>()
			.then((res) => {
				const map = new Map<string, number>();
				for (const h of res.data ?? []) map.set(h.sector, (map.get(h.sector) ?? 0) + 1);
				setSectors([...map.entries()].map(([s, c]) => ({ sector: s, count: c })).sort((a, b) => a.sector.localeCompare(b.sector)));
			}).catch(() => null);
	}, []);

	// Búsqueda
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
		if (sector !== selectedSector) setAddress(`Manzana ${sector}`);
	}, [selectedSector]);

	const isMinor = (bd: string) => (Date.now() - new Date(bd).getTime()) / 31557600000 < 18;
	const isElderly = (bd: string) => (Date.now() - new Date(bd).getTime()) / 31557600000 >= 60;

	// Agrupar por familia
	const groups = Object.entries(
		results.reduce<Record<string, CitizenRow[]>>((acc, r) => {
			const k = r.familyId || r.citizenId;
			if (!acc[k]) acc[k] = [];
			acc[k].push(r);
			return acc;
		}, {})
	).map(([key, members]) => ({
		key,
		name: members[0]?.familyName ?? "Sin familia",
		addr: `${members[0]?.houseSector ? `Manzana ${members[0].houseSector}` : ""}${members[0]?.houseNumber ? ` · Casa ${members[0].houseNumber}` : ""}`,
		members,
	}));

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-8 pb-12 pt-6">
			<h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">Descargar Carta de Residencia</h1>

			<div className="grid gap-8 xl:grid-cols-[1fr_280px]">
				<div className="space-y-8">
					{/* Buscador */}
					<section className="space-y-5 rounded-2xl border-2 p-6 shadow-sm">
						<div className="grid gap-5 md:grid-cols-2">
							<div className="space-y-2">
								<label className="text-base font-medium">Nombre de la Familia</label>
								<Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Ej: Familia Pérez" className="h-12 text-base" />
							</div>
							<div className="space-y-2">
								<label className="text-base font-medium">Dirección / Manzana</label>
								<Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: Manzana 10 Casa 20" className="h-12 text-base" />
							</div>
							<div className="space-y-2 md:col-span-2">
								<label className="text-base font-medium">Cédula de Identidad</label>
								<div className="flex gap-2">
									<Select value={dniPrefix} onValueChange={setDniPrefix}>
										<SelectTrigger className="h-12 w-16 shrink-0"><SelectValue /></SelectTrigger>
										<SelectContent>
											<SelectItem value="V">V</SelectItem>
											<SelectItem value="E">E</SelectItem>
										</SelectContent>
									</Select>
									<Input value={cedula} onChange={(e) => setCedula(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} placeholder="12345678" className="h-12 flex-1 text-base" />
								</div>
							</div>
						</div>
						<div className="flex flex-wrap gap-3">
							<Button size="lg" className="h-12 gap-2 px-8 text-base" onClick={() => doSearch()} disabled={loading}>
								{loading ? <Loader2Icon className="size-5 animate-spin" /> : <SearchIcon className="size-5" />}
								{loading ? "Buscando..." : "Buscar"}
							</Button>
							{(searched || familyName || address || cedula) && (
								<Button size="lg" variant="outline" className="h-12 gap-2 px-5 text-base" onClick={resetSearch}>
									<RotateCcwIcon className="size-5" /> Limpiar
								</Button>
							)}
						</div>
					</section>

					{/* Resultados */}
					{loading && <div className="flex justify-center py-16"><Loader2Icon className="size-10 animate-spin text-muted-foreground" /></div>}

					{!loading && searched && results.length === 0 && (
						<Card className="border-dashed py-12">
							<CardContent className="flex flex-col items-center gap-3 text-center">
								<UsersIcon className="size-12 text-muted-foreground/30" />
								<p className="text-xl text-muted-foreground">Sin resultados</p>
								<p className="text-sm text-muted-foreground/70">Probá con otros términos</p>
							</CardContent>
						</Card>
					)}

					{!loading && groups.map((g) => (
						<div key={g.key} className="space-y-3">
							<div className="flex items-center justify-between rounded-xl border-2 bg-muted/30 p-4">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><UsersIcon className="size-5" /></div>
									<div>
										<p className="font-bold">{g.name}</p>
										<p className="text-sm text-muted-foreground">{g.addr || "—"}</p>
									</div>
								</div>
								<p className="text-sm text-muted-foreground">{g.members.length} miembros</p>
							</div>
							<div className="grid gap-3 md:grid-cols-2">
								{g.members.map((m) => (
									<Card key={m.citizenId} className={`flex flex-col justify-between p-4 ${isMinor(m.birthDate) ? "border-dashed opacity-60" : ""}`}>
										<div>
											<div className="mb-2 flex flex-wrap gap-1">
												{m.isHeadOfHousehold && <Badge className="text-xs">Jefe</Badge>}
												{isElderly(m.birthDate) && <Badge variant="secondary" className="text-xs">Adulto Mayor</Badge>}
												{isMinor(m.birthDate) && <Badge variant="outline" className="text-xs">Menor</Badge>}
											</div>
											<p className="font-bold">{m.firstName} {m.lastName}</p>
											<p className="text-sm text-muted-foreground">{m.dni}</p>
										</div>
										{!isMinor(m.birthDate) ? (
											<Button className="mt-4 h-11 w-full gap-2 text-sm" onClick={() => handleGenerate(m.citizenId, m.firstName)} disabled={generating === m.citizenId}>
												{generating === m.citizenId ? <Loader2Icon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
												{generating === m.citizenId ? "Generando..." : "Descargar Carta"}
											</Button>
										) : (
											<div className="mt-4 flex h-11 items-center justify-center rounded-xl border-2 border-dashed text-xs text-muted-foreground">No disponible</div>
										)}
									</Card>
								))}
							</div>
						</div>
					))}

					{/* Paginación */}
					{metadata && metadata.totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 pt-2">
							<Button variant="outline" size="sm" disabled={page <= 1} onClick={() => doSearch(page - 1)}>← Anterior</Button>
							<span className="text-sm text-muted-foreground">{page} / {metadata.totalPages}</span>
							<Button variant="outline" size="sm" disabled={page >= metadata.totalPages} onClick={() => doSearch(page + 1)}>Siguiente →</Button>
						</div>
					)}
				</div>

				{/* Manzanas */}
				<Card className="sticky top-6 self-start">
					<CardContent className="p-4">
						<p className="mb-2 text-base font-semibold">Manzanas</p>
						<div className="space-y-0.5">
							{sectors.map((s) => (
								<button key={s.sector} type="button" onClick={() => handleSectorClick(s.sector)}
									className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${selectedSector === s.sector ? "bg-muted font-semibold" : ""}`}>
									<HomeIcon className="size-4 shrink-0" />
									<span className="flex-1">Manzana {s.sector}</span>
									<span className="text-xs text-muted-foreground">{s.count}</span>
								</button>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
