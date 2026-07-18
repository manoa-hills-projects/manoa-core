import { IconPlus } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ConceptManagement } from "@/features/concept-management";
import { ExchangeRateForm } from "@/features/exchange-rate-set";
import { ExpenseRegister } from "@/features/expense-register";
import {
	formatBs,
	formatUsd,
	PAYMENT_STATUS_LABELS,
	type TreasuryPayment,
	useMyPayments,
} from "@/entities/treasury";
import { PaymentSubmitSheet } from "@/features/payment-submit";
import { usePermissions } from "@/hooks/use-permissions";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { TransparencyPanel } from "@/widgets/transparency-panel";
import { PaymentsInbox } from "@/widgets/payments-inbox";

export const Route = createFileRoute("/_authenticated/treasury/")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Tesorería",
	},
});

type ManageTab = "inbox" | "concepts" | "expenses" | "rate";

function RouteComponent() {
	const { canManage } = usePermissions();

	// ── Mis pagos ──
	const { data: payments, isLoading: isLoadingPayments } = useMyPayments();
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

	// ── Gestión (tesorero) ──
	const [manageTab, setManageTab] = useState<ManageTab>("inbox");

	return (
		<ProtectedRoute>
			<div className="flex flex-col gap-6">
				{/* ═══ HEADER ═══ */}
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Tesorería</h1>
					<p className="text-muted-foreground">
						Transparencia de ingresos y egresos del consejo comunal.
					</p>
				</div>

				{/* ═══ ZONA 1: Todos los autenticados ═══ */}
				<Card>
					<CardHeader>
						<CardTitle>Resumen general</CardTitle>
					</CardHeader>
					<CardContent>
						<TransparencyPanel />
					</CardContent>
				</Card>

				{/* ═══ ZONA 2: Mis pagos (ownership) ═══ */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Mis pagos</CardTitle>
							<Button size="sm" onClick={openNew}>
								<IconPlus className="h-4 w-4 mr-1" /> Registrar pago
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{isLoadingPayments && (
							<p className="text-sm text-muted-foreground py-6">
								Cargando...
							</p>
						)}
						{!isLoadingPayments && payments?.length === 0 && (
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
											Enviado{" "}
											{new Date(p.submittedAt).toLocaleDateString("es-VE")}
										</p>
										{p.status === "rejected" && p.reviewNotes && (
											<p className="text-xs text-destructive mt-1">
												Motivo: {p.reviewNotes}
											</p>
										)}
									</div>
									<div className="flex items-center gap-3">
										<div className="text-right">
											<p className="font-medium">
												{formatUsd(p.amountUsdCents)}
											</p>
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

				{/* ═══ ZONA 3: Gestión (solo canManage) ═══ */}
				{canManage("treasury") && (
					<Card>
						<CardHeader>
							<CardTitle>Panel del tesorero</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-wrap gap-2 border-b pb-2">
								<TabButton
									current={manageTab}
									value="inbox"
									onClick={setManageTab}
								>
									Bandeja de pagos
								</TabButton>
								<TabButton
									current={manageTab}
									value="concepts"
									onClick={setManageTab}
								>
									Conceptos
								</TabButton>
								<TabButton
									current={manageTab}
									value="expenses"
									onClick={setManageTab}
								>
									Egresos
								</TabButton>
								<TabButton
									current={manageTab}
									value="rate"
									onClick={setManageTab}
								>
									Tasa del día
								</TabButton>
							</div>

							{manageTab === "inbox" && <PaymentsInbox />}
							{manageTab === "concepts" && <ConceptManagement />}
							{manageTab === "expenses" && <ExpenseRegister />}
							{manageTab === "rate" && <ExchangeRateForm />}
						</CardContent>
					</Card>
				)}
			</div>

			{/* Sheet para registrar/corregir pago */}
			<PaymentSubmitSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				rejectedPayment={rejected}
			/>
		</ProtectedRoute>
	);
}

interface TabButtonProps {
	current: ManageTab;
	value: ManageTab;
	onClick: (t: ManageTab) => void;
	children: React.ReactNode;
}

function TabButton({ current, value, onClick, children }: TabButtonProps) {
	const active = current === value;
	return (
		<Button
			variant={active ? "default" : "ghost"}
			size="sm"
			onClick={() => onClick(value)}
		>
			{children}
		</Button>
	);
}
