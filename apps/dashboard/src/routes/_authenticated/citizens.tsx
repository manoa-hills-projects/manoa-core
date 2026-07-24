import { createFileRoute } from "@tanstack/react-router";
import { HomeIcon, UserIcon, UsersIcon } from "lucide-react";
import { type StatsOverview, useStatsOverview } from "@/entities/stats";
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
		label: "Hombres",
		icon: UserIcon,
		value: (s: StatsOverview) => s.census.gender?.male ?? 0,
		color: "text-blue-500",
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
	},
	{
		label: "Mujeres",
		icon: UsersIcon,
		value: (s: StatsOverview) => s.census.gender?.female ?? 0,
		color: "text-rose-500",
		bg: "bg-rose-500/10",
		border: "border-rose-500/20",
	},
	{
		label: "Jefes de Hogar",
		icon: HomeIcon,
		value: (s: StatsOverview) => s.census.composition?.heads ?? 0,
		color: "text-emerald-500",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
	},
] as const;

function RouteComponent() {
	const { data: stats, isLoading } = useStatsOverview();
	const s = stats as StatsOverview | undefined;

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
				{CITIZEN_STATS.map(({ label, icon: Icon, value, color, bg, border }) => (
					<Card key={label} className={`border ${border}`}>
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								{label}
							</CardTitle>
							<div className={`rounded-md p-1.5 ${bg}`}>
								<Icon className={`size-3.5 ${color}`} />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{isLoading || !s ? (
								<Skeleton className="h-8 w-16" />
							) : (
								<p className="text-3xl font-bold tracking-tight">
									{value(s).toLocaleString("es-VE")}
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<div className="flex gap-4 text-sm text-muted-foreground">
				<span>👶 Menores: {(s?.census.age?.minors ?? 0).toLocaleString("es-VE")}</span>
				<span>🧑 Adultos: {(s?.census.age?.adults ?? 0).toLocaleString("es-VE")}</span>
			</div>

			<CitizenTable />
		</ProtectedRoute>
	);
}
