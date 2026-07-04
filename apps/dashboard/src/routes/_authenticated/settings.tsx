import { createFileRoute } from "@tanstack/react-router";
import { CouncilProfileForm } from "@/features/settings";
import { SignatoriesForm } from "@/features/signatories-managment";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { SectionHeader } from "@/widgets/section-header/ui/section-header";

export const Route = createFileRoute("/_authenticated/settings")({
	component: SettingsPage,
	staticData: {
		breadcrumb: "Configuración",
	},
});

function SettingsPage() {
	return (
		<ProtectedRoute module="settings">
			<div className="space-y-6">
				<SectionHeader
					name="Configuración"
					description="Administra la información del consejo comunal y los firmantes de documentos."
				/>
				<Tabs defaultValue="profile">
					<TabsList>
						<TabsTrigger value="profile">Consejo Comunal</TabsTrigger>
						<TabsTrigger value="signatories">Firmantes</TabsTrigger>
					</TabsList>
					<TabsContent value="profile" className="mt-6">
						<div className="space-y-2 mb-6">
							<h2 className="text-lg font-semibold">Perfil del Consejo</h2>
							<p className="text-sm text-muted-foreground">
								Información básica del consejo comunal. Estos datos pueden
								aparecer en los documentos generados.
							</p>
						</div>
						<CouncilProfileForm />
					</TabsContent>
					<TabsContent value="signatories" className="mt-6">
						<div className="space-y-2 mb-6">
							<h2 className="text-lg font-semibold">Firmantes de Documentos</h2>
							<p className="text-sm text-muted-foreground">
								Configura el nombre, cédula y firma escaneada de cada firmante
								que aparecerá en los documentos oficiales generados.
							</p>
						</div>
						<SignatoriesForm />
					</TabsContent>
				</Tabs>
			</div>
		</ProtectedRoute>
	);
}
