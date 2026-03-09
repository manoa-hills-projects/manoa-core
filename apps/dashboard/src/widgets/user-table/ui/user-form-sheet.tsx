import { useState } from "react";
import { type User } from "@/entities/users";
import {
	citizenOptionAdapter,
	fetchCitizensOptions,
} from "@/entities/citizens";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import {
	FormCommandComboboxField,
	FormInputField,
	FormSelectField,
} from "@/shared/ui/form-fields";
import { FormSubmitButton } from "@/shared/ui/form-submit-button";
import { useUserForm } from "../model/use-user-form";

interface UserFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user?: User | null;
}

export function UserFormSheet({
	open,
	onOpenChange,
	user,
}: UserFormSheetProps) {
	const isEditing = !!user?.id;

	// Fetch citizen to get the initial label for the combobox if editing
	const [citizenLabel, setCitizenLabel] = useState<string | null>(null);

	const { form, onSubmit, isSubmitting } = useUserForm({
		user,
		onSuccess: () => onOpenChange(false),
	});

	const watchCitizenId = form.watch("citizen_id");

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isEditing ? "Editar Usuario" : "Registrar Usuario"}
			description={
				isEditing
					? "Modifique los datos del usuario."
					: "Cree un nuevo usuario para el sistema."
			}
		>
			<Form {...form}>
				<form
					onSubmit={onSubmit}
					className="flex flex-col gap-4"
				>
					<FormInputField control={form.control} name="name" label="Nombre" />

					<FormInputField
						control={form.control}
						name="email"
						label="Correo Electrónico"
						type="email"
					/>

					<FormSelectField
						control={form.control}
						name="role"
						label="Rol"
						options={[
							{ label: "Habitante", value: "user" },
							{ label: "Administrador", value: "admin" },
							{ label: "Súper Administrador", value: "superadmin" },
						]}
					/>

					{!isEditing && (
						<div className="space-y-4 rounded-lg border p-4 bg-muted/50 mt-2">
							<h4 className="text-sm font-medium">
								Asociar Habitante (Opcional)
							</h4>
							<p className="text-xs text-muted-foreground">
								Si asocia un habitante, se usará su cédula como contraseña
								inicial a menos que escriba una abajo.
							</p>

							<FormCommandComboboxField
								control={form.control}
								name="citizen_id"
								label="Buscar Habitante"
								placeholder="Buscar por cédula o nombre..."
								initialLabel={citizenLabel}
								fetcher={fetchCitizensOptions}
								getLabel={citizenOptionAdapter.getLabel}
								getValue={citizenOptionAdapter.getValue}
								renderOption={(item) => (
									<div>{citizenOptionAdapter.renderOption(item)}</div>
								)}
							/>

							<FormInputField
								control={form.control}
								name="password"
								label="Contraseña Inicial"
								type="password"
								placeholder={
									watchCitizenId
										? "Cédula del habitante (por defecto)"
										: "Escriba una contraseña..."
								}
							/>
						</div>
					)}

					<FormSubmitButton
						className="mt-4"
						isSubmitting={isSubmitting}
						isDisabled={!form.formState.isValid}
					>
						{isEditing ? "Guardar Cambios" : "Guardar"}
					</FormSubmitButton>
				</form>
			</Form>
		</DataSheet>
	);
}
