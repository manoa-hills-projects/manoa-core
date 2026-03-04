import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { MainLayout } from "@/widgets/main-layout";

export const Route = createFileRoute("/_authenticated")({
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	const { data, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
				Validando sesión...
			</div>
		);
	}

	if (!data?.session) {
		return <Navigate to="/auth" replace />;
	}

	return (
		<MainLayout>
			<Outlet />
		</MainLayout>
	);
}
