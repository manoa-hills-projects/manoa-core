import { createFileRoute } from "@tanstack/react-router";
import { Home, Users, UserCheck } from "lucide-react";
import { useStatsOverview } from "@/entities/stats";
import { FamilyTable } from "@/features/family-managment";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Skeleton } from "@/shared/ui/skeleton";

export const Route = createFileRoute("/_authenticated/families")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Familias",
	},
});

function RouteComponent() {
	const { data: stats, isLoading } = useStatsOverview();

	return (
		<ProtectedRoute module="families">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Familias</h1>
					<p className="text-muted-foreground">
						Administración de las familias registradas y hogares.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card className="border border-violet-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Familias</CardTitle>
						<div className="rounded-md p-1.5 bg-violet-500/10">
							<Users className="size-3.5 text-violet-500" />
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
				<Card className="border border-emerald-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Jefes de Hogar</CardTitle>
						<div className="rounded-md p-1.5 bg-emerald-500/10">
							<UserCheck className="size-3.5 text-emerald-500" />
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						{isLoading ? <Skeleton className="h-8 w-16" /> : (
							<p className="text-3xl font-bold tracking-tight">
								{(stats?.census.composition.heads ?? 0).toLocaleString("es-VE")}
							</p>
						)}
					</CardContent>
				</Card>
				<Card className="border border-amber-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Viviendas</CardTitle>
						<div className="rounded-md p-1.5 bg-amber-500/10">
							<Home className="size-3.5 text-amber-500" />
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
			</div>

			<FamilyTable />
		</ProtectedRoute>
	);
}
