import { createFileRoute } from "@tanstack/react-router";
import { HomeIcon, UserIcon, UsersIcon } from "lucide-react";
import { useStatsOverview } from "@/entities/stats";
import { CitizenTable } from "@/features/citizen-managment";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Skeleton } from "@/shared/ui/skeleton";

export const Route = createFileRoute("/_authenticated/citizens")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Ciudadanos",
	},
});

const CITIZEN_STATS = [
	{
		key: "citizens" as const,
		label: "Habitantes",
		icon: UserIcon,
		color: "text-emerald-500",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
	},
	{
		key: "heads" as const,
		label: "Jefes de Hogar",
		icon: HomeIcon,
		color: "text-blue-500",
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
	},
	{
		key: "members" as const,
		label: "Miembros",
		icon: UsersIcon,
		color: "text-violet-500",
		bg: "bg-violet-500/10",
		border: "border-violet-500/20",
	},
] as const;

function RouteComponent() {
	const { data: stats, isLoading } = useStatsOverview();

	const statValues: Record<string, number | undefined> = {
		citizens: stats?.census.totals.citizens,
		heads: stats?.census.composition.heads,
		members: stats?.census.composition.members,
	};

	return (
		<ProtectedRoute module="citizens">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Ciudadanos</h1>
					<p className="text-muted-foreground">
						Gestión del censo de ciudadanos y habitantes.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{CITIZEN_STATS.map(({ key, label, icon: Icon, color, bg, border }) => (
					<Card key={key} className={`border ${border}`}>
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								{label}
							</CardTitle>
							<div className={`rounded-md p-1.5 ${bg}`}>
								<Icon className={`size-3.5 ${color}`} />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								<p className="text-3xl font-bold tracking-tight">
									{(statValues[key] ?? 0).toLocaleString("es-VE")}
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<CitizenTable />
		</ProtectedRoute>
	);
}
