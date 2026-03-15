import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreatePoll } from "@/entities/polls";
import { type PollFormValues, pollFormSchema } from "./poll-schema";

interface UsePollFormProps {
	onSuccess?: () => void;
}

export function usePollForm({ onSuccess }: UsePollFormProps = {}) {
	const createMutation = useCreatePoll();

	const form = useForm<PollFormValues>({
		resolver: zodResolver(pollFormSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: {
			title: "",
			description: "",
			options: [{ text: "Aprobar" }, { text: "Rechazar" }],
		},
	});

	const onSubmit = useCallback(
		async (values: PollFormValues) => {
			try {
				const payload = {
					title: values.title,
					description: values.description,
					options: values.options.map((opt) => opt.text),
				};

				await createMutation.mutateAsync(payload);
				toast.success("Asamblea creada exitosamente");

				form.reset({
					title: "",
					description: "",
					options: [{ text: "Aprobar" }, { text: "Rechazar" }],
				});
				onSuccess?.();
			} catch (error: any) {
				toast.error(error.message || "Error al crear la asamblea");
			}
		},
		[createMutation, onSuccess, form],
	);

	return {
		form,
		onSubmit: form.handleSubmit(onSubmit),
		isSubmitting: form.formState.isSubmitting,
	};
}
