import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MainLayout } from "@/widgets/main-layout";

export const Route = createFileRoute("/_authenticated")({
	component: () => (
		<MainLayout>
			<Outlet />
		</MainLayout>
	),
});
