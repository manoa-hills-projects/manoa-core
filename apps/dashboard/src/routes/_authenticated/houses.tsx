import { createFileRoute } from "@tanstack/react-router";
import { housesConfig } from "@/entities/houses/model/config";
import { HouseTable } from "@/features/house-managment/ui/house-table";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { SectionHeader } from "@/widgets/section-header/ui/section-header";

export const Route = createFileRoute("/_authenticated/houses")({
	component: RouteComponent,
	staticData: {
		breadcrumb: housesConfig.entityName,
	},
});

function RouteComponent() {
	return (
		<ProtectedRoute permissions={{ census: ["read"] }}>
			<SectionHeader
				name={housesConfig.entityName}
				description={housesConfig.description}
			/>
			<HouseTable />
		</ProtectedRoute>
	);
}
