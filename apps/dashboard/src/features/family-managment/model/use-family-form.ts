import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useCreateFamily, useUpdateFamily, type Family } from "@/entities/families";
import { familySchema, type FamilyFormValues } from "./family-schema";

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

    const onSubmit = useCallback(async (values: FamilyFormValues) => {
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
    }, [family, createFamily, updateFamily, onSuccess, form]);

    return {
        form,
        onSubmit: form.handleSubmit(onSubmit),
        isSubmitting: form.formState.isSubmitting
    };
}
