import { createFileRoute } from "@tanstack/react-router";
import { Building2, Home, MapIcon } from "lucide-react";
import { housesConfig } from "@/entities/houses/model/config";
import { useStatsOverview } from "@/entities/stats";
import { HouseTable } from "@/features/house-managment/ui/house-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Skeleton } from "@/shared/ui/skeleton";
import { SectionHeader } from "@/widgets/section-header/ui/section-header";

export const Route = createFileRoute("/_authenticated/houses")({
	component: RouteComponent,
	staticData: {
		breadcrumb: housesConfig.entityName,
	},
});

function RouteComponent() {
	const { data: stats, isLoading } = useStatsOverview();

	return (
		<ProtectedRoute module="houses">
			<SectionHeader
				name={housesConfig.entityName}
				description={housesConfig.description}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card className="border border-blue-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Viviendas</CardTitle>
						<div className="rounded-md p-1.5 bg-blue-500/10">
							<Home className="size-3.5 text-blue-500" />
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						{isLoading ? <Skeleton className="h-8 w-16" /> : (
							<p className="text-3xl font-bold tracking-tight">
								{(stats?.census.totals.houses ?? 0).toLocaleString("es-VE")}
							</p>
						)}
					</CardContent>
				</Card>
				<Card className="border border-emerald-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sectores</CardTitle>
						<div className="rounded-md p-1.5 bg-emerald-500/10">
							<MapIcon className="size-3.5 text-emerald-500" />
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						{isLoading ? <Skeleton className="h-8 w-16" /> : (
							<p className="text-3xl font-bold tracking-tight">
								{(stats?.census.bySector?.length ?? 0).toLocaleString("es-VE")}
							</p>
						)}
					</CardContent>
				</Card>
				<Card className="border border-amber-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Familias</CardTitle>
						<div className="rounded-md p-1.5 bg-amber-500/10">
							<Building2 className="size-3.5 text-amber-500" />
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						{isLoading ? <Skeleton className="h-8 w-16" /> : (
							<p className="text-3xl font-bold tracking-tight">
								{(stats?.census.totals.families ?? 0).toLocaleString("es-VE")}
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			<HouseTable />
		</ProtectedRoute>
	);
}
