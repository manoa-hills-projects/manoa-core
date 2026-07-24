import { createFileRoute } from "@tanstack/react-router";
import { HeartPulseIcon, HomeIcon, UserIcon } from "lucide-react";
import { useCitizenStats } from "@/entities/stats";
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

function RouteComponent() {
	const { data: stats, isLoading } = useCitizenStats();

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

			{/* Hombres + Mujeres combinado */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card className="border border-blue-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Población
						</CardTitle>
						<div className="rounded-md p-1.5 bg-blue-500/10">
							<UserIcon className="size-3.5 text-blue-500" />
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4 space-y-1">
						{isLoading || !stats ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<>
								<p className="text-3xl font-bold tracking-tight">
									{stats.total.toLocaleString("es-VE")}
								</p>
								<p className="text-xs text-muted-foreground">
									<span className="text-blue-500 font-medium">{stats.gender.male.toLocaleString("es-VE")}</span> hombres ·{" "}
									<span className="text-rose-500 font-medium">{stats.gender.female.toLocaleString("es-VE")}</span> mujeres
								</p>
							</>
						)}
					</CardContent>
				</Card>

				<Card className="border border-emerald-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Jefes de Hogar
						</CardTitle>
						<div className="rounded-md p-1.5 bg-emerald-500/10">
							<HomeIcon className="size-3.5 text-emerald-500" />
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						{isLoading || !stats ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<p className="text-3xl font-bold tracking-tight">
								{stats.headsOfHousehold.toLocaleString("es-VE")}
							</p>
						)}
					</CardContent>
				</Card>

				<Card className="border border-amber-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Discapacitados
						</CardTitle>
						<div className="rounded-md p-1.5 bg-amber-500/10">
							<HeartPulseIcon className="size-3.5 text-amber-500" />
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						{isLoading || !stats ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<p className="text-3xl font-bold tracking-tight">
								{stats.disabilities.total.toLocaleString("es-VE")}
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			<CitizenTable />
		</ProtectedRoute>
	);
}
