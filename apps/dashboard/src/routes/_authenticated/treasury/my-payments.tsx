import { IconPlus } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	formatBs,
	formatUsd,
	PAYMENT_STATUS_LABELS,
	type TreasuryPayment,
	useMyPayments,
} from "@/entities/treasury";
import { PaymentSubmitSheet } from "@/features/payment-submit";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ProtectedRoute } from "@/shared/ui/protected-route";

export const Route = createFileRoute("/_authenticated/treasury/my-payments")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Mis pagos",
	},
});

function RouteComponent() {
	const { data: payments, isLoading } = useMyPayments();
	const [sheetOpen, setSheetOpen] = useState(false);
	const [rejected, setRejected] = useState<TreasuryPayment | null>(null);

	const openNew = () => {
		setRejected(null);
		setSheetOpen(true);
	};
	const openResubmit = (p: TreasuryPayment) => {
		setRejected(p);
		setSheetOpen(true);
	};

	return (
		<ProtectedRoute>
			<div className="flex flex-col gap-6">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Mis pagos</h1>
						<p className="text-muted-foreground">
							Aportes que has enviado y su estado de revisión.
						</p>
					</div>
					<Button onClick={openNew}>
						<IconPlus className="h-4 w-4" /> Registrar pago
					</Button>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Historial</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading && (
							<p className="text-sm text-muted-foreground py-6">Cargando...</p>
						)}
						{!isLoading && payments?.length === 0 && (
							<p className="text-sm text-muted-foreground py-6">
								Todavía no has enviado pagos.
							</p>
						)}
						<div className="flex flex-col divide-y">
							{payments?.map((p) => (
								<div
									key={p.id}
									className="flex items-center justify-between gap-3 py-3"
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
											Enviado {new Date(p.submittedAt).toLocaleDateString("es-VE")}
										</p>
										{p.status === "rejected" && p.reviewNotes && (
											<p className="text-xs text-destructive mt-1">
												Motivo: {p.reviewNotes}
											</p>
										)}
									</div>
									<div className="flex items-center gap-3">
										<div className="text-right">
											<p className="font-medium">{formatUsd(p.amountUsdCents)}</p>
											<p className="text-xs text-muted-foreground">
												{formatBs(p.amountBsCents)}
											</p>
										</div>
										{p.status === "rejected" && (
											<Button
												size="sm"
												variant="secondary"
												onClick={() => openResubmit(p)}
											>
												Corregir
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			<PaymentSubmitSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				rejectedPayment={rejected}
			/>
		</ProtectedRoute>
	);
}
