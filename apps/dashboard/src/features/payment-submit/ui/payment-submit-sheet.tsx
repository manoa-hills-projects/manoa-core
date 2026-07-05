import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	bsCentsFromUsd,
	centsToDecimalString,
	type TreasuryPayment,
	useConcepts,
	useResubmitPayment,
	useSubmitPayment,
	useTodayRate,
} from "@/entities/treasury";
import { Button } from "@/shared/ui/button";
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

interface PaymentSubmitSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Si se pasa un pago rechazado, la sheet actúa como "reenvío". */
	rejectedPayment?: TreasuryPayment | null;
}

export function PaymentSubmitSheet({
	open,
	onOpenChange,
	rejectedPayment,
}: PaymentSubmitSheetProps) {
	const isResubmit = !!rejectedPayment;
	const { data: rate } = useTodayRate();
	const { data: concepts, isLoading: isConceptsLoading } = useConcepts(true);
	const submit = useSubmitPayment();
	const resubmit = useResubmitPayment();

	const [conceptId, setConceptId] = useState<string>("");
	const [amountBs, setAmountBs] = useState<string>("");
	const [amountUsd, setAmountUsd] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [receipt, setReceipt] = useState<File | null>(null);

	useEffect(() => {
		if (!open) return;
		setConceptId(rejectedPayment?.conceptId ?? "");
		setAmountBs(centsToDecimalString(rejectedPayment?.amountBsCents));
		setAmountUsd(centsToDecimalString(rejectedPayment?.amountUsdCents));
		setDescription(rejectedPayment?.description ?? "");
		setReceipt(null);
	}, [open, rejectedPayment]);

	const selectedConcept = concepts?.find((c) => c.id === conceptId);

	/**
	 * Cuando el USD cambia (por selección de concepto o edición manual),
	 * recomputamos el Bs contra la tasa vigente. Así lo que el ciudadano
	 * ve corresponde a la tasa actual, no a la de cuando se creó el concepto.
	 */
	const setUsdAndRecalcBs = (usd: string) => {
		setAmountUsd(usd);
		if (!rate?.bsPerUsd) return;
		const usdNum = Number.parseFloat(usd.replace(",", "."));
		if (!Number.isFinite(usdNum) || usdNum <= 0) return;
		const bsCents = bsCentsFromUsd(Math.round(usdNum * 100), rate.bsPerUsd);
		if (bsCents != null) setAmountBs(centsToDecimalString(bsCents));
	};

	const applyConceptDefaults = (id: string) => {
		setConceptId(id);
		const c = concepts?.find((x) => x.id === id);
		if (!c) return;
		// USD es canonical: si el concepto lo tiene, lo cargamos y recomputamos Bs.
		if (c.defaultUsdCents != null) {
			setUsdAndRecalcBs(centsToDecimalString(c.defaultUsdCents));
		} else if (c.defaultBsCents != null && !amountBs) {
			// Legacy: concepto solo tiene Bs. Lo cargamos tal cual.
			setAmountBs(centsToDecimalString(c.defaultBsCents));
		}
	};

	const canSubmit =
		amountBs.trim() !== "" &&
		amountUsd.trim() !== "" &&
		(isResubmit || receipt !== null);

	const isPending = submit.isPending || resubmit.isPending;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!rate) {
			toast.error("No hay tasa Bs/USD publicada para hoy. Contacte al tesorero.");
			return;
		}
		try {
			if (isResubmit && rejectedPayment) {
				await resubmit.mutateAsync({
					id: rejectedPayment.id,
					conceptId: conceptId || null,
					description: description || null,
					amountBs,
					amountUsd,
					...(receipt ? { receipt } : {}),
				});
				toast.success("Pago reenviado. Queda pendiente de revisión.");
			} else if (receipt) {
				await submit.mutateAsync({
					conceptId: conceptId || null,
					description: description || null,
					amountBs,
					amountUsd,
					receipt,
				});
				toast.success("Pago enviado. Queda pendiente de revisión.");
			}
			onOpenChange(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al enviar el pago");
		}
	};

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isResubmit ? "Reenviar pago corregido" : "Registrar pago"}
			description={
				isResubmit
					? "Corrija los datos y adjunte un comprobante nuevo si es necesario."
					: "Adjunte el comprobante y elija el concepto del pago."
			}
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4 px-1">
				<div className="flex flex-col gap-1">
					<Label>Concepto</Label>
					<Select
						value={conceptId}
						onValueChange={applyConceptDefaults}
						disabled={isConceptsLoading}
					>
						<SelectTrigger>
							<SelectValue placeholder="Elegí un concepto..." />
						</SelectTrigger>
						<SelectContent>
							{concepts?.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{selectedConcept?.description && (
						<p className="text-xs text-muted-foreground">
							{selectedConcept.description}
						</p>
					)}
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-1">
						<Label htmlFor="amountBs">Monto Bs</Label>
						<Input
							id="amountBs"
							inputMode="decimal"
							placeholder="1500.00"
							value={amountBs}
							onChange={(e) => setAmountBs(e.target.value)}
							required
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label htmlFor="amountUsd">Monto USD</Label>
						<Input
							id="amountUsd"
							inputMode="decimal"
							placeholder="50.00"
							value={amountUsd}
							onChange={(e) => setUsdAndRecalcBs(e.target.value)}
							required
						/>
					</div>
				</div>

				{rate && (
					<p className="text-xs text-muted-foreground">
						Tasa del día: 1 USD = Bs {rate.bsPerUsd}
					</p>
				)}
				{!rate && (
					<p className="text-xs text-destructive">
						No hay tasa publicada para hoy. El tesorero debe publicarla antes de aceptar pagos.
					</p>
				)}

				<div className="flex flex-col gap-1">
					<Label htmlFor="description">Descripción (opcional)</Label>
					<Textarea
						id="description"
						rows={2}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Referencia bancaria, últimos dígitos, etc."
					/>
				</div>

				<ReceiptUploader
					value={receipt}
					onChange={setReceipt}
					label={isResubmit ? "Nuevo comprobante (opcional)" : "Comprobante"}
				/>

				<div className="flex justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="ghost"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancelar
					</Button>
					<Button type="submit" disabled={!canSubmit || !rate || isPending}>
						{isResubmit ? "Reenviar pago" : "Enviar pago"}
					</Button>
				</div>
			</form>
		</DataSheet>
	);
}
