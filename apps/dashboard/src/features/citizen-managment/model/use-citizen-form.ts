import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useCreateCitizen, useUpdateCitizen, type Citizen } from "@/entities/citizens";
import { citizenSchema, type CitizenFormValues } from "./citizen-schema";

interface UseCitizenFormProps {
    citizen?: Citizen | null;
    onSuccess?: () => void;
}

export function useCitizenForm({ citizen, onSuccess }: UseCitizenFormProps) {
    const { mutateAsync: createCitizen } = useCreateCitizen();
    const { mutateAsync: updateCitizen } = useUpdateCitizen();

    const form = useForm<CitizenFormValues>({
        resolver: zodResolver(citizenSchema),
        defaultValues: {
            cedula: citizen?.cedula || "",
            names: citizen?.names || "",
            surnames: citizen?.surnames || "",
            gender: citizen?.gender || "",
            birth_date: citizen?.birth_date || "",
            is_head_of_household: citizen?.is_head_of_household || false,
            family_id: citizen?.family_id || "",
        },
    });

    const onSubmit = useCallback(async (values: CitizenFormValues) => {
        const isEditing = !!citizen?.id;
        const payload = {
            ...values,
            family_id: values.family_id || undefined,
        };

        try {
            if (isEditing && citizen) {
                await updateCitizen({ id: citizen.id, data: payload });
                toast.success("Ciudadano actualizado exitosamente");
            } else {
                await createCitizen(payload);
                toast.success("Ciudadano creado exitosamente");
            }

            form.reset();
            onSuccess?.();
        } catch (error) {
            toast.error("Error al guardar el ciudadano");
        }
    }, [citizen, createCitizen, updateCitizen, onSuccess, form]);

    return {
        form,
        onSubmit: form.handleSubmit(onSubmit),
        isSubmitting: form.formState.isSubmitting
    };
}
