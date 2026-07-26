import { createFileRoute } from "@tanstack/react-router";
import { ClockIcon, FileTextIcon, History, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useStatsOverview } from "@/entities/stats";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Skeleton } from "@/shared/ui/skeleton";
import { RequestFormDialog } from "@/features/requests-managment/ui/request-form-dialog";
import { RequestHistoryTable } from "@/features/requests-managment/ui/request-history-table";
import { RequestTypeCard } from "@/features/requests-managment/ui/request-type-card";

export const Route = createFileRoute("/_authenticated/requests/")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Solicitudes",
	},
});

function RouteComponent() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const { canManage } = usePermissions();
	const { data: stats, isLoading } = useStatsOverview();

	return (
		<ProtectedRoute>
			<div className="flex flex-col gap-6">
				{/* ═══ HEADER ═══ */}
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Solicitudes</h1>
					<p className="text-muted-foreground">
						Solicita documentos oficiales del consejo comunal.
					</p>
				</div>

				{/* ═══ STATS ═══ */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Card className="border border-blue-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</CardTitle>
							<div className="rounded-md p-1.5 bg-blue-500/10">
								<FileTextIcon className="size-3.5 text-blue-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{isLoading ? <Skeleton className="h-8 w-16" /> : (
								<p className="text-3xl font-bold tracking-tight">{(stats?.requests.total ?? 0).toLocaleString("es-VE")}</p>
							)}
						</CardContent>
					</Card>
					<Card className="border border-amber-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pendientes</CardTitle>
							<div className="rounded-md p-1.5 bg-amber-500/10">
								<ClockIcon className="size-3.5 text-amber-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{isLoading ? <Skeleton className="h-8 w-16" /> : (
								<p className="text-3xl font-bold tracking-tight">
									{stats?.requests.byStatus?.filter((s) => s.status !== "completed").reduce((a, b) => a + b.count, 0).toLocaleString("es-VE") ?? 0}
								</p>
							)}
						</CardContent>
					</Card>
					<Card className="border border-emerald-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completadas</CardTitle>
							<div className="rounded-md p-1.5 bg-emerald-500/10">
								<ShieldCheck className="size-3.5 text-emerald-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{isLoading ? <Skeleton className="h-8 w-16" /> : (
								<p className="text-3xl font-bold tracking-tight">
									{stats?.requests.byStatus?.find((s) => s.status === "completed")?.count.toLocaleString("es-VE") ?? 0}
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* ═══ ZONA 1/2: Solicitar documento ═══ */}
				<Card>
					<CardHeader>
						<CardTitle>Generar nueva solicitud</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							<RequestTypeCard
								title="Carta de Residencia"
								description="Solicita una constancia oficial de residencia emitida por el Consejo Comunal. Válida por 90 días."
								icon={<FileText className="h-6 w-6" />}
								onClick={() => setDialogOpen(true)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* ═══ ZONA 1/2: Mi historial ═══ */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<History className="h-4 w-4 text-muted-foreground" />
							<CardTitle>Mis solicitudes</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<RequestHistoryTable mine />
					</CardContent>
				</Card>

				{/* ═══ ZONA 3: Admin gestiona (solo canManage) ═══ */}
				{canManage("requests") && (
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<ShieldCheck className="h-4 w-4 text-muted-foreground" />
								<CardTitle>Gestión de solicitudes</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<RequestHistoryTable mine={false} />
						</CardContent>
					</Card>
				)}
			</div>

			<RequestFormDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
			/>
		</ProtectedRoute>
	);
}
