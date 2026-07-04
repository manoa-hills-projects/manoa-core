import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	formatBs,
	formatUsd,
	useCategories,
	useCreateExpense,
	useExpenses,
} from "@/entities/treasury";
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
import { ReceiptUploader } from "@/features/receipt-uploader";

export function ExpenseRegister() {
	const { data: expenses } = useExpenses({ page: 1, limit: 50 });
	const { data: categories } = useCategories();
	const [sheetOpen, setSheetOpen] = useState(false);

	const catName = (id: string) =>
		categories?.find((c) => c.id === id)?.name ?? "—";

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Egresos</CardTitle>
				<Button size="sm" onClick={() => setSheetOpen(true)}>
					<IconPlus className="h-4 w-4" /> Registrar
				</Button>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col divide-y">
					{expenses?.data.length === 0 && (
						<p className="py-6 text-sm text-muted-foreground">
							No hay egresos registrados aún.
						</p>
					)}
					{expenses?.data.map((e) => (
						<div key={e.id} className="flex items-center justify-between gap-3 py-3">
							<div>
								<p className="font-medium">{e.description}</p>
								<p className="text-xs text-muted-foreground">
									{catName(e.categoryId)} · {new Date(e.spentAt).toLocaleDateString("es-VE")}
									{e.beneficiary ? ` · ${e.beneficiary}` : ""}
								</p>
							</div>
							<div className="text-right">
								<p className="font-medium">{formatUsd(e.amountUsdCents)}</p>
								<p className="text-xs text-muted-foreground">
									{formatBs(e.amountBsCents)}
								</p>
							</div>
						</div>
					))}
				</div>
			</CardContent>

			<ExpenseCreateSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				categories={categories?.filter((c) => c.kind !== "income") ?? []}
			/>
		</Card>
	);
}

interface ExpenseCreateSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	categories: { id: string; name: string }[];
}

function ExpenseCreateSheet({
	open,
	onOpenChange,
	categories,
}: ExpenseCreateSheetProps) {
	const create = useCreateExpense();
	const [categoryId, setCategoryId] = useState("");
	const [description, setDescription] = useState("");
	const [beneficiary, setBeneficiary] = useState("");
	const [amountBs, setAmountBs] = useState("");
	const [amountUsd, setAmountUsd] = useState("");
	const [spentAt, setSpentAt] = useState("");
	const [receipt, setReceipt] = useState<File | null>(null);

	const reset = () => {
		setCategoryId("");
		setDescription("");
		setBeneficiary("");
		setAmountBs("");
		setAmountUsd("");
		setSpentAt("");
		setReceipt(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await create.mutateAsync({
				categoryId,
				description,
				beneficiary: beneficiary || null,
				amountBs,
				amountUsd,
				spentAt: spentAt || undefined,
				receipt: receipt ?? undefined,
			});
			toast.success("Egreso registrado");
			reset();
			onOpenChange(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al registrar");
		}
	};

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title="Registrar egreso"
			description="Adjunte factura/comprobante cuando lo tenga."
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4 px-1">
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
				<div className="flex flex-col gap-1">
					<Label htmlFor="desc">Descripción</Label>
					<Textarea
						id="desc"
						rows={2}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Ej: Compra de pintura para portón"
						required
					/>
				</div>
				<div className="flex flex-col gap-1">
					<Label htmlFor="ben">Beneficiario (opcional)</Label>
					<Input
						id="ben"
						value={beneficiary}
						onChange={(e) => setBeneficiary(e.target.value)}
						placeholder="Ferretería Manoa"
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-1">
						<Label htmlFor="ab">Monto Bs</Label>
						<Input
							id="ab"
							inputMode="decimal"
							value={amountBs}
							onChange={(e) => setAmountBs(e.target.value)}
							required
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label htmlFor="au">Monto USD</Label>
						<Input
							id="au"
							inputMode="decimal"
							value={amountUsd}
							onChange={(e) => setAmountUsd(e.target.value)}
							required
						/>
					</div>
				</div>
				<div className="flex flex-col gap-1">
					<Label htmlFor="sa">Fecha del gasto</Label>
					<Input
						id="sa"
						type="date"
						value={spentAt}
						onChange={(e) => setSpentAt(e.target.value)}
					/>
				</div>
				<ReceiptUploader
					value={receipt}
					onChange={setReceipt}
					label="Factura / comprobante (opcional)"
				/>
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
							create.isPending ||
							!categoryId ||
							!description.trim() ||
							!amountBs.trim() ||
							!amountUsd.trim()
						}
					>
						Registrar
					</Button>
				</div>
			</form>
		</DataSheet>
	);
}
