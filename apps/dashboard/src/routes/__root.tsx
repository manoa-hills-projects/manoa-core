import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import TanStackQueryProvider from "../plugins/tanstack-query/root-provider";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
});

function RootComponent() {
	return (
		<TanStackQueryProvider>
			<Outlet />
		</TanStackQueryProvider>
	);
}