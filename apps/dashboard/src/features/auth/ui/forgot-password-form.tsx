import { Form } from "@/shared/ui/form";
import { FormInputField } from "@/shared/ui/form-fields";
import { FormSubmitButton } from "@/shared/ui/form-submit-button";
import { useForgotPasswordForm } from "../model/use-auth-form";

export function ForgotPasswordForm() {
	const {
		form,
		onSubmit,
		isSubmitting,
		errorMessage,
		successMessage,
	} = useForgotPasswordForm();

	return (
		<div className="space-y-4">
			{errorMessage ? (
				<p className="text-sm font-medium text-destructive">{errorMessage}</p>
			) : null}
			{successMessage ? (
				<p className="text-sm font-medium text-emerald-600">
					{successMessage}
				</p>
			) : null}

			<Form {...form}>
				<form onSubmit={onSubmit} className="space-y-4">
					<FormInputField
						control={form.control}
						name="email"
						label="Correo Electrónico"
						type="email"
					/>

					<FormSubmitButton
						className="w-full mt-2"
						isSubmitting={isSubmitting}
						isDisabled={!form.formState.isValid}
					>
						Enviar enlace
					</FormSubmitButton>
				</form>
			</Form>
		</div>
	);
}
