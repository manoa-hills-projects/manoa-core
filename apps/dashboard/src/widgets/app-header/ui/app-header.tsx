import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { AppBreadcrumbs } from "./app-breadcrumbs";

export const AppHeader = () => {
	const navigate = useNavigate();

	const handleSignOut = async () => {
		await authClient.$fetch("/sign-out", {
			method: "POST",
			body: {},
		});

		authClient.$store.notify("$sessionSignal");
		navigate({ to: "/auth", replace: true });
	};

	return (
		<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				<AppBreadcrumbs />

				<div className="ml-auto flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={handleSignOut}>
						Cerrar sesión
					</Button>
				</div>
			</div>
		</header>
	);
};
