import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { fetchCitizensOptions, useUpdateCitizen } from "@/entities/citizens";
import { fetchProfilesOptions, useAssignProfile } from "@/entities/profiles";
import { type User, useCreateUser, useUpdateUser } from "@/entities/users";
import { type UserFormValues, userFormSchema } from "./user-schema";

interface UseUserFormProps {
	user?: User | null;
	onSuccess?: () => void;
}

export function useUserForm({ user, onSuccess }: UseUserFormProps) {
	const createMutation = useCreateUser();
	const updateMutation = useUpdateUser();
	const updateCitizenMutation = useUpdateCitizen();
	const assignProfileMutation = useAssignProfile();

	const isEditing = !!user?.id;

	const form = useForm<UserFormValues>({
		resolver: zodResolver(userFormSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		values: {
			name: user?.name ?? "",
			email: user?.email ?? "",
			role: user?.role ?? "user",
			profile_id: "",
			citizen_id: "", // TODO: If user is bound to a citizen, fetch and set here
			password: "",
		},
	});

	const onSubmit = useCallback(
		async (values: UserFormValues) => {
			try {
				let userId = user?.id;

				if (isEditing && user) {
					await updateMutation.mutateAsync({
						id: user.id,
						data: {
							name: values.name,
							email: values.email,
							role: values.role as "user" | "admin" | "superadmin",
						},
					});

					// Asignar perfil si cambió
					if (values.profile_id) {
						await assignProfileMutation.mutateAsync({
							userId: user.id,
							profileId: values.profile_id,
						});
					}

					toast.success("Usuario actualizado exitosamente");
				} else {
					let passwordToUse = values.password;

					// Si seleccionó ciudadano pero no puso contraseña, tratar de extraer la cédula
					if (values.citizen_id && !values.password) {
						const options = await fetchCitizensOptions({
							search: "",
							limit: 100,
						});
						const selectedCitizen = options.find(
							(c) => c.id === values.citizen_id,
						);
						if (selectedCitizen) {
							passwordToUse = selectedCitizen.cedula;
						} else {
							toast.error(
								"No se pudo obtener la cédula del ciudadano para la contraseña",
							);
							return;
						}
					}

					const newUser = await createMutation.mutateAsync({
						email: values.email,
						name: values.name,
						password: passwordToUse!,
						role: values.role as "user" | "admin" | "superadmin",
					});

					const createdUserId = newUser?.user?.id;

					// Si asoció a un ciudadano, actualizar el ciudadano con el nuevo user_id
					if (values.citizen_id && createdUserId) {
						await updateCitizenMutation.mutateAsync({
							id: values.citizen_id,
							data: { user_id: createdUserId },
						});
					}

					// Asignar perfil
					if (values.profile_id && createdUserId) {
						await assignProfileMutation.mutateAsync({
							userId: createdUserId,
							profileId: values.profile_id,
						});
					}

					toast.success("Usuario creado exitosamente");
				}

				form.reset();
				onSuccess?.();
			} catch (error: any) {
				toast.error(error.message || "Error al procesar la solicitud");
			}
		},
		[
			user,
			createMutation,
			updateMutation,
			updateCitizenMutation,
			assignProfileMutation,
			onSuccess,
			form,
			isEditing,
		],
	);

	return {
		form,
		onSubmit: form.handleSubmit(onSubmit),
		isSubmitting: form.formState.isSubmitting,
	};
}
