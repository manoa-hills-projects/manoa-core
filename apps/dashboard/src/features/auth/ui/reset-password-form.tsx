import { Form } from "@/shared/ui/form";
import { FormInputField } from "@/shared/ui/form-fields";
import { FormSubmitButton } from "@/shared/ui/form-submit-button";
import { useResetPasswordForm } from "../model/use-auth-form";

interface ResetPasswordFormProps {
	token: string;
	onSuccess?: () => void;
}

export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
	const { form, onSubmit, isSubmitting, errorMessage, successMessage } =
		useResetPasswordForm({ token, onSuccess });

	return (
		<div className="space-y-4">
			{errorMessage ? (
				<p className="text-sm font-medium text-destructive">{errorMessage}</p>
			) : null}
			{successMessage ? (
				<p className="text-sm font-medium text-emerald-600">{successMessage}</p>
			) : null}

			{successMessage ? null : (
				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-4">
						<FormInputField
							control={form.control}
							name="password"
							label="Nueva Contraseña"
							type="password"
						/>

						<FormInputField
							control={form.control}
							name="confirmPassword"
							label="Confirmar Contraseña"
							type="password"
						/>

						<FormSubmitButton
							className="w-full mt-2"
							isSubmitting={isSubmitting}
							isDisabled={!form.formState.isValid}
						>
							Restablecer contraseña
						</FormSubmitButton>
					</form>
				</Form>
			)}
		</div>
	);
}
