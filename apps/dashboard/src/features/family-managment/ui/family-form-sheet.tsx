import { useEffect } from "react";

import { type Family } from "@/entities/families";
import { fetchHousesOptions, houseOptionAdapter } from "@/entities/houses";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import {
	FormCommandComboboxField,
	FormInputField,
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
				<form
					onSubmit={onSubmit}
					className="flex flex-col gap-4"
				>
					<FormInputField
						control={form.control}
						name="family_name"
						label="Nombre de Familia"
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

					<Button
						type="submit"
						disabled={isSubmitting}
						className="mt-4"
					>
						{isSubmitting ? "Guardando..." : "Guardar"}
					</Button>
				</form>
			</Form>
		</DataSheet>
	);
}
