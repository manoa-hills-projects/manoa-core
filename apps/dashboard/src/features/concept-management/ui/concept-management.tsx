import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	bsCentsFromUsd,
	formatBs,
	formatUsd,
	useCategories,
	useConcepts,
	useCreateConcept,
	useDeleteConcept,
	useTodayRate,
} from "@/entities/treasury";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

export function ConceptManagement() {
	const { data: concepts } = useConcepts(false);
	const { data: categories } = useCategories();
	const { data: rate } = useTodayRate();
	const del = useDeleteConcept();
	const [sheetOpen, setSheetOpen] = useState(false);

	const catName = (id: string) =>
		categories?.find((c) => c.id === id)?.name ?? "—";

	// Bs sugerido se recalcula contra la tasa vigente. USD es canonical.
	const suggestedBsCents = (usdCents: number | null) =>
		bsCentsFromUsd(usdCents, rate?.bsPerUsd);

	const handleDelete = async (id: string, name: string) => {
		if (!confirm(`¿Eliminar el concepto "${name}"?`)) return;
		try {
			await del.mutateAsync(id);
			toast.success("Concepto eliminado");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		}
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Conceptos de cobro</CardTitle>
				<Button size="sm" onClick={() => setSheetOpen(true)}>
					<IconPlus className="h-4 w-4" /> Nuevo
				</Button>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col divide-y">
					{concepts?.length === 0 && (
						<p className="py-6 text-sm text-muted-foreground">
							Todavía no hay conceptos. Cree el primero para que los ciudadanos puedan pagar contra él.
						</p>
					)}
					{concepts?.map((c) => (
						<div
							key={c.id}
							className="flex items-center justify-between gap-3 py-3"
						>
							<div>
								<div className="flex items-center gap-2">
									<p className="font-medium">{c.name}</p>
									{!c.isActive && <Badge variant="secondary">Inactivo</Badge>}
								</div>
								<p className="text-xs text-muted-foreground">
									{catName(c.categoryId)}
									{c.defaultUsdCents != null && (
										<>
											{" · Sugerido: "}
											{formatUsd(c.defaultUsdCents)}
											{rate?.bsPerUsd
												? ` ≈ ${formatBs(suggestedBsCents(c.defaultUsdCents))} (tasa hoy)`
												: ""}
										</>
									)}
								</p>
							</div>
							<Button
								size="icon"
								variant="ghost"
								onClick={() => handleDelete(c.id, c.name)}
								disabled={del.isPending}
							>
								<IconTrash className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			</CardContent>

			<ConceptCreateSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				categories={categories ?? []}
			/>
		</Card>
	);
}

interface ConceptCreateSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	categories: { id: string; name: string; key: string }[];
}

function ConceptCreateSheet({
	open,
	onOpenChange,
	categories,
}: ConceptCreateSheetProps) {
	const create = useCreateConcept();
	const [key, setKey] = useState("");
	const [name, setName] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [description, setDescription] = useState("");
	const [defaultBs, setDefaultBs] = useState("");
	const [defaultUsd, setDefaultUsd] = useState("");

	const reset = () => {
		setKey("");
		setName("");
		setCategoryId("");
		setDescription("");
		setDefaultBs("");
		setDefaultUsd("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await create.mutateAsync({
				key,
				name,
				categoryId,
				description: description || null,
				defaultAmountBs: defaultBs || null,
				defaultAmountUsd: defaultUsd || null,
				isActive: true,
			});
			toast.success("Concepto creado");
			reset();
			onOpenChange(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al crear");
		}
	};

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title="Nuevo concepto"
			description="Ejemplo: Cuota Enero 2026, Reparación portón."
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4 px-1">
				<div className="flex flex-col gap-1">
					<Label htmlFor="key">Clave (solo minúsculas y guión bajo)</Label>
					<Input
						id="key"
						value={key}
						onChange={(e) => setKey(e.target.value.toLowerCase())}
						placeholder="cuota_enero_2026"
						required
					/>
				</div>
				<div className="flex flex-col gap-1">
					<Label htmlFor="name">Nombre</Label>
					<Input
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Cuota Enero 2026"
						required
					/>
				</div>
				<div className="flex flex-col gap-1">
					<Label>Categoría</Label>
					<Select value={categoryId} onValueChange={setCategoryId}>
						<SelectTrigger>
							<SelectValue placeholder="Elegí una categoría" />
						</SelectTrigger>
						<SelectContent>
							{categories.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-1">
						<Label htmlFor="db">Monto sugerido Bs (opcional)</Label>
						<Input
							id="db"
							inputMode="decimal"
							value={defaultBs}
							onChange={(e) => setDefaultBs(e.target.value)}
							placeholder="1500.00"
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label htmlFor="du">Monto sugerido USD (opcional)</Label>
						<Input
							id="du"
							inputMode="decimal"
							value={defaultUsd}
							onChange={(e) => setDefaultUsd(e.target.value)}
							placeholder="50.00"
						/>
					</div>
				</div>
				<div className="flex flex-col gap-1">
					<Label htmlFor="d">Descripción (opcional)</Label>
					<Textarea
						id="d"
						rows={2}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
				<div className="flex justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="ghost"
						onClick={() => onOpenChange(false)}
					>
						Cancelar
					</Button>
					<Button
						type="submit"
						disabled={
							create.isPending || !key.trim() || !name.trim() || !categoryId
						}
					>
						Crear
					</Button>
				</div>
			</form>
		</DataSheet>
	);
}
