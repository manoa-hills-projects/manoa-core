import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { getContext } from "./plugins/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,

		context: getContext(),
		defaultViewTransition: true,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultStaleTime: 5000
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
