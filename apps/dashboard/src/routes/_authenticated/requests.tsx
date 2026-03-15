import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requestsConfig } from "@/entities/requests";

export const Route = createFileRoute("/_authenticated/requests")({
    component: RouteComponent,
    staticData: {
        breadcrumb: requestsConfig.entityName,
    },
});

function RouteComponent() {
    return <Outlet />;
}
