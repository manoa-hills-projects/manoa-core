import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCreateHouse, useUpdateHouse } from "@/entities/houses";
import type { House } from "@/entities/houses/model/types";
import { LocationPicker } from "@/shared/ui/location-picker";
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
	latitude: z.number().optional().nullable(),
	longitude: z.number().optional().nullable(),
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
			latitude: house?.latitude ?? null,
			longitude: house?.longitude ?? null,
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				address: house?.address || "",
				sector: house?.sector || "",
				number: house?.number || "",
				latitude: house?.latitude ?? null,
				longitude: house?.longitude ?? null,
			});
		}
	}, [house, open, form]);

	const onSubmit = async (values: FormValues) => {
		try {
			// Si no hay lat/lng, no los envíes
			const dataToSend = {
				address: values.address,
				sector: values.sector,
				number: values.number,
				...(values.latitude && values.longitude
					? { latitude: values.latitude, longitude: values.longitude }
					: {}),
			};
			if (isEditing && house) {
				await updateMutation.mutateAsync({ id: house.id, data: dataToSend });
				toast.success("Vivienda actualizada exitosamente");
			} else {
				await createMutation.mutateAsync(dataToSend);
				toast.success("Vivienda creada exitosamente");
			}
			onOpenChange(false);
		} catch (_error) {
			toast.error("Error al guardar la vivienda");
		}
	};

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isEditing ? "Editar Vivienda" : "Registrar Vivienda"}
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
					<FormInputField control={form.control} name="sector" label="Sector" />
					<FormInputField control={form.control} name="number" label="Número" />
					<div>
						<label className="block text-sm font-medium mb-1">Ubicación (opcional)</label>
						<LocationPicker
							value={
								form.watch("latitude") && form.watch("longitude")
									? { latitude: form.watch("latitude")!, longitude: form.watch("longitude")! }
									: null
							}
							onChange={(coords) => {
								form.setValue("latitude", coords?.latitude ?? null);
								form.setValue("longitude", coords?.longitude ?? null);
							}}
						/>
					</div>
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
