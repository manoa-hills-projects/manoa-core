import type { Citizen } from "@/entities/citizens";
import { familyOptionAdapter, fetchFamiliesOptions } from "@/entities/families";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import {
	FormCommandComboboxField,
	FormInputField,
	FormSelectField,
	FormSwitchField,
} from "@/shared/ui/form-fields";
import { Input } from "@/shared/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { FormSubmitButton } from "@/shared/ui/form-submit-button";
import { useCitizenForm } from "../model/use-citizen-form";

interface CitizenFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	citizen?: Citizen | null;
}

export function CitizenFormSheet({
	open,
	onOpenChange,
	citizen,
}: CitizenFormSheetProps) {
	const isEditing = !!citizen;

	const { form, onSubmit, isSubmitting } = useCitizenForm({
		citizen,
		onSuccess: () => onOpenChange(false),
	});

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isEditing ? "Editar Ciudadano" : "Registrar Ciudadano"}
			description="Ingrese los datos del Ciudadano."
		>
			<Form {...form}>
				<form
					onSubmit={onSubmit}
					className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto px-1 pb-1"
				>
					<FormField
						control={form.control}
						name="dni_type"
						render={({ field: dtField }) => (
							<FormField
								control={form.control}
								name="cedula"
								render={({ field: cField }) => (
									<FormItem className="space-y-2">
										<FormLabel>Documento</FormLabel>
										<div className="flex gap-0">
											<Select
												onValueChange={dtField.onChange}
												value={dtField.value}
											>
												<FormControl>
													<SelectTrigger className="rounded-r-none border-r-0 w-auto min-w-[72px]">
														<SelectValue placeholder="..." />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="NATIONAL">V</SelectItem>
													<SelectItem value="FOREIGN">E</SelectItem>
													<SelectItem value="SYNTHETIC">—</SelectItem>
												</SelectContent>
											</Select>
											<Input
												{...cField}
												value={cField.value ?? ""}
												placeholder="12345678"
												className="rounded-l-none flex-1 min-w-0"
											/>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
					/>
					<div className="grid grid-cols-2 gap-4">
						<FormInputField
							control={form.control}
							name="names"
							label="Nombres"
							placeholder="Ej: María"
						/>
						<FormInputField
							control={form.control}
							name="surnames"
							label="Apellidos"
							placeholder="Ej: Pérez"
						/>
					</div>
					<div className="flex items-start gap-4">
						<div className="w-36 shrink-0">
							<FormSelectField
								control={form.control}
								name="gender"
								label="Género"
								placeholder="..."
								options={[
									{ label: "Masculino", value: "M" },
									{ label: "Femenino", value: "F" },
								]}
							/>
						</div>
						<div className="flex-1 min-w-0">
							<FormInputField
								control={form.control}
								name="birth_date"
								label="Fecha de Nacimiento"
								type="date"
							/>
						</div>
					</div>

					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => {
							const prefix = field.value?.startsWith("0") ? field.value.slice(0, 4) : "0412";
							const number = field.value?.slice(4) || "";
							return (
								<FormItem className="space-y-2">
									<FormLabel>Teléfono</FormLabel>
									<div className="flex gap-0">
										<Select
											value={prefix}
											onValueChange={(p) => {
												field.onChange(number ? `${p}${number}` : p);
											}}
										>
											<FormControl>
												<SelectTrigger className="rounded-r-none border-r-0 w-auto min-w-[80px]">
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="0412">0412</SelectItem>
												<SelectItem value="0414">0414</SelectItem>
												<SelectItem value="0416">0416</SelectItem>
												<SelectItem value="0424">0424</SelectItem>
												<SelectItem value="0426">0426</SelectItem>
											</SelectContent>
										</Select>
										<Input
											value={number}
											onChange={(e) => {
												const digits = e.target.value.replace(/\D/g, "").slice(0, 7);
												field.onChange(digits ? `${prefix}${digits}` : "");
											}}
											placeholder="1234567"
											className="rounded-l-none flex-1 min-w-0"
										/>
									</div>
									<FormMessage />
								</FormItem>
							);
						}}
					/>

					<FormCommandComboboxField
						control={form.control}
						name="family_id"
						label="Familia"
						placeholder="Buscar familia..."
						initialLabel={citizen?.family_label}
						fetcher={fetchFamiliesOptions}
						getLabel={familyOptionAdapter.getLabel}
						getValue={familyOptionAdapter.getValue}
						renderOption={(item) => (
							<div>{familyOptionAdapter.renderOption(item)}</div>
						)}
					/>

					<FormSwitchField
						control={form.control}
						name="is_head_of_household"
						label="Jefe de Hogar"
					/>

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
