import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { UserTable } from "@/widgets/user-table";

export const Route = createFileRoute("/_authenticated/users")({
	component: UsersPage,
});

function UsersPage() {
	return (
		<ProtectedRoute permissions={{ user: ["list"] }}>
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
					<p className="text-muted-foreground">
						Gestión de usuarios y accesos al sistema.
					</p>
				</div>

				<UserTable />
			</div>
		</ProtectedRoute>
	);
}
