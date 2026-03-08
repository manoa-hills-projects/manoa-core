import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { FamilyTable } from "@/features/family-managment";

export const Route = createFileRoute("/_authenticated/families")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Familias",
	},
});

function RouteComponent() {
	return (
		<ProtectedRoute permissions={{ census: ["read"] }}>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Familias</h1>
					<p className="text-muted-foreground">
						Administración de las familias registradas y hogares.
					</p>
				</div>
			</div>

			<FamilyTable />
		</ProtectedRoute>
	);
}
