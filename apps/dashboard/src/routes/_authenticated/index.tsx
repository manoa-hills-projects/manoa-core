/**
 * Kiosko — Página principal
 */

import { createFileRoute, Link } from "@tanstack/react-router";
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

// ─── Autocomplete Input ───
function AutoInput({
	label,
	placeholder,
	icon: Icon,
	value,
	onChange,
	onSearch,
	fetchSuggestions,
}: {
	label: string;
	placeholder: string;
	icon: any;
	value: string;
	onChange: (v: string) => void;
	onSearch: (id: string) => void;
	fetchSuggestions: (q: string) => Promise<{ id: string; label: string; sublabel?: string }[]>;
}) {
	const [suggestions, setSuggestions] = useState<{ id: string; label: string; sublabel?: string }[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [statusText, setStatusText] = useState("");
	const timer = useRef<ReturnType<typeof setTimeout>>();
	const ref = useRef<HTMLDivElement>(null);

	// Autocomplete fetch con debounce
	useEffect(() => {
		if (timer.current) clearTimeout(timer.current);
		if (value.length < 2) { setSuggestions([]); setOpen(false); setStatusText(""); return; }
		setLoading(true);
		setStatusText("Buscando...");
		timer.current = setTimeout(async () => {
			try {
				const items = await fetchSuggestions(value);
				setSuggestions(items);
				setOpen(items.length > 0);
				setStatusText(items.length > 0 ? `${items.length} encontrado${items.length !== 1 ? "s" : ""}` : `Sin resultados para "${value}"`);
			} catch { setSuggestions([]); setStatusText("Error al buscar"); }
			finally { setLoading(false); }
		}, 300);
		return () => { if (timer.current) clearTimeout(timer.current); };
	}, [value, fetchSuggestions]);

	// Cerrar al hacer clic fuera
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	return (
		<div ref={ref} className="relative space-y-2">
			<label className="text-lg font-medium">{label}</label>
			<div className="relative">
				<Icon className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={value ?? ""}
					onChange={(e) => { onChange(e.target.value); setOpen(true); }}
					onFocus={() => value.length >= 2 && setOpen(suggestions.length > 0)}
					placeholder={placeholder}
					className="h-14 pl-12 pr-12 text-lg"
				/>
				{value && (
					<button
						type="button"
						onClick={() => { onChange(""); setSuggestions([]); setOpen(false); setStatusText(""); }}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
						tabIndex={-1}
					>
						<XIcon className="size-5" />
					</button>
				)}
				{loading && (
					<Loader2Icon className="absolute right-3 top-1/2 size-5 -translate-y-1/2 animate-spin text-muted-foreground/50" />
				)}
			</div>

			{/* Dropdown */}
			{open && (
				<div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border bg-background shadow-lg">
					{/* Status */}
					{statusText && (
						<div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
							{loading && <Loader2Icon className="size-3.5 animate-spin" />}
							{statusText}
						</div>
					)}
					{/* Lista */}
					{suggestions.length > 0 && (
						<div className="max-h-60 overflow-y-auto px-1 pb-1">
							{suggestions.map((s) => (
								<button
									key={s.id}
									type="button"
									className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left text-base transition-colors hover:bg-muted cursor-pointer"
									onClick={() => { onSearch(s.id); setOpen(false); }}
								>
									<span className="font-medium">{s.label}</span>
									{s.sublabel && <span className="text-sm text-muted-foreground">{s.sublabel}</span>}
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── Page ───

function RouteComponent() {
	const [familyName, setFamilyName] = useState("");
	const [address, setAddress] = useState("");
	const [cedula, setCedula] = useState("");
	const [loading, setLoading] = useState(false);
	const [family, setFamily] = useState<FamilyData | null>(null);
	const [searched, setSearched] = useState(false);
	const [generating, setGenerating] = useState<string | null>(null);
	const [sectors, setSectors] = useState<{ sector: string; count: number }[]>([]);
	const [selectedSector, setSelectedSector] = useState("");

	// Cargar sectores
	useEffect(() => {
		api.get("houses").json<{ data: { sector: string }[] }>()
			.then((res) => {
				const map = new Map<string, number>();
				for (const h of res.data ?? []) map.set(h.sector, (map.get(h.sector) ?? 0) + 1);
				setSectors([...map.entries()].map(([s, c]) => ({ sector: s, count: c })).sort((a, b) => a.sector.localeCompare(b.sector)));
			}).catch(() => null);
	}, []);

	// Reset
	const resetSearch = useCallback(() => {
		setFamilyName("");
		setAddress("");
		setCedula("");
		setFamily(null);
		setSearched(false);
		setSelectedSector("");
	}, []);

	// Autocomplete familias
	const fetchFamilies = useCallback(async (q: string) => {
		const r = await api.get(`families?search=${encodeURIComponent(q)}&limit=8`).json<{ data: { id: string; name: string }[] }>();
		return (r.data ?? []).map((f) => ({ id: f.id, label: f.name }));
	}, []);

	// Autocomplete direcciones
	const fetchAddresses = useCallback(async (q: string) => {
		const r = await api.get(`houses?search=${encodeURIComponent(q)}&limit=8`).json<{ data: { id: string; address: string; sector: string; number: string }[] }>();
		return (r.data ?? []).map((h) => ({ id: h.id, label: `Manzana ${h.sector} · Casa ${h.number}`, sublabel: h.address }));
	}, []);

	// Buscar
	const handleSearch = useCallback(async (famId?: string) => {
		if (!familyName && !address && !cedula && !famId) {
			toast.error("Completá al menos un campo");
			return;
		}
		setLoading(true);
		setSearched(true);
		setFamily(null);
		try {
			let famData: FamilyData | null = null;
			if (famId) {
				const r = await api.get(`families/${famId}`).json<{ data: FamilyData }>();
				famData = r.data;
			} else if (cedula) {
				const r = await api.get(`citizens?search=${encodeURIComponent(cedula)}&limit=1`).json<{ data: { id: string; familyId: string | null }[] }>();
				const c = r.data?.[0];
				if (c?.familyId) {
					const r2 = await api.get(`families/${c.familyId}`).json<{ data: FamilyData }>();
					famData = r2.data;
				}
			} else {
				const params = new URLSearchParams();
				if (familyName) params.set("search", familyName);
				if (address) params.set("search", address);
				const r = await api.get(`families?${params.toString()}&limit=1`).json<{ data: FamilyData[] }>();
				famData = r.data?.[0] ?? null;
			}
			if (famData) {
				const m = await api.get(`citizens?familyId=${famData.id}`).json<{ data: MemberData[] }>();
				setFamily({ ...famData, members: m.data ?? [] });
				setFamilyName(famData.name);
			} else {
				setFamily(null);
			}
		} catch { toast.error("Error al buscar"); }
		finally { setLoading(false); }
	}, [familyName, address, cedula]);

	const handleSectorClick = useCallback(async (sector: string) => {
		const s = sector === selectedSector ? "" : sector;
		setSelectedSector(s);
		if (!s) return;
		setLoading(true);
		try {
			const r = await api.get(`families?sector=${s}&limit=1`).json<{ data: FamilyData[] }>();
			if (r.data?.[0]) {
				const f = r.data[0];
				const m = await api.get(`citizens?familyId=${f.id}`).json<{ data: MemberData[] }>();
				setFamily({ ...f, members: m.data ?? [] });
				setFamilyName(f.name);
				setSearched(true);
			}
		} finally { setLoading(false); }
	}, [selectedSector]);

	const handleGenerate = useCallback(async (member: MemberData) => {
		setGenerating(member.id);
		try {
			const r = await api.post("certifications/generar", { json: { documentType: "carta_residencia", residentId: member.id } }).json<{ success: boolean; data: { hash: string } }>();
			if (r.success) {
				toast.success(`✅ Carta generada para ${member.firstName}`);
				window.open(`/verify/${r.data.hash}`, "_blank");
			}
		} catch { toast.error("Error al generar la carta"); }
		finally { setGenerating(null); }
	}, []);

	const isMinor = (bd: string) => (Date.now() - new Date(bd).getTime()) / 31557600000 < 18;
	const isElderly = (bd: string) => (Date.now() - new Date(bd).getTime()) / 31557600000 >= 60;

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-10 pb-12 pt-6">
			<div className="text-center">
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Descargar Carta de Residencia</h1>
				<p className="mt-3 text-xl text-muted-foreground">Buscá tu familia, seleccioná un miembro y descargá la carta</p>
			</div>

			<div className="grid gap-10 xl:grid-cols-[1fr_280px]">
				<div className="space-y-10">
					<section className="space-y-6 rounded-2xl border-2 p-8 shadow-sm">
						<div className="grid gap-6 md:grid-cols-2">
							<AutoInput
								label="Nombre de la Familia"
								placeholder="Ej: Familia Pérez"
								icon={UsersIcon}
								value={familyName}
								onChange={setFamilyName}
								onSearch={handleSearch}
								fetchSuggestions={fetchFamilies}
							/>
							<AutoInput
								label="Dirección / Manzana"
								placeholder="Ej: Manzana 10 Casa 20"
								icon={HomeIcon}
								value={address}
								onChange={setAddress}
								onSearch={handleSearch}
								fetchSuggestions={fetchAddresses}
							/>
							<div className="space-y-2 md:col-span-2">
								<label className="text-lg font-medium" htmlFor="ci">O buscá por Cédula de Identidad</label>
								<div className="relative">
									<UserIcon className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
									<Input id="ci" value={cedula} onChange={(e) => setCedula(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="V-12345678" className="h-14 pl-12 text-lg" />
								</div>
							</div>
						</div>
						<div className="flex flex-wrap gap-3">
							<Button size="lg" className="h-14 gap-3 px-10 text-lg" onClick={() => handleSearch()} disabled={loading}>
								{loading ? <Loader2Icon className="size-6 animate-spin" /> : <SearchIcon className="size-6" />}
								{loading ? "Buscando..." : "Buscar Familia"}
							</Button>
							{(searched || familyName || address || cedula) && (
								<Button size="lg" variant="outline" className="h-14 gap-2 px-6 text-lg" onClick={resetSearch}>
									<RotateCcwIcon className="size-5" />
									Nueva búsqueda
								</Button>
							)}
						</div>
					</section>

					{loading && <div className="flex items-center justify-center py-20"><Loader2Icon className="size-12 animate-spin text-muted-foreground" /></div>}

					{!loading && searched && !family && (
						<Card className="border-dashed py-16">
							<CardContent className="flex flex-col items-center gap-4 text-center">
								<UsersIcon className="size-16 text-muted-foreground/30" />
								<p className="text-2xl text-muted-foreground">No se encontraron resultados</p>
								<p className="text-lg text-muted-foreground/70">Probá con otro nombre, dirección o verificá en el consejo comunal.</p>
							</CardContent>
						</Card>
					)}

					{!loading && family && (
						<div className="space-y-6">
							<div className="flex flex-col gap-4 rounded-2xl border-2 bg-muted/30 p-6 md:flex-row md:items-center md:justify-between">
								<div className="flex items-center gap-4">
									<div className="flex size-16 items-center justify-center rounded-full bg-primary text-3xl text-primary-foreground"><UsersIcon className="size-8" /></div>
									<div>
										<p className="text-2xl font-bold">{family.name}</p>
										<p className="text-base text-muted-foreground">{family.address || `Manzana ${family.sector || "—"}`}</p>
									</div>
								</div>
								<div className="flex items-center gap-8">
									<div className="text-center">
										<p className="text-xs uppercase tracking-wider text-muted-foreground">Miembros</p>
										<p className="text-3xl font-bold">{family.members.length}</p>
									</div>
									<div className="hidden h-12 w-px bg-border md:block" />
									<div className="text-center md:text-left">
										<p className="text-xs uppercase tracking-wider text-muted-foreground">Jefe</p>
										<p className="text-lg font-medium">{family.members.find((m) => m.isHeadOfHousehold)?.firstName || "—"}</p>
									</div>
								</div>
							</div>

							<div className="grid gap-6 md:grid-cols-2">
								{family.members.map((m) => (
									<Card key={m.id} className={`flex flex-col justify-between p-6 ${isMinor(m.birthDate) ? "border-dashed opacity-70" : "shadow-sm"}`}>
										<div>
											<div className="mb-4 flex flex-wrap gap-2">
												{m.isHeadOfHousehold && <Badge className="px-3 py-1 text-sm">Jefe</Badge>}
												{isElderly(m.birthDate) && <Badge variant="secondary" className="px-3 py-1 text-sm">Adulto Mayor</Badge>}
												{isMinor(m.birthDate) && <Badge variant="outline" className="px-3 py-1 text-sm">Menor de edad</Badge>}
												{m.disabilities && m.disabilities.length > 0 && <Badge variant="destructive" className="px-3 py-1 text-sm">Discapacidad</Badge>}
											</div>
											<p className="text-2xl font-bold">{m.firstName} {m.lastName}</p>
											<p className="mt-1 text-lg text-muted-foreground">{m.dni}</p>
											{m.phone && <p className="mt-2 text-base text-muted-foreground">📞 {m.phone}</p>}
										</div>
										{!isMinor(m.birthDate) ? (
											<Button size="lg" className="mt-6 h-14 w-full gap-3 text-lg" onClick={() => handleGenerate(m)} disabled={generating === m.id}>
												{generating === m.id ? <Loader2Icon className="size-6 animate-spin" /> : <DownloadIcon className="size-6" />}
												{generating === m.id ? "Generando..." : "Descargar Carta"}
											</Button>
										) : (
											<div className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-base text-muted-foreground">No disponible para menores</div>
										)}
									</Card>
								))}
							</div>
						</div>
					)}
				</div>

				<Card>
					<CardContent className="p-5">
						<p className="mb-3 text-lg font-semibold">Manzanas</p>
						<div className="space-y-1">
							{sectors.map((s) => (
								<button key={s.sector} type="button" onClick={() => handleSectorClick(s.sector)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base transition-colors hover:bg-muted ${selectedSector === s.sector ? "bg-muted font-bold" : ""}`}>
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
