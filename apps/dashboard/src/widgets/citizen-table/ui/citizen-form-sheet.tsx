import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useCreateCitizen, useUpdateCitizen } from "@/entities/citizens";
import type { Citizen } from "@/entities/citizens/model/types";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";

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
	const createMutation = useCreateCitizen();
	const updateMutation = useUpdateCitizen();

	const isEditing = !!citizen;

	const form = useForm({
defaultValues: {
cedula: citizen?.cedula || "",
names: citizen?.names || "",
surnames: citizen?.surnames || "",
gender: citizen?.gender || "",
birth_date: citizen?.birth_date || "",
is_head_of_household: citizen?.is_head_of_household || false,
family_id: citizen?.family_id || "",
},
onSubmit: async ({ value }) => {
			try {
				if (isEditing) {
					await updateMutation.mutateAsync({ id: citizen.id, data: value });
					toast.success("Ciudadano actualizado exitosamente");
				} else {
					await createMutation.mutateAsync(value);
					toast.success("Ciudadano creado exitosamente");
				}
				onOpenChange(false);
			} catch (_error) {
				toast.error("Error al guardar el ciudadano");
			}
		},
	});

	return (
<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isEditing ? "Editar Ciudadano" : "Registrar Ciudadano"}
			description="Ingrese los datos del Ciudadano."
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="flex flex-col gap-4 py-4 max-h-[80vh] overflow-y-auto pr-4"
			>
				<form.Field
					name="cedula"
					validators={{
						onChange: ({ value }) => (!value ? "Requerido" : undefined),
					}}
					children={(field) => (
<FormItem>
							<FormLabel htmlFor={field.name}>Cédula</FormLabel>
							<FormControl>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormControl>
							<FormMessage>
								{field.state.meta.errors
									? field.state.meta.errors.join(", ")
									: null}
							</FormMessage>
						</FormItem>
					)}
				/>
				<form.Field
					name="names"
					validators={{
						onChange: ({ value }) => (!value ? "Requerido" : undefined),
					}}
					children={(field) => (
<FormItem>
							<FormLabel htmlFor={field.name}>Nombres</FormLabel>
							<FormControl>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormControl>
							<FormMessage>
								{field.state.meta.errors
									? field.state.meta.errors.join(", ")
									: null}
							</FormMessage>
						</FormItem>
					)}
				/>
				<form.Field
					name="surnames"
					validators={{
						onChange: ({ value }) => (!value ? "Requerido" : undefined),
					}}
					children={(field) => (
<FormItem>
							<FormLabel htmlFor={field.name}>Apellidos</FormLabel>
							<FormControl>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormControl>
							<FormMessage>
								{field.state.meta.errors
									? field.state.meta.errors.join(", ")
									: null}
							</FormMessage>
						</FormItem>
					)}
				/>
				<form.Field
					name="gender"
					validators={{
						onChange: ({ value }) => (!value ? "Requerido" : undefined),
					}}
					children={(field) => (
<FormItem>
							<FormLabel htmlFor={field.name}>Género</FormLabel>
							<FormControl>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormControl>
							<FormMessage>
								{field.state.meta.errors
									? field.state.meta.errors.join(", ")
									: null}
							</FormMessage>
						</FormItem>
					)}
				/>
				<form.Field
					name="birth_date"
					validators={{
						onChange: ({ value }) => (!value ? "Requerido" : undefined),
					}}
					children={(field) => (
<FormItem>
							<FormLabel htmlFor={field.name}>Fecha Nacimiento</FormLabel>
							<FormControl>
								<Input
									id={field.name}
									type="date"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormControl>
							<FormMessage>
								{field.state.meta.errors
									? field.state.meta.errors.join(", ")
									: null}
							</FormMessage>
						</FormItem>
					)}
				/>
				<form.Field
					name="family_id"
					children={(field) => (
<FormItem>
							<FormLabel htmlFor={field.name}>ID Familia</FormLabel>
							<FormControl>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="UUID familia (Opcional)"
								/>
							</FormControl>
							<FormMessage>
								{field.state.meta.errors
									? field.state.meta.errors.join(", ")
									: null}
							</FormMessage>
						</FormItem>
					)}
				/>
				<form.Field
					name="is_head_of_household"
					children={(field) => (
<FormItem className="flex flex-row items-center space-x-3 space-y-0">
							<FormControl>
								<Switch
									id={field.name}
									checked={field.state.value}
									onCheckedChange={(checked) => field.handleChange(checked)}
								/>
							</FormControl>
							<FormLabel htmlFor={field.name}>Es jefe de hogar</FormLabel>
							<FormMessage>
								{field.state.meta.errors
									? field.state.meta.errors.join(", ")
									: null}
							</FormMessage>
						</FormItem>
					)}
				/>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
					children={([canSubmit, isSubmitting]) => (
<Button
							type="submit"
							disabled={!canSubmit || isSubmitting}
							className="mt-4"
						>
							{isSubmitting ? "Guardando..." : "Guardar"}
						</Button>
					)}
				/>
			</form>
		</DataSheet>
	);
}
