import { createFileRoute } from '@tanstack/react-router'
import { BookOpen, FileText, RefreshCw, ScrollText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLaws } from "@/entities/laws";
import { LawsTable } from "@/features/laws";
import { usePermissions } from "@/hooks/use-permissions";
import { api } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ProtectedRoute } from "@/shared/ui/protected-route";

export const Route = createFileRoute("/_authenticated/laws")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Leyes",
	},
});

function RouteComponent() {
	const { canManage } = usePermissions();
	const [isScraping, setIsScraping] = useState(false);
	const { data: lawsResponse } = useLaws(
		{ pageIndex: 0, pageSize: 100 },
		{},
	);
	const laws = lawsResponse?.data ?? [];
	const conTexto = laws.filter((l) => l.full_text && l.full_text.length > 50).length;

	const handleScrape = async () => {
		setIsScraping(true);
		try {
			await api.post("laws/scrape").json();
			toast.success("Leyes sincronizadas correctamente");
		} catch {
			toast.error("Error al sincronizar leyes");
		} finally {
			setIsScraping(false);
		}
	};

	return (
		<ProtectedRoute>
			<div className="flex flex-col gap-6">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Leyes del Poder Popular</h1>
						<p className="text-muted-foreground">Consulta las leyes y normativas del Poder Popular.</p>
					</div>
					{canManage("laws") && (
						<Button variant="outline" size="sm" onClick={handleScrape} disabled={isScraping}>
							<RefreshCw className={`h-4 w-4 mr-2 ${isScraping ? "animate-spin" : ""}`} />
							{isScraping ? "Sincronizando..." : "Sincronizar"}
						</Button>
					)}
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Card className="border border-blue-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leyes</CardTitle>
							<div className="rounded-md p-1.5 bg-blue-500/10"><BookOpen className="size-3.5 text-blue-500" /></div>
						</CardHeader>
						<CardContent className="px-4 pb-4"><p className="text-3xl font-bold tracking-tight">{laws.length}</p></CardContent>
					</Card>
					<Card className="border border-emerald-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Con texto</CardTitle>
							<div className="rounded-md p-1.5 bg-emerald-500/10"><ScrollText className="size-3.5 text-emerald-500" /></div>
						</CardHeader>
						<CardContent className="px-4 pb-4"><p className="text-3xl font-bold tracking-tight">{conTexto}</p></CardContent>
					</Card>
					<Card className="border border-amber-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sin extraer</CardTitle>
							<div className="rounded-md p-1.5 bg-amber-500/10"><FileText className="size-3.5 text-amber-500" /></div>
						</CardHeader>
						<CardContent className="px-4 pb-4"><p className="text-3xl font-bold tracking-tight">{laws.length - conTexto}</p></CardContent>
					</Card>
				</div>

				<LawsTable />
			</div>
		</ProtectedRoute>
	);
}
