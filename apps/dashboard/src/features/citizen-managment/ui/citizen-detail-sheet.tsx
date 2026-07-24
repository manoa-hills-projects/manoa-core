import { useEffect, useState } from "react";
import type { Citizen } from "@/entities/citizens/model/types";
import { formatDocumentId } from "@/entities/citizens/lib/format-document-id";
import { api } from "@/shared/api/api-client";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";

const DISABILITY_LABELS: Record<string, string> = {
	visual: "Visual", auditiva: "Auditiva", fisica: "Física",
	intelectual: "Intelectual", psicosocial: "Psicosocial",
	multiple: "Múltiple", otra: "Otra",
};

interface CitizenDetailSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	citizen: Citizen | null;
}

export function CitizenDetailSheet({
	open,
	onOpenChange,
	citizen: initialCitizen,
}: CitizenDetailSheetProps) {
	const [fullCitizen, setFullCitizen] = useState<Citizen | null>(initialCitizen);

	useEffect(() => {
		if (open && initialCitizen?.id) {
			api.get(`citizens/${initialCitizen.id}`).json<{ data: Citizen }>()
				.then((res) => setFullCitizen(res.data))
				.catch(() => setFullCitizen(initialCitizen));
		} else if (!open) {
			setFullCitizen(null);
		}
	}, [open, initialCitizen]);

	const citizen = fullCitizen ?? initialCitizen;
	if (!citizen) return null;

	const documento = formatDocumentId(citizen.dni_type, citizen.cedula);
	const genderLabel = citizen.gender === "MASCULINO" || citizen.gender === "M" ? "Masculino" : "Femenino";
	const disabilities = citizen.disabilities ?? [];

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
									<b>Género:</b> {genderLabel}
								</p>
							</div>

							{disabilities.length > 0 && (
								<div className="pt-4 border-t space-y-1.5">
									<h3 className="text-sm font-semibold">Discapacidades</h3>
									{disabilities.map((d, i) => (
										<p key={i}>
											<b>{DISABILITY_LABELS[d.disability_type] ?? d.disability_type}:</b>{" "}
											{d.description || "—"}
										</p>
									))}
								</div>
							)}

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
