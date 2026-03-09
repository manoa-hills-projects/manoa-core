import { Plus, X } from "lucide-react";
import { useFieldArray } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import { FormInputField, FormTextareaField } from "@/shared/ui/form-fields";
import { FormSubmitButton } from "@/shared/ui/form-submit-button";
import { usePollForm } from "../model/use-poll-form";

interface PollFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PollFormSheet({ open, onOpenChange }: PollFormSheetProps) {
    const { form, onSubmit, isSubmitting } = usePollForm({
        onSuccess: () => onOpenChange(false)
    });

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "options",
	});

	return (
		<DataSheet
			open={open}
			onOpenChange={onOpenChange}
			title="Nueva Asamblea"
			description="Cree un nuevo proyecto o consulta para que la comunidad vote."
		>
			<Form {...form}>
				<form
					onSubmit={onSubmit}
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

					<FormSubmitButton
						className="mt-4"
						isSubmitting={isSubmitting}
						isDisabled={!form.formState.isValid}
					>
						Crear Asamblea
					</FormSubmitButton>
				</form>
			</Form>
		</DataSheet>
	);
}
