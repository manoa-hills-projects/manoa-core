import { createFileRoute } from "@tanstack/react-router";
import { HouseTable } from "@/widgets/house-table/ui/house-table";

export const Route = createFileRoute("/_authenticated/houses")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Viviendas",
	},
});

function RouteComponent() {
	return (
		<>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Viviendas</h1>
					<p className="text-muted-foreground">
						Gestión de ubicación y sectores del censo.
					</p>
				</div>
			</div>

			<HouseTable />
		</>
	);
}
