import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCreatePoll } from "@/entities/polls";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import { FormInputField, FormTextareaField } from "@/shared/ui/form-fields";

interface PollFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
	title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
	description: z.string().optional(),
	options: z
		.array(
			z.object({
				text: z.string().min(1, "La opción no puede estar vacía"),
			}),
		)
		.min(2, "Debe agregar al menos 2 opciones"),
});

type FormValues = z.infer<typeof formSchema>;

export function PollFormSheet({ open, onOpenChange }: PollFormSheetProps) {
	const createMutation = useCreatePoll();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
			options: [{ text: "" }, { text: "" }],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "options",
	});

	useEffect(() => {
		if (open) {
			form.reset({
				title: "",
				description: "",
				options: [{ text: "Aprobar" }, { text: "Rechazar" }],
			});
		}
	}, [open, form]);

	const onSubmit = async (values: FormValues) => {
		try {
			const payload = {
				title: values.title,
				description: values.description,
				options: values.options.map((opt) => opt.text),
			};

			await createMutation.mutateAsync(payload);
			toast.success("Asamblea creada exitosamente");
			onOpenChange(false);
		} catch (error: any) {
			toast.error(error.message || "Error al crear la asamblea");
		}
	};

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title="Nueva Asamblea"
			description="Cree un nuevo proyecto o consulta para que la comunidad vote."
		>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto px-1 pb-4"
				>
					<FormInputField
						control={form.control}
						name="title"
						label="Título del Proyecto / Consulta"
						placeholder="Ej. Reparación de la cancha"
					/>

					<FormTextareaField
						control={form.control}
						name="description"
						label="Descripción (Opcional)"
						placeholder="Detalles sobre lo que se está votando..."
						rows={4}
					/>

					<div className="space-y-4 rounded-lg border p-4 bg-muted/30">
						<div className="flex items-center justify-between">
							<h4 className="text-sm font-medium">Opciones de Voto</h4>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => append({ text: "" })}
							>
								<Plus className="mr-2 h-4 w-4" />
								Agregar
							</Button>
						</div>

						<div className="flex flex-col gap-3">
							{fields.map((field, index) => (
								<div key={field.id} className="flex items-start gap-2">
									<div className="flex-1">
										<FormInputField
											control={form.control}
											name={`options.${index}.text`}
											placeholder={`Opción ${index + 1}`}
										/>
									</div>
									{fields.length > 2 && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="mt-1 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
											onClick={() => remove(index)}
										>
											<X className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}
						</div>
						{form.formState.errors.options && (
							<p className="text-sm font-medium text-destructive">
								{form.formState.errors.options.root?.message ||
									form.formState.errors.options.message}
							</p>
						)}
					</div>

					<Button
						type="submit"
						disabled={form.formState.isSubmitting}
						className="mt-4"
					>
						{form.formState.isSubmitting ? "Guardando..." : "Crear Asamblea"}
					</Button>
				</form>
			</Form>
		</DataSheet>
	);
}
