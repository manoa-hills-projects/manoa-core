import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useCreateHouse, useUpdateHouse, type House } from "@/entities/houses";
import { houseSchema, type HouseFormValues } from "./house-schema";

interface UseHouseFormProps {
	house?: House | null;
	onSuccess?: () => void;
}

export function useHouseForm({ house, onSuccess }: UseHouseFormProps) {
	const { mutateAsync: createHouse } = useCreateHouse();
	const { mutateAsync: updateHouse } = useUpdateHouse();

	const form = useForm<HouseFormValues>({
		resolver: zodResolver(houseSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		values: {
			address: house?.address ?? "",
			sector: house?.sector ?? "",
			number: house?.number ?? "",
		},
	});

	const onSubmit = useCallback(async (values: HouseFormValues) => {
		const isEditing = !!house?.id;
		const payload = {
			address: values.address,
			sector: values.sector,
			number: values.number,
		};

		try {
			if (isEditing) {
				await updateHouse({ id: house.id, data: payload });
				toast.success("Vivienda actualizada correctamente");
			} else {
				await createHouse(payload);
				toast.success("Vivienda registrada correctamente");
			}

			form.reset();
			onSuccess?.();
		} catch (error) {
			toast.error("No se pudo procesar la solicitud");
		}
	}, [house, createHouse, updateHouse, onSuccess, form]);

	return {
		form,
		onSubmit: form.handleSubmit(onSubmit),
		isSubmitting: form.formState.isSubmitting
	};
}