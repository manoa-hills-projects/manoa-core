import type { House } from "@/entities/houses";
import { useHouseForm } from "../model/use-house-form";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import { FormInputField } from "@/shared/ui/form-fields";
import { LocationPicker } from "@/shared/ui/location-picker";
import { Button } from "@/shared/ui/button";

interface HouseFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	house?: House | null;
}

export function HouseFormSheet({ open, onOpenChange, house }: HouseFormSheetProps) {
	const { form, onSubmit, isSubmitting } = useHouseForm({ house, onSuccess: () => onOpenChange(false) });

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title={house ? "Editar Vivienda" : "Registrar Vivienda"}
		>
			<Form {...form}>
				<form onSubmit={onSubmit} className="space-y-4">
					<FormInputField control={form.control} name="address" label="Dirección" />
					<FormInputField control={form.control} name="sector" label="Sector" />
					<FormInputField control={form.control} name="number" label="Número" />

					<div className="space-y-2">
						<label className="text-sm font-medium">Ubicación (opcional)</label>
						<LocationPicker
							value={form.watch("latitude") && form.watch("longitude")
								? { latitude: form.watch("latitude")!, longitude: form.watch("longitude")! }
								: null}
							onChange={(c) => {
								form.setValue("latitude", c?.latitude ?? null);
								form.setValue("longitude", c?.longitude ?? null);
							}}
						/>
					</div>

					<Button type="submit" disabled={isSubmitting} className="w-full">
						{isSubmitting ? "Guardando..." : "Guardar"}
					</Button>
				</form>
			</Form>
		</DataSheet>
	);
}