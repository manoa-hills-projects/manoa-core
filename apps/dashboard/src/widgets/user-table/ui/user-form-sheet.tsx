import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	citizenOptionAdapter,
	fetchCitizensOptions,
	useUpdateCitizen,
} from "@/entities/citizens";
import { type User, useCreateUser, useUpdateUser } from "@/entities/users";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import {
	FormCommandComboboxField,
	FormInputField,
	FormSelectField,
} from "@/shared/ui/form-fields";

interface UserFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user?: User | null;
}

const formSchema = z
	.object({
		name: z.string().min(1, { message: "Requerido" }),
		email: z.string().email({ message: "Correo inválido" }),
		role: z.string().min(1, { message: "Requerido" }),
		citizen_id: z.string().optional(),
		password: z.string().optional(),
	})
	.refine(
		(data) => {
			// Si no hay un ciudadano seleccionado, la contraseña es obligatoria en creación
			if (!data.citizen_id && !data.password) {
				return false;
			}
			return true;
		},
		{
			message: "Se requiere contraseña o asociar a un ciudadano",
			path: ["password"],
		},
	);

type FormValues = z.infer<typeof formSchema>;

export function UserFormSheet({
	open,
	onOpenChange,
	user,
}: UserFormSheetProps) {
	const createMutation = useCreateUser();
	const updateMutation = useUpdateUser();
	const updateCitizenMutation = useUpdateCitizen();

	const isEditing = !!user;

	// Fetch citizen to get the initial label for the combobox if editing
	const [citizenLabel, setCitizenLabel] = useState<string | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.name || "",
			email: user?.email || "",
			role: user?.role || "user",
			citizen_id: "",
			password: "",
		},
	});

	const watchCitizenId = form.watch("citizen_id");

	useEffect(() => {
		if (open) {
			form.reset({
				name: user?.name || "",
				email: user?.email || "",
				role: user?.role || "user",
				citizen_id: "", // TODO: If user is bound to a citizen, fetch and set here
				password: "",
			});
			setCitizenLabel(null);
		}
	}, [user, open, form]);

	const onSubmit = async (values: FormValues) => {
		try {
			if (isEditing && user) {
				await updateMutation.mutateAsync({
					id: user.id,
					data: {
						name: values.name,
						email: values.email,
						role: values.role as "user" | "admin" | "superadmin",
					},
				});
				toast.success("Usuario actualizado exitosamente");
			} else {
				let passwordToUse = values.password;

				// Si seleccionó ciudadano pero no puso contraseña, tratar de extraer la cédula
				if (values.citizen_id && !values.password) {
					// Hack: fetch the options and find the citizen to get the cedula
					// In a real scenario, the combobox should expose the whole object or
					// we should fetch the specific citizen details
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

				// Si asoció a un ciudadano, actualizar el ciudadano con el nuevo user_id
				if (values.citizen_id && newUser?.user?.id) {
					await updateCitizenMutation.mutateAsync({
						id: values.citizen_id,
						data: { user_id: newUser.user.id },
					});
				}

				toast.success("Usuario creado exitosamente");
			}
			onOpenChange(false);
		} catch (error: any) {
			toast.error(error.message || "Error al guardar el usuario");
		}
	};

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isEditing ? "Editar Usuario" : "Registrar Usuario"}
			description={
				isEditing
					? "Modifique los datos del usuario."
					: "Cree un nuevo usuario para el sistema."
			}
		>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-4"
				>
					<FormInputField control={form.control} name="name" label="Nombre" />

					<FormInputField
						control={form.control}
						name="email"
						label="Correo Electrónico"
						type="email"
					/>

					<FormSelectField
						control={form.control}
						name="role"
						label="Rol"
						options={[
							{ label: "Habitante", value: "user" },
							{ label: "Administrador", value: "admin" },
							{ label: "Súper Administrador", value: "superadmin" },
						]}
					/>

					{!isEditing && (
						<div className="space-y-4 rounded-lg border p-4 bg-muted/50 mt-2">
							<h4 className="text-sm font-medium">
								Asociar Habitante (Opcional)
							</h4>
							<p className="text-xs text-muted-foreground">
								Si asocia un habitante, se usará su cédula como contraseña
								inicial a menos que escriba una abajo.
							</p>

							<FormCommandComboboxField
								control={form.control}
								name="citizen_id"
								label="Buscar Habitante"
								placeholder="Buscar por cédula o nombre..."
								initialLabel={citizenLabel}
								fetcher={fetchCitizensOptions}
								getLabel={citizenOptionAdapter.getLabel}
								getValue={citizenOptionAdapter.getValue}
								renderOption={(item) => (
									<div>{citizenOptionAdapter.renderOption(item)}</div>
								)}
							/>

							<FormInputField
								control={form.control}
								name="password"
								label="Contraseña Inicial"
								type="password"
								placeholder={
									watchCitizenId
										? "Cédula del habitante (por defecto)"
										: "Escriba una contraseña..."
								}
							/>
						</div>
					)}

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
