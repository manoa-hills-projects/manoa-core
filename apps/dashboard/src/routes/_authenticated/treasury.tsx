import { createFileRoute, Link } from "@tanstack/react-router";
import { IconArrowRight } from "@tabler/icons-react";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { TransparencyPanel } from "@/widgets/transparency-panel";
import { Button } from "@/shared/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

export const Route = createFileRoute("/_authenticated/treasury")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Tesorería",
	},
});

function RouteComponent() {
	const { canManage } = usePermissions();

	return (
		<ProtectedRoute>
			<div className="flex flex-col gap-6">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Tesorería</h1>
						<p className="text-muted-foreground">
							Transparencia de ingresos y egresos del consejo comunal.
						</p>
					</div>
					<div className="flex gap-2">
						<Button asChild variant="secondary">
							<Link to="/treasury/my-payments">
								Mis pagos <IconArrowRight className="h-4 w-4" />
							</Link>
						</Button>
						{canManage("treasury") && (
							<Button asChild>
								<Link to="/treasury/manage">
									Panel del tesorero <IconArrowRight className="h-4 w-4" />
								</Link>
							</Button>
						)}
					</div>
				</div>

				<TransparencyPanel />
			</div>
		</ProtectedRoute>
	);
}
