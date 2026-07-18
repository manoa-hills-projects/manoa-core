import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { PollList } from "@/widgets/poll-list";

export const Route = createFileRoute("/_authenticated/polls")({
	component: PollsPage,
});

function PollsPage() {
	return (
		<ProtectedRoute>
			<div className="flex flex-col gap-6">
				<div>
						<h1 className="text-3xl font-bold tracking-tight">Votaciones</h1>
					<p className="text-muted-foreground">
						Propuestas y proyectos de la comunidad. Vote a favor o en contra y
						consulte los resultados.
					</p>
				</div>

				<PollList />
			</div>
		</ProtectedRoute>
	);
}
