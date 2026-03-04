import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { PollList } from "@/widgets/poll-list";

export const Route = createFileRoute("/_authenticated/polls")({
	component: PollsPage,
});

function PollsPage() {
	return (
		<ProtectedRoute permissions={{ project: ["read"] }}>
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Asambleas</h1>
					<p className="text-muted-foreground">
						Participe en las decisiones de la comunidad y consulte los proyectos
						propuestos.
					</p>
				</div>

				<PollList />
			</div>
		</ProtectedRoute>
	);
}
