import { createFileRoute } from "@tanstack/react-router";
import { ValidationSearch } from "@/features/validations";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/validations")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Validaciones",
	},
});

function RouteComponent() {
	return (
		<div className="flex flex-col gap-8">
			{/* Page header */}
			<div className="flex items-start gap-4">
				<div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
					<ShieldCheck className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Validaciones</h1>
					<p className="text-muted-foreground text-sm mt-0.5">
						Consulta los datos de un ciudadano venezolano a través de su cédula
						de identidad en el registro del CNE.
					</p>
				</div>
			</div>

			{/* Search module */}
			<ValidationSearch />
		</div>
	);
}
