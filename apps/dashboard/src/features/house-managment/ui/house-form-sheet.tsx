import type { House } from "@/entities/houses";
import { useHouseForm } from "../model/use-house-form";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import { FormInputField } from "@/shared/ui/form-fields";
import { FormSubmitButton } from "@/shared/ui/form-submit-button";
import { Hash, Map, MapPin, Save } from "lucide-react";

interface HouseFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	house?: House | null;
}

export function HouseFormSheet({ open, onOpenChange, house }: HouseFormSheetProps) {
	const { form, onSubmit, isSubmitting } = useHouseForm({ house, onSuccess: () => onOpenChange(false) });

	const title = house ? "Editar Vivienda" : "Registrar Vivienda";

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title={title}
		>
			<Form {...form}>
				<form onSubmit={onSubmit} className="space-y-4">
					<FormInputField
						control={form.control} name="address" label="Dirección"
						icon={MapPin}
						placeholder="Calle Falsa 123, Springfield"
					/>
					<FormInputField
						control={form.control} name="sector"
						label="Sector"
						icon={Map}
						placeholder="Centro, Norte, etc."
					/>
					<FormInputField
						control={form.control} name="number"
						label="Número"
						placeholder="12"
						icon={Hash}
					/>

					<FormSubmitButton
						className="w-full"
						isSubmitting={isSubmitting}
						isDisabled={!form.formState.isValid}
					>
						<Save />
						<span>{isSubmitting ? "Guardando..." : "Guardar"}</span>
					</FormSubmitButton>
				</form>
			</Form>
		</DataSheet>
	);
}