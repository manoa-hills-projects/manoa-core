import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
	type Citizen,
	useCreateCitizen,
	useUpdateCitizen,
} from "@/entities/citizens";
import { api } from "@/shared/api/api-client";
import { type CitizenFormValues, citizenSchema } from "./citizen-schema";

async function checkDniExists(dni: string, excludeId?: string): Promise<boolean> {
	try {
		const params = new URLSearchParams({ dni });
		if (excludeId) params.set("exclude_id", excludeId);
		const res = await api.get(`citizens/check-dni?${params}`).json<{ exists: boolean }>();
		return res.exists;
	} catch {
		return false;
	}
}

interface UseCitizenFormProps {
	citizen?: Citizen | null;
	onSuccess?: () => void;
}

export function useCitizenForm({ citizen, onSuccess }: UseCitizenFormProps) {
	const { mutateAsync: createCitizen } = useCreateCitizen();
	const { mutateAsync: updateCitizen } = useUpdateCitizen();

	const form = useForm<CitizenFormValues>({
		resolver: zodResolver(citizenSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		values: {
			dni_type: citizen?.dni_type ?? "NATIONAL",
			cedula: citizen?.cedula || "",
			phone: citizen?.phone || "",
			names: citizen?.names || "",
			surnames: citizen?.surnames || "",
			gender: citizen?.gender || "",
			birth_date: citizen?.birth_date || "",
			is_head_of_household: citizen?.is_head_of_household || false,
			family_id: citizen?.family_id || "",
			disabilities: citizen?.disabilities?.map((d) => ({
				disability_type: d.disability_type,
				description: d.description ?? "",
			})) ?? [],
		},
	});

	const onSubmit = useCallback(
		async (values: CitizenFormValues) => {
			const isEditing = !!citizen?.id;
			const payload = {
				...values,
				family_id: values.family_id || undefined,
			};

			// Validate DNI uniqueness before submit
			if (!isEditing && values.cedula) {
				const exists = await checkDniExists(values.cedula);
				if (exists) {
					form.setError("cedula", { message: "Este documento ya está registrado" });
					return;
				}
			}

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
			} catch (error: any) {
				let msg = "Error al guardar el ciudadano";
				try {
					const body = await error.response?.json();
					msg = body?.message ?? msg;
				} catch {}
				toast.error(msg);
			}
		},
		[citizen, createCitizen, updateCitizen, onSuccess, form],
	);

	return {
		form,
		onSubmit: form.handleSubmit(onSubmit),
		isSubmitting: form.formState.isSubmitting,
	};
}
