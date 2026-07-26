import { createFileRoute } from "@tanstack/react-router";
import { VoteIcon, LockIcon, CheckCheckIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useStatsOverview } from "@/entities/stats";
import { PollList } from "@/widgets/poll-list/ui/poll-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Skeleton } from "@/shared/ui/skeleton";

export const Route = createFileRoute("/_authenticated/polls")({
	component: PollsPage,
});

function PollsPage() {
	const { data: stats, isLoading } = useStatsOverview();
	const [listKey, setListKey] = useState(0);

	const total = stats?.polls?.total ?? 0;
	const open = stats?.polls?.open ?? 0;
	const closed = stats?.polls?.closed ?? 0;

	return (
		<ProtectedRoute>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Votaciones</h1>
					<p className="text-muted-foreground">
						Propuestas y proyectos de la comunidad. Vote a favor o en contra y
						consulte los resultados.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card className="border border-violet-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</CardTitle>
						<div className="rounded-md p-1.5 bg-violet-500/10">
							<VoteIcon className="size-3.5 text-violet-500" />
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						{isLoading ? <Skeleton className="h-8 w-16" /> : (
							<p className="text-3xl font-bold tracking-tight">{total.toLocaleString("es-VE")}</p>
						)}
					</CardContent>
				</Card>
				<Card className="border border-emerald-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Activas</CardTitle>
						<div className="rounded-md p-1.5 bg-emerald-500/10">
							<CheckCheckIcon className="size-3.5 text-emerald-500" />
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						{isLoading ? <Skeleton className="h-8 w-16" /> : (
							<p className="text-3xl font-bold tracking-tight">{open.toLocaleString("es-VE")}</p>
						)}
					</CardContent>
				</Card>
				<Card className="border border-amber-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cerradas</CardTitle>
						<div className="rounded-md p-1.5 bg-amber-500/10">
							<LockIcon className="size-3.5 text-amber-500" />
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						{isLoading ? <Skeleton className="h-8 w-16" /> : (
							<p className="text-3xl font-bold tracking-tight">{closed.toLocaleString("es-VE")}</p>
						)}
					</CardContent>
				</Card>
			</div>

			<PollList key={listKey} onChange={() => setListKey((k) => k + 1)} />
		</ProtectedRoute>
	);
}
