import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCreateHouse, useUpdateHouse } from "@/entities/houses";
import type { House } from "@/entities/houses/model/types";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import { FormInputField } from "@/shared/ui/form-fields";

interface HouseFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	house?: House | null;
}

const formSchema = z.object({
	address: z.string().min(1, { message: "Requerido" }),
	sector: z.string().min(1, { message: "Requerido" }),
	number: z.string().min(1, { message: "Requerido" }),
});

type FormValues = z.infer<typeof formSchema>;

export function HouseFormSheet({
	open,
	onOpenChange,
	house,
}: HouseFormSheetProps) {
	const createMutation = useCreateHouse();
	const updateMutation = useUpdateHouse();

	const isEditing = !!house;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			address: house?.address || "",
			sector: house?.sector || "",
			number: house?.number || "",
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				address: house?.address || "",
				sector: house?.sector || "",
				number: house?.number || "",
			});
		}
	}, [house, open, form]);

	const onSubmit = async (values: FormValues) => {
		try {
			if (isEditing && house) {
				await updateMutation.mutateAsync({ id: house.id, data: values });
				toast.success("Casa actualizada exitosamente");
			} else {
				await createMutation.mutateAsync(values);
				toast.success("Casa creada exitosamente");
			}
			onOpenChange(false);
		} catch (_error) {
			toast.error("Error al guardar la casa");
		}
	};

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isEditing ? "Editar Casa" : "Registrar Casa"}
			description="Ingrese los datos de la vivienda."
		>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-4 px-1"
				>
					<FormInputField
						control={form.control}
						name="address"
						label="Dirección"
					/>
					<FormInputField
						control={form.control}
						name="sector"
						label="Sector"
					/>
					<FormInputField
						control={form.control}
						name="number"
						label="Número"
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
