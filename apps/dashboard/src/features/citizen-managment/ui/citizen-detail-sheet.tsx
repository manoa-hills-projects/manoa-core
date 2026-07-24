import type { Citizen } from "@/entities/citizens/model/types";
import { formatDocumentId } from "@/entities/citizens/lib/format-document-id";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";

interface CitizenDetailSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	citizen: Citizen | null;
}

export function CitizenDetailSheet({
	open,
	onOpenChange,
	citizen,
}: CitizenDetailSheetProps) {
	if (!citizen) return null;

	const documento = formatDocumentId(citizen.dni_type, citizen.cedula);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				showCloseButton
				className="sm:max-w-md outline-none overflow-y-auto"
			>
				<SheetHeader className="pb-0">
					<SheetTitle>Detalles del Ciudadano</SheetTitle>
					<SheetDescription asChild>
						<div className="space-y-5 mt-3 pb-2">
							<div className="space-y-1.5">
								<p>
									<b>Nombre Completo:</b> {citizen.names} {citizen.surnames}
								</p>
								<p>
									<b>Documento:</b> {documento || "Sin documento"}
								</p>
								<p>
									<b>Teléfono:</b> {citizen.phone || "—"}
								</p>
								<p>
									<b>Fecha de Nacimiento:</b> {citizen.birth_date}
								</p>
								<p>
									<b>Género:</b>{" "}
									{citizen.gender === "M" ? "Masculino" : "Femenino"}
								</p>
							</div>

							<div className="pt-4 border-t space-y-1.5">
								<h3 className="text-sm font-semibold">
									Información de Residencia
								</h3>
								<p>
									<b>Sede Familiar:</b>{" "}
									{citizen.family_label || "Sin familia asignada"}
								</p>
								{citizen.house_label && (
									<p>
										<b>Vivienda:</b> {citizen.house_label}
									</p>
								)}
								<p>
									<b>Rol:</b>{" "}
									{citizen.is_head_of_household
										? "Jefe de Hogar"
										: "Miembro de la Familia"}
								</p>
							</div>
						</div>
					</SheetDescription>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
}
