/**
 * Dashboard estadístico — movido desde / a /dashboard
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRightIcon,
	FileTextIcon,
	HomeIcon,
	MessageSquareIcon,
	SparklesIcon,
	UserIcon,
	UsersIcon,
	VoteIcon,
} from "lucide-react";
import { useStatsOverview } from "@/entities/stats";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
	HouseholdCompositionChart,
	RequestsStatusChart,
	RequestsTimelineChart,
	SectorDistributionChart,
} from "@/widgets/dashboard-charts";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: RouteComponent,
});

const STAT_CARDS = [
	{
		key: "houses" as const,
		label: "Viviendas",
		icon: HomeIcon,
		color: "text-blue-500",
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
	},
	{
		key: "families" as const,
		label: "Familias",
		icon: UsersIcon,
		color: "text-violet-500",
		bg: "bg-violet-500/10",
		border: "border-violet-500/20",
	},
	{
		key: "citizens" as const,
		label: "Habitantes",
		icon: UserIcon,
		color: "text-emerald-500",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
	},
	{
		key: "requests" as const,
		label: "Solicitudes",
		icon: FileTextIcon,
		color: "text-amber-500",
		bg: "bg-amber-500/10",
		border: "border-amber-500/20",
	},
	{
		key: "polls" as const,
		label: "Votaciones",
		icon: VoteIcon,
		color: "text-rose-500",
		bg: "bg-rose-500/10",
		border: "border-rose-500/20",
	},
];

function RouteComponent() {
	const { data: stats, isLoading } = useStatsOverview();
	const { data: session } = authClient.useSession();

	const QUICK_LINKS = [
		{ to: "/kiosko", label: "Volver al kiosko", icon: ArrowRightIcon },
		{ to: "/citizens", label: "Ciudadanos", icon: UserIcon },
		{ to: "/families", label: "Familias", icon: UsersIcon },
		{ to: "/houses", label: "Viviendas", icon: HomeIcon },
		{ to: "/requests", label: "Solicitudes", icon: FileTextIcon },
		{ to: "/polls", label: "Votaciones", icon: VoteIcon },
		{ to: "/ai-assistant", label: "Asistente IA", icon: SparklesIcon },
		{ to: "/messages", label: "Mensajes", icon: MessageSquareIcon },
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
					<p className="text-muted-foreground">
						Bienvenido{stats?.name ? `, ${stats.name}` : ""}
					</p>
				</div>
				<Button variant="outline" size="sm" asChild>
					<Link to="/">
						<ArrowRightIcon className="size-4 mr-1" />
						Volver al kiosko
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
				{STAT_CARDS.map((card) => (
					<Card key={card.key} className={`border ${card.border}`}>
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								{card.label}
							</CardTitle>
							<div className={`rounded-md p-1.5 ${card.bg}`}>
								<card.icon className={`size-3.5 ${card.color}`} />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								<p className="text-3xl font-bold tracking-tight">
									{stats?.[card.key] ?? "—"}
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Distribución por sector</CardTitle>
					</CardHeader>
					<CardContent>
						<SectorDistributionChart />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Composición familiar</CardTitle>
					</CardHeader>
					<CardContent>
						<HouseholdCompositionChart />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Estado de solicitudes</CardTitle>
					</CardHeader>
					<CardContent>
						<RequestsStatusChart />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Solicitudes por mes</CardTitle>
					</CardHeader>
					<CardContent>
						<RequestsTimelineChart />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
