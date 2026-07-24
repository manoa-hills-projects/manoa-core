import { Building2, Hash, Home, Map as MapIcon, MapPin, Phone } from "lucide-react";
import type { House } from "@/entities/houses";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import { FormInputField, FormSelectField } from "@/shared/ui/form-fields";
import { FormSubmitButton } from "@/shared/ui/form-submit-button";
import { useHouseForm } from "../model/use-house-form";

interface HouseFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	house?: House | null;
}

export function HouseFormSheet({
	open,
	onOpenChange,
	house,
}: HouseFormSheetProps) {
	const { form, onSubmit, isSubmitting } = useHouseForm({
		house,
		onSuccess: () => onOpenChange(false),
	});
	const isEditing = !!house?.id;
	const title = isEditing ? "Editar Vivienda" : "Registrar Nueva Vivienda";
	return (
		<DataSheet open={open} onOpenChange={onOpenChange} title={title}>
			<Form {...form}>
				<form onSubmit={onSubmit} className="space-y-4">
					<FormInputField
						control={form.control}
						name="address"
						label="Dirección"
						icon={MapPin}
						placeholder="Calle Falsa 123, Springfield"
					/>
					<div className="grid grid-cols-2 gap-4">
						<FormInputField
							control={form.control}
							name="sector"
							label="Sector"
							icon={MapIcon}
							placeholder="Centro, Norte..."
						/>
						<FormInputField
							control={form.control}
							name="number"
							label="Número"
							placeholder="12"
							icon={Hash}
						/>
					</div>
					<FormInputField
						control={form.control}
						name="phone"
						label="Teléfono"
						icon={Phone}
						placeholder="04121234567"
					/>
					<div className="grid grid-cols-2 gap-4">
						<FormSelectField
							control={form.control}
							name="type"
							label="Tipo"
							placeholder="..."
							options={[
								{ label: "Casa", value: "casa" },
								{ label: "Apartamento", value: "apartamento" },
								{ label: "Rancho", value: "rancho" },
								{ label: "Local", value: "local" },
								{ label: "Otro", value: "otro" },
							]}
						/>
						<FormSelectField
							control={form.control}
							name="tenure"
							label="Tenencia"
							placeholder="..."
							options={[
								{ label: "Propia", value: "propia" },
								{ label: "Alquilada", value: "alquilada" },
								{ label: "Cedida", value: "cedida" },
								{ label: "Otra", value: "otra" },
							]}
						/>
					</div>

					<FormSubmitButton
						className="w-full"
						isSubmitting={isSubmitting}
						isDisabled={!form.formState.isValid}
					>
						{isEditing ? "Actualizar Vivienda" : "Registrar Vivienda"}
					</FormSubmitButton>
				</form>
			</Form>
		</DataSheet>
	);
}
