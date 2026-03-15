import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { AssemblyRoom } from "@/widgets/assembly-room/ui/assembly-room";

export const Route = createFileRoute("/_authenticated/meetings")({
	component: MeetingsPage,
});

function MeetingsPage() {
	return (
		<ProtectedRoute permissions={{ project: ["read"] }}>
			<div className="flex flex-col gap-4 p-4 md:p-8 w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold tracking-tight">
						Asambleas Virtuales
					</h1>
					<p className="text-muted-foreground">
						Únete a la sala de reuniones de la comunidad para debatir y tomar
						decisiones en tiempo real.
					</p>
				</div>
				<AssemblyRoom />
			</div>
		</ProtectedRoute>
	);
}
