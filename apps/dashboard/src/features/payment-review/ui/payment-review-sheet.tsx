import { useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import {
	formatBs,
	formatUsd,
	PAYMENT_STATUS_LABELS,
	receiptUrl,
	type TreasuryPayment,
	useReviewPayment,
} from "@/entities/treasury";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

interface PaymentReviewSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	payment: TreasuryPayment | null;
}

/**
 * URL absoluta del endpoint de comprobante. `receiptUrl` devuelve el path
 * relativo al prefix del ky client; para renderizar `<img src>` armamos
 * la URL completa a mano con `credentials: include` implícito porque el
 * navegador envía cookies same-site al mismo origin de la API.
 */
function absoluteReceiptUrl(key: string): string {
	const base = env.VITE_API_URL || "http://localhost:8787/api";
	return `${base.replace(/\/$/, "")}/${receiptUrl(key)}`;
}

export function PaymentReviewSheet({
	open,
	onOpenChange,
	payment,
}: PaymentReviewSheetProps) {
	const review = useReviewPayment();
	const [notes, setNotes] = useState("");

	if (!payment) return null;

	const isPending = payment.status === "pending";

	const handleAction = async (action: "approve" | "reject") => {
		if (action === "reject" && notes.trim().length < 3) {
			toast.error("El motivo de rechazo es obligatorio (mínimo 3 caracteres).");
			return;
		}
		try {
			await review.mutateAsync({
				id: payment.id,
				action,
				notes: notes.trim() || null,
			});
			toast.success(
				action === "approve" ? "Pago aprobado" : "Pago rechazado",
			);
			setNotes("");
			onOpenChange(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al revisar el pago");
		}
	};

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title="Revisar pago"
			description="Verifique el comprobante y los montos declarados."
		>
			<div className="flex flex-col gap-4 px-1">
				<div className="rounded-md border overflow-hidden">
					<img
						src={absoluteReceiptUrl(payment.receiptR2Key)}
						alt="Comprobante"
						className="w-full max-h-96 object-contain bg-muted"
					/>
				</div>

				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span className="text-muted-foreground">Monto Bs</span>
						<p className="font-medium">{formatBs(payment.amountBsCents)}</p>
					</div>
					<div>
						<span className="text-muted-foreground">Monto USD</span>
						<p className="font-medium">{formatUsd(payment.amountUsdCents)}</p>
					</div>
					<div>
						<span className="text-muted-foreground">Estado</span>
						<p>
							<Badge
								variant={
									payment.status === "approved"
										? "default"
										: payment.status === "rejected"
											? "destructive"
											: "secondary"
								}
							>
								{PAYMENT_STATUS_LABELS[payment.status]}
							</Badge>
						</p>
					</div>
					<div>
						<span className="text-muted-foreground">Enviado</span>
						<p className="text-xs">
							{new Date(payment.submittedAt).toLocaleString("es-VE")}
						</p>
					</div>
					{payment.description && (
						<div className="col-span-2">
							<span className="text-muted-foreground">Descripción</span>
							<p>{payment.description}</p>
						</div>
					)}
				</div>

				{isPending && (
					<>
						<div className="flex flex-col gap-1">
							<Label htmlFor="review-notes">Notas / motivo</Label>
							<Textarea
								id="review-notes"
								rows={3}
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Requerido si va a rechazar el pago."
							/>
						</div>

						<div className="flex justify-end gap-2">
							<Button
								variant="destructive"
								onClick={() => handleAction("reject")}
								disabled={review.isPending}
							>
								Rechazar
							</Button>
							<Button
								onClick={() => handleAction("approve")}
								disabled={review.isPending}
							>
								Aprobar
							</Button>
						</div>
					</>
				)}

				{!isPending && payment.reviewNotes && (
					<div className="rounded-md border bg-muted/40 p-3 text-sm">
						<span className="text-muted-foreground">Notas del revisor</span>
						<p>{payment.reviewNotes}</p>
					</div>
				)}
			</div>
		</DataSheet>
	);
}
