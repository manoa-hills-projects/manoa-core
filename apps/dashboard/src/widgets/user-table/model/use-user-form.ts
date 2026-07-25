import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/shared/api/api-client";
import { useUpdateCitizen } from "@/entities/citizens";
import { useAssignProfile } from "@/entities/profiles";
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
	const [initialProfileId, setInitialProfileId] = useState("");

	// Fetch user's current profile when editing
	useEffect(() => {
		if (user?.id) {
			api.get(`profiles/users/${user.id}/profile`)
				.json<{ userId: string; profile: { id: string; name: string } | null }>()
				.then((res) => {
					if (res.profile?.id) {
						setInitialProfileId(res.profile.id);
					}
				})
				.catch(() => {});
		}
	}, [user?.id]);

	const form = useForm<UserFormValues>({
		resolver: zodResolver(userFormSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		values: {
			name: user?.name ?? "",
			email: user?.email ?? "",
			profile_id: initialProfileId || (user as any)?.profile_id || "",
			citizen_id: "",
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

					// Si no hay contraseña ni ciudadano, no se puede crear
					if (!passwordToUse && !values.citizen_id) {
						toast.error("Se requiere una contraseña o asociar a un ciudadano");
						return;
					}

					// Si seleccionó ciudadano pero no puso contraseña, obtener su cédula
					if (values.citizen_id && !values.password) {
						try {
							const citizen = await api
								.get(`citizens/${values.citizen_id}`)
								.json<{ data: { cedula: string } }>();
							passwordToUse = citizen.data.cedula;
						} catch {
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
