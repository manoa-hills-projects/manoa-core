import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
	type Family,
	useCreateFamily,
	useUpdateFamily,
} from "@/entities/families";
import { fetchHousesOptions, houseOptionAdapter } from "@/entities/houses";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import {
	FormCommandComboboxField,
	FormInputField,
} from "@/shared/ui/form-fields";

interface FamilyFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	family?: Family | null;
}

const formSchema = z.object({
	family_name: z.string().min(1, { message: "Requerido" }),
	house_id: z.string().min(1, { message: "Requerido" }),
});

type FormValues = z.infer<typeof formSchema>;

export function FamilyFormSheet({
	open,
	onOpenChange,
	family,
}: FamilyFormSheetProps) {
	const createMutation = useCreateFamily();
	const updateMutation = useUpdateFamily();

	const isEditing = !!family;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			family_name: family?.family_name || "",
			house_id: family?.house_id || "",
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				family_name: family?.family_name || "",
				house_id: family?.house_id || "",
			});
		}
	}, [family, open, form]);

	const onSubmit = async (values: FormValues) => {
		try {
			if (isEditing && family) {
				await updateMutation.mutateAsync({ id: family.id, data: values });
				toast.success("Familia actualizada exitosamente");
			} else {
				await createMutation.mutateAsync(values);
				toast.success("Familia creada exitosamente");
			}
			onOpenChange(false);
		} catch (_error) {
			toast.error("Error al guardar la familia");
		}
	};

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
					onSubmit={form.handleSubmit(onSubmit)}
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
						disabled={form.formState.isSubmitting}
						className="mt-4"
					>
						{form.formState.isSubmitting ? "Guardando..." : "Guardar"}
					</Button>
				</form>
			</Form>
		</DataSheet>
	);
}
