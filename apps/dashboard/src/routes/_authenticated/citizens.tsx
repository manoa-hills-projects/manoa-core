import { createFileRoute } from "@tanstack/react-router";
import { CitizenTable } from "@/features/citizen-managment";
import { ProtectedRoute } from "@/shared/ui/protected-route";

export const Route = createFileRoute("/_authenticated/citizens")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Ciudadanos",
	},
});

function RouteComponent() {
	return (
		<ProtectedRoute permissions={{ census: ["read"] }}>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Ciudadanos</h1>
					<p className="text-muted-foreground">
						Gestión del censo de ciudadanos y habitantes.
					</p>
				</div>
			</div>

			<CitizenTable />
		</ProtectedRoute>
	);
}
