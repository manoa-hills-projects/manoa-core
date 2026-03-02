import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useCreateHouse, useUpdateHouse } from "@/entities/houses";
import type { House } from "@/entities/houses/model/types";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

interface HouseFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	house?: House | null;
}

export function HouseFormSheet({
open,
onOpenChange,
house,
}: HouseFormSheetProps) {
	const createMutation = useCreateHouse();
	const updateMutation = useUpdateHouse();

	const isEditing = !!house;

	const form = useForm({
defaultValues: {
address: house?.address || "",
sector: house?.sector || "",
number: house?.number || "",
},
onSubmit: async ({ value }) => {
			try {
				if (isEditing) {
					await updateMutation.mutateAsync({ id: house.id, data: value });
					toast.success("Casa actualizada exitosamente");
				} else {
					await createMutation.mutateAsync(value);
					toast.success("Casa creada exitosamente");
				}
				onOpenChange(false);
			} catch (_error) {
				toast.error("Error al guardar la casa");
			}
		},
	});

	return (
<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isEditing ? "Editar Casa" : "Registrar Casa"}
			description="Ingrese los datos de la vivienda."
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="flex flex-col gap-4 py-4"
			>
				<form.Field
					name="address"
					validators={{
						onChange: ({ value }) => (!value ? "Requerido" : undefined),
					}}
					children={(field) => (
<FormItem>
							<FormLabel htmlFor={field.name}>Dirección</FormLabel>
							<FormControl>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormControl>
							<FormMessage>
								{field.state.meta.errors
									? field.state.meta.errors.join(", ")
									: null}
							</FormMessage>
						</FormItem>
					)}
				/>
				<form.Field
					name="sector"
					validators={{
						onChange: ({ value }) => (!value ? "Requerido" : undefined),
					}}
					children={(field) => (
<FormItem>
							<FormLabel htmlFor={field.name}>Sector</FormLabel>
							<FormControl>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormControl>
							<FormMessage>
								{field.state.meta.errors
									? field.state.meta.errors.join(", ")
									: null}
							</FormMessage>
						</FormItem>
					)}
				/>
				<form.Field
					name="number"
					validators={{
						onChange: ({ value }) => (!value ? "Requerido" : undefined),
					}}
					children={(field) => (
<FormItem>
							<FormLabel htmlFor={field.name}>Número</FormLabel>
							<FormControl>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormControl>
							<FormMessage>
								{field.state.meta.errors
									? field.state.meta.errors.join(", ")
									: null}
							</FormMessage>
						</FormItem>
					)}
				/>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
					children={([canSubmit, isSubmitting]) => (
<Button
							type="submit"
							disabled={!canSubmit || isSubmitting}
							className="mt-4"
						>
							{isSubmitting ? "Guardando..." : "Guardar"}
						</Button>
					)}
				/>
			</form>
		</DataSheet>
	);
}
