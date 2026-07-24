import { useEffect } from "react";

import type { Family } from "@/entities/families";
import { fetchHousesOptions, houseOptionAdapter } from "@/entities/houses";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import {
	FormCommandComboboxField,
	FormInputField,
	FormTextareaField,
} from "@/shared/ui/form-fields";
import { useFamilyForm } from "../model/use-family-form";

interface FamilyFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	family?: Family | null;
}

export function FamilyFormSheet({
	open,
	onOpenChange,
	family,
}: FamilyFormSheetProps) {
	const isEditing = !!family;

	const { form, onSubmit, isSubmitting } = useFamilyForm({
		family,
		onSuccess: () => onOpenChange(false),
	});

	useEffect(() => {
		if (open) {
			form.reset({
				family_name: family?.family_name || "",
				house_id: family?.house_id || "",
				phone: family?.phone || "",
				observations: family?.observations || "",
			});
		}
	}, [family, open, form]);

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isEditing ? "Editar Familia" : "Registrar Familia"}
			description={
				isEditing
					? "Modifique los datos de la familia seleccionada."
					: "Ingrese los datos de la Familia."
			}
		>
			<Form {...form}>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<FormInputField
						control={form.control}
						name="family_name"
						label="Nombre de Familia"
						placeholder="Ej: Familia Pérez"
					/>

					<FormInputField
						control={form.control}
						name="phone"
						label="Teléfono"
						placeholder="04121234567"
					/>

					<FormCommandComboboxField
						control={form.control}
						name="house_id"
						label="Vivienda"
						placeholder="Buscar vivienda..."
						initialLabel={family?.house_label}
						fetcher={fetchHousesOptions}
						getLabel={houseOptionAdapter.getLabel}
						getValue={houseOptionAdapter.getValue}
						renderOption={(item) => (
							<div>{houseOptionAdapter.renderOption(item)}</div>
						)}
					/>

					<FormTextareaField
						control={form.control}
						name="observations"
						label="Observaciones"
						placeholder="Información adicional sobre la familia..."
						rows={3}
					/>

					<Button type="submit" disabled={isSubmitting} className="mt-4">
						{isSubmitting ? "Guardando..." : "Guardar"}
					</Button>
				</form>
			</Form>
		</DataSheet>
	);
}
