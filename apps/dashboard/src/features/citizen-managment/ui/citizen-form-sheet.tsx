import { PlusIcon, Trash2Icon } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import type { Citizen } from "@/entities/citizens";
import { familyOptionAdapter, fetchFamiliesOptions } from "@/entities/families";
import { Button } from "@/shared/ui/button";
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
import { Textarea } from "@/shared/ui/textarea";
import { useCitizenForm } from "../model/use-citizen-form";

const DISABILITY_OPTIONS = [
	{ label: "Visual", value: "visual" },
	{ label: "Auditiva", value: "auditiva" },
	{ label: "Física", value: "fisica" },
	{ label: "Intelectual", value: "intelectual" },
	{ label: "Psicosocial", value: "psicosocial" },
	{ label: "Múltiple", value: "multiple" },
	{ label: "Otra", value: "otra" },
];

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

	const selectedFamilyId = form.watch("family_id");
	const hasFamily = !!selectedFamilyId;

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "disabilities",
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

					<FormItem>
						<FormLabel>Discapacidades</FormLabel>
						<div className="space-y-3">
							{fields.map((field, index) => (
								<div key={field.id} className="flex flex-col gap-2 rounded-lg border p-3">
									<div className="flex items-start gap-2">
										<div className="flex-1">
											<FormField
												control={form.control}
												name={`disabilities.${index}.disability_type`}
												render={({ field: f }) => (
													<Select onValueChange={f.onChange} value={f.value}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Tipo de discapacidad" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{DISABILITY_OPTIONS.map((opt) => (
																<SelectItem key={opt.value} value={opt.value}>
																	{opt.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											/>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="size-8 shrink-0 text-destructive"
											onClick={() => remove(index)}
										>
											<Trash2Icon className="size-4" />
										</Button>
									</div>
									<FormField
										control={form.control}
										name={`disabilities.${index}.description`}
										render={({ field: f }) => (
											<FormControl>
												<Textarea
													{...f}
													value={f.value ?? ""}
													placeholder="Descripción (opcional)"
													rows={2}
												/>
											</FormControl>
										)}
									/>
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="w-full gap-2"
								onClick={() => append({ disability_type: "", description: "" })}
							>
								<PlusIcon className="size-4" />
								Agregar discapacidad
							</Button>
						</div>
						<FormMessage />
					</FormItem>

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

					{hasFamily && (
						<FormSwitchField
							control={form.control}
							name="is_head_of_household"
							label="Jefe de Hogar"
						/>
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
