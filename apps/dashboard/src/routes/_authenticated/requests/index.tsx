import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { SectionHeader } from "@/widgets/section-header/ui/section-header";
import { requestsConfig } from "@/entities/requests";
import { RequestTypeCard } from "@/features/requests-managment/ui/request-type-card";
import { RequestFormDialog } from "@/features/requests-managment/ui/request-form-dialog";
import { RequestHistoryTable } from "@/features/requests-managment/ui/request-history-table";
import { FileText, History, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated/requests/")({
    component: RouteComponent,
    staticData: {
        breadcrumb: requestsConfig.entityName,
    },
});

function RouteComponent() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { data: sessionData } = authClient.useSession();
    const role = (sessionData?.user?.role ?? "user") as string;
    const isAdmin = role === "admin" || role === "superadmin";

    return (
        <ProtectedRoute permissions={{ requests: ["read"] }}>
            <div className="space-y-8">
                <div className="flex items-start justify-between gap-4">
                    <SectionHeader
                        name={requestsConfig.entityName}
                        description={requestsConfig.description}
                    />
                    {isAdmin && (
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/requests/admin">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Vista admin
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Document type cards */}
                <div>
                    <h2 className="text-base font-semibold text-foreground mb-4">
                        Generar nueva solicitud
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <RequestTypeCard
                            title="Carta de Residencia"
                            description="Solicita una constancia oficial de residencia emitida por el Consejo Comunal Manoa Bicentenario 10-20. Válida por 90 días."
                            icon={<FileText className="h-6 w-6" />}
                            onClick={() => setDialogOpen(true)}
                        />
                    </div>
                </div>

                {/* History section */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-base font-semibold text-foreground">
                            Historial de mis solicitudes
                        </h2>
                    </div>
                    <RequestHistoryTable mine />
                </div>
            </div>

            <RequestFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
        </ProtectedRoute>
    );
}
