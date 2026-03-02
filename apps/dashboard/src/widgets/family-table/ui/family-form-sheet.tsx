import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useCreateFamily, useUpdateFamily } from "@/entities/families";
import type { Family } from "@/entities/families/model/types";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

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
	const createMutation = useCreateFamily();
	const updateMutation = useUpdateFamily();

	const isEditing = !!family;

	const form = useForm({
defaultValues: {
family_name: family?.family_name || "",
house_id: family?.house_id || "",
},
onSubmit: async ({ value }) => {
			try {
				if (isEditing) {
					await updateMutation.mutateAsync({ id: family.id, data: value });
					toast.success("Familia actualizada exitosamente");
				} else {
					await createMutation.mutateAsync(value);
					toast.success("Familia creada exitosamente");
				}
				onOpenChange(false);
			} catch (_error) {
				toast.error("Error al guardar la familia");
			}
		},
	});

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
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="flex flex-col gap-4 py-4"
			>
				<form.Field
					name="family_name"
					validators={{
						onChange: ({ value }) => (!value ? "Requerido" : undefined),
					}}
					children={(field) => (
<FormItem>
							<FormLabel htmlFor={field.name}>Nombre de Familia</FormLabel>
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
					name="house_id"
					validators={{
						onChange: ({ value }) => (!value ? "Requerido" : undefined),
					}}
					children={(field) => (
<FormItem>
							<FormLabel htmlFor={field.name}>ID Casa</FormLabel>
							<FormControl>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="UUID de la casa"
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
