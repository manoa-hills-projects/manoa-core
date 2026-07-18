import { createFileRoute } from '@tanstack/react-router'
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LawsTable } from "@/features/laws";
import { usePermissions } from "@/hooks/use-permissions";
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

	const handleScrape = async () => {
		setIsScraping(true);
		try {
			const res = await fetch(
				"https://manoa-api-prod.manoa-it.workers.dev/api/laws/scrape",
				{ method: "POST", credentials: "include" },
			);
			if (!res.ok) throw new Error("Error al sincronizar");
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
				{/* ═══ HEADER ═══ */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							Leyes del Poder Popular
						</h1>
						<p className="text-muted-foreground">
							Consulta las leyes y normativas del Poder Popular.
						</p>
					</div>
					{canManage("laws") && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleScrape}
							disabled={isScraping}
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${isScraping ? "animate-spin" : ""}`}
							/>
							{isScraping ? "Sincronizando..." : "Sincronizar leyes"}
						</Button>
					)}
				</div>

				{/* ═══ ZONA 1/2: Ver leyes ═══ */}
				<Card>
					<CardHeader>
						<CardTitle>Leyes disponibles</CardTitle>
					</CardHeader>
					<CardContent>
						<LawsTable />
					</CardContent>
				</Card>
			</div>
		</ProtectedRoute>
	);
}
