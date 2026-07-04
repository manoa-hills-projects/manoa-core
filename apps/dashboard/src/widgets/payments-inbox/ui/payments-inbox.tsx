import { useState } from "react";
import {
	formatBs,
	formatUsd,
	PAYMENT_STATUS_LABELS,
	type PaymentStatus,
	type TreasuryPayment,
	usePayments,
} from "@/entities/treasury";
import { PaymentReviewSheet } from "@/features/payment-review";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";

export function PaymentsInbox() {
	const [status, setStatus] = useState<PaymentStatus | "all">("pending");
	const [page, setPage] = useState(1);
	const filters = {
		status: status === "all" ? undefined : status,
		page,
		limit: 20,
	};
	const { data } = usePayments(filters);

	const [selected, setSelected] = useState<TreasuryPayment | null>(null);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-3">
				<CardTitle>Bandeja de pagos</CardTitle>
				<Select
					value={status}
					onValueChange={(v) => {
						setStatus(v as PaymentStatus | "all");
						setPage(1);
					}}
				>
					<SelectTrigger className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="pending">Pendientes</SelectItem>
						<SelectItem value="approved">Aprobados</SelectItem>
						<SelectItem value="rejected">Rechazados</SelectItem>
						<SelectItem value="all">Todos</SelectItem>
					</SelectContent>
				</Select>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col divide-y">
					{data?.data.length === 0 && (
						<p className="py-6 text-sm text-muted-foreground">
							No hay pagos en este estado.
						</p>
					)}
					{data?.data.map((p) => (
						<button
							key={p.id}
							type="button"
							className="flex items-center justify-between gap-3 py-3 text-left hover:bg-muted/40 rounded px-1"
							onClick={() => setSelected(p)}
						>
							<div>
								<div className="flex items-center gap-2">
									<p className="font-medium">
										{p.description || "Pago sin descripción"}
									</p>
									<Badge
										variant={
											p.status === "approved"
												? "default"
												: p.status === "rejected"
													? "destructive"
													: "secondary"
										}
									>
										{PAYMENT_STATUS_LABELS[p.status]}
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground">
									{new Date(p.submittedAt).toLocaleString("es-VE")}
								</p>
							</div>
							<div className="text-right">
								<p className="font-medium">{formatUsd(p.amountUsdCents)}</p>
								<p className="text-xs text-muted-foreground">
									{formatBs(p.amountBsCents)}
								</p>
							</div>
						</button>
					))}
				</div>

				{data?.metadata && data.metadata.totalPages > 1 && (
					<div className="flex items-center justify-between mt-4 text-sm">
						<span className="text-muted-foreground">
							Página {data.metadata.page} de {data.metadata.totalPages}
						</span>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="ghost"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
							>
								Anterior
							</Button>
							<Button
								size="sm"
								variant="ghost"
								disabled={page >= data.metadata.totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								Siguiente
							</Button>
						</div>
					</div>
				)}
			</CardContent>

			<PaymentReviewSheet
				open={selected !== null}
				onOpenChange={(open) => !open && setSelected(null)}
				payment={selected}
			/>
		</Card>
	);
}
