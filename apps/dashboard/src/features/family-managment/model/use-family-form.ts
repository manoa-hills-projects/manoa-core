import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
	type Family,
	useCreateFamily,
	useUpdateFamily,
} from "@/entities/families";
import { type FamilyFormValues, familySchema } from "./family-schema";

interface UseFamilyFormProps {
	family?: Family | null;
	onSuccess?: () => void;
}

export function useFamilyForm({ family, onSuccess }: UseFamilyFormProps) {
	const { mutateAsync: createFamily } = useCreateFamily();
	const { mutateAsync: updateFamily } = useUpdateFamily();

	const form = useForm<FamilyFormValues>({
		resolver: zodResolver(familySchema),
		defaultValues: {
			family_name: family?.family_name || "",
			house_id: family?.house_id || "",
		},
	});

	const onSubmit = useCallback(
		async (values: FamilyFormValues) => {
			const isEditing = !!family?.id;

			try {
				if (isEditing) {
					await updateFamily({ id: family.id, data: values });
					toast.success("Familia actualizada correctamente");
				} else {
					await createFamily(values);
					toast.success("Familia registrada correctamente");
				}

				form.reset();
				onSuccess?.();
			} catch (error) {
				toast.error("No se pudo procesar la solicitud");
			}
		},
		[family, createFamily, updateFamily, onSuccess, form],
	);

	return {
		form,
		onSubmit: form.handleSubmit(onSubmit),
		isSubmitting: form.formState.isSubmitting,
	};
}
