import { createFileRoute, Link } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import { RequestHistoryTable } from "@/features/requests-managment/ui/request-history-table";
import { Button } from "@/shared/ui/button";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { SectionHeader } from "@/widgets/section-header/ui/section-header";

export const Route = createFileRoute("/_authenticated/requests/admin")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Administrar Solicitudes",
	},
});

function RouteComponent() {
	return (
		<ProtectedRoute permissions={{ requests: ["approve"] }}>
			<div className="space-y-6">
				<div className="flex items-start justify-between gap-4">
					<SectionHeader
						name="Administración de Solicitudes"
						description="Revisa, aprueba o rechaza las solicitudes de documentos enviadas por los ciudadanos."
					/>
					<Button variant="outline" size="sm" asChild>
						<Link to="/requests/signatories">
							<PenLine className="mr-2 h-4 w-4" />
							Gestionar Firmantes
						</Link>
					</Button>
				</div>
				<RequestHistoryTable mine={false} />
			</div>
		</ProtectedRoute>
	);
}
