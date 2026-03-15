import { createFileRoute } from "@tanstack/react-router";
import { LawsTable } from "@/features/laws";
import { ProtectedRoute } from "@/shared/ui/protected-route";

export const Route = createFileRoute("/_authenticated/laws")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Leyes",
	},
});

function RouteComponent() {
	return (
		<ProtectedRoute permissions={{ laws: ["read"] }}>
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Leyes del Poder Popular</h1>
					<p className="text-muted-foreground">
						Consulta las leyes y normativas del Poder Popular. Sincroniza para
						actualizar desde comunas.gob.ve.
					</p>
				</div>
				<LawsTable />
			</div>
		</ProtectedRoute>
	);
}
