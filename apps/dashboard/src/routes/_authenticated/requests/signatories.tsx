import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { SectionHeader } from "@/widgets/section-header/ui/section-header";
import { SignatoriesForm } from "@/features/signatories-managment";

export const Route = createFileRoute("/_authenticated/requests/signatories")({
    component: RouteComponent,
    staticData: {
        breadcrumb: "Gestionar Firmantes",
    },
});

function RouteComponent() {
    return (
        <ProtectedRoute permissions={{ requests: ["approve"] }}>
            <div className="space-y-6">
                <SectionHeader
                    name="Firmantes de Documentos"
                    description="Configura el nombre y cédula de cada firmante que aparecerá en los documentos generados (Carta de Residencia, etc.)."
                />
                <SignatoriesForm />
            </div>
        </ProtectedRoute>
    );
}
