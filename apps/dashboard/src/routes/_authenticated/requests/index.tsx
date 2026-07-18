import { createFileRoute } from "@tanstack/react-router";
import { FileText, History, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ProtectedRoute } from "@/shared/ui/protected-route";
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
