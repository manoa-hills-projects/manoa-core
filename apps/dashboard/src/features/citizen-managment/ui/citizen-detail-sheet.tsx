import type { Citizen } from "@/entities/citizens/model/types";
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

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				showCloseButton
				className="sm:max-w-md outline-none overflow-y-auto"
			>
				<SheetHeader>
					<SheetTitle>Detalles del Ciudadano</SheetTitle>
					<SheetDescription asChild>
						<div className="flex flex-col gap-6 mt-4">
							<div>
								<div className="mb-2">
									<div>
										<b>Nombre Completo:</b> {citizen.names} {citizen.surnames}
									</div>
									<div>
										<b>Cédula:</b> {citizen.cedula}
									</div>
									<div>
										<b>Fecha de Nacimiento:</b> {citizen.birth_date}
									</div>
									<div>
										<b>Género:</b>{" "}
										{citizen.gender === "M" ? "Masculino" : "Femenino"}
									</div>
								</div>

								<div className="mt-4 pt-4 border-t">
									<h3 className="text-sm font-semibold mb-2">
										Información de Residencia
									</h3>
									<div>
										<b>Sede Familiar:</b>{" "}
										{citizen.family_label || "Sin familia asignada"}
									</div>
									{citizen.house_label && (
										<div className="mt-1">
											<b>Vivienda:</b> {citizen.house_label}
										</div>
									)}
									<div className="mt-1">
										<b>Rol:</b>{" "}
										{citizen.is_head_of_household
											? "Jefe de Hogar"
											: "Miembro de la Familia"}
									</div>
								</div>
							</div>
						</div>
					</SheetDescription>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
}
