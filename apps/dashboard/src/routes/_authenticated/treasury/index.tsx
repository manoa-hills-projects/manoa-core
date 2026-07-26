import { BanknoteIcon, DollarSignIcon, HandCoinsIcon, PlusIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ConceptManagement } from "@/features/concept-management";
import { ExchangeRateForm } from "@/features/exchange-rate-set";
import { ExpenseRegister } from "@/features/expense-register";
import {
	formatBs,
	formatUsd,
	PAYMENT_STATUS_LABELS,
	type TreasuryPayment,
	useMyPayments,
	useTodayRate,
} from "@/entities/treasury";
import { PaymentSubmitSheet } from "@/features/payment-submit";
import { usePermissions } from "@/hooks/use-permissions";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DataTable } from "@/shared/ui/data-table";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useTableFilters } from "@/shared/hooks/use-table-filters";
import { PaymentsInbox } from "@/widgets/payments-inbox";

export const Route = createFileRoute("/_authenticated/treasury/")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Tesorería",
	},
});

function RouteComponent() {
	const { canManage } = usePermissions();
	const isTreasurer = canManage("treasury");

	// ── Mis pagos ──
	const filters = useTableFilters();
	const { data: myPaymentsRes, isLoading: loadingPayments } = useMyPayments(
		filters.pagination.pageIndex + 1,
		filters.pagination.pageSize,
	);
	const { data: rate } = useTodayRate();
	const [sheetOpen, setSheetOpen] = useState(false);
	const [rejected, setRejected] = useState<TreasuryPayment | null>(null);

	const myPayments = myPaymentsRes?.data ?? [];
	const totalPayments = myPaymentsRes?.total ?? 0;
	const pendingCount = myPayments?.filter((p) => p.status === "pending").length ?? 0;

	return (
		<ProtectedRoute>
			<div className="flex flex-col gap-6">
				{/* HEADER */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Tesorería</h1>
						<p className="text-muted-foreground">
							Transparencia de ingresos y egresos del consejo comunal.
						</p>
					</div>
				</div>

				{/* STATS CARDS */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Card className="border border-emerald-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mis Pagos</CardTitle>
							<div className="rounded-md p-1.5 bg-emerald-500/10">
								<HandCoinsIcon className="size-3.5 text-emerald-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							<p className="text-3xl font-bold tracking-tight">{totalPayments}</p>
							<p className="text-xs text-muted-foreground mt-1">{pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}</p>
						</CardContent>
					</Card>
					<Card className="border border-blue-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tasa BCV</CardTitle>
							<div className="rounded-md p-1.5 bg-blue-500/10">
								<DollarSignIcon className="size-3.5 text-blue-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{rate ? (
								<>
									<p className="text-3xl font-bold tracking-tight">Bs {rate.bsPerUsd}</p>
									<p className="text-xs text-muted-foreground mt-1">por $1</p>
								</>
							) : (
								<p className="text-sm text-muted-foreground">Sin tasa hoy</p>
							)}
						</CardContent>
					</Card>
					<Card className="border border-amber-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gestión</CardTitle>
							<div className="rounded-md p-1.5 bg-amber-500/10">
								<BanknoteIcon className="size-3.5 text-amber-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							<p className="text-sm text-muted-foreground">
								{isTreasurer ? "Tesorero · Acceso completo" : "Solo tus pagos"}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* MIS PAGOS (ciudadano) */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Mis pagos</CardTitle>
							<Button size="sm" onClick={() => { setRejected(null); setSheetOpen(true); }}>
								<PlusIcon className="h-4 w-4 mr-1" /> Registrar pago
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={paymentColumns({ onResubmit: (p) => { setRejected(p); setSheetOpen(true); } })}
							data={myPayments}
							rowCount={totalPayments}
							pagination={filters.pagination}
							onPaginationChange={filters.setPagination}
							isLoading={loadingPayments}
						/>
					</CardContent>
				</Card>

				{/* ZONA ADMIN (tesorero) */}
				{isTreasurer && (
					<Card>
						<CardHeader>
							<CardTitle>Panel del tesorero</CardTitle>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="inbox">
								<TabsList className="mb-4">
									<TabsTrigger value="inbox">Bandeja</TabsTrigger>
									<TabsTrigger value="concepts">Conceptos</TabsTrigger>
									<TabsTrigger value="expenses">Egresos</TabsTrigger>
									<TabsTrigger value="rate">Tasa</TabsTrigger>
								</TabsList>
								<TabsContent value="inbox"><PaymentsInbox /></TabsContent>
								<TabsContent value="concepts"><ConceptManagement /></TabsContent>
								<TabsContent value="expenses"><ExpenseRegister /></TabsContent>
								<TabsContent value="rate"><ExchangeRateForm /></TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				)}
			</div>

			<PaymentSubmitSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				rejectedPayment={rejected}
			/>
		</ProtectedRoute>
	);
}


// ── Columnas para la tabla de pagos ──

function paymentColumns({ onResubmit }: { onResubmit: (p: TreasuryPayment) => void }) {
	const cols: ColumnDef<TreasuryPayment>[] = [
		{
			accessorKey: "description",
			header: "Concepto",
			cell: ({ row }) => (
				<div>
					<p className="font-medium">{row.original.description || "Pago sin descripción"}</p>
					{row.original.status === "rejected" && row.original.reviewNotes && (
						<p className="text-xs text-destructive mt-0.5">Motivo: {row.original.reviewNotes}</p>
					)}
				</div>
			),
		},
		{
			id: "amount",
			header: "Monto",
			cell: ({ row }) => (
				<div className="text-right">
					<p className="font-medium">{formatUsd(row.original.amountUsdCents)}</p>
					<p className="text-xs text-muted-foreground">{formatBs(row.original.amountBsCents)}</p>
				</div>
			),
		},
		{
			id: "date",
			accessorKey: "submittedAt",
			header: "Fecha",
			cell: ({ row }) => new Date(row.original.submittedAt).toLocaleDateString("es-VE"),
		},
		{
			id: "status",
			accessorKey: "status",
			header: "Estado",
			cell: ({ row }) => (
				<Badge variant={row.original.status === "approved" ? "default" : row.original.status === "rejected" ? "destructive" : "secondary"}>
					{PAYMENT_STATUS_LABELS[row.original.status]}
				</Badge>
			),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) =>
				row.original.status === "rejected" ? (
					<Button size="sm" variant="secondary" onClick={() => onResubmit(row.original)}>
						Corregir
					</Button>
				) : null,
		},
	];

	return cols;
}
