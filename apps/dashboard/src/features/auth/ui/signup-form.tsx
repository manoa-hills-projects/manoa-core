import { Form } from "@/shared/ui/form";
import { FormInputField } from "@/shared/ui/form-fields";
import { FormSubmitButton } from "@/shared/ui/form-submit-button";
import { useSignUpForm } from "../model/use-auth-form";

interface SignUpFormProps {
	onSuccess: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
	const { form, onSubmit, isSubmitting, errorMessage, successMessage } =
		useSignUpForm({ onSuccess });

	return (
		<div className="space-y-4">
			{errorMessage ? (
				<p className="text-sm font-medium text-destructive">{errorMessage}</p>
			) : null}
			{successMessage ? (
				<p className="text-sm font-medium text-emerald-600">{successMessage}</p>
			) : null}

			<Form {...form}>
				<form onSubmit={onSubmit} className="space-y-4">
					<FormInputField
						control={form.control}
						name="dni"
						label="Cédula de Identidad"
						placeholder="Cédula de identidad"
					/>

					<FormInputField
						control={form.control}
						name="name"
						label="Nombre Completo"
						type="text"
					/>

					<FormInputField
						control={form.control}
						name="email"
						label="Correo Electrónico"
						type="email"
					/>

					<FormInputField
						control={form.control}
						name="password"
						label="Contraseña"
						type="password"
					/>

					<FormSubmitButton
						className="w-full mt-2"
						isSubmitting={isSubmitting}
						isDisabled={!form.formState.isValid}
					>
						Crear cuenta
					</FormSubmitButton>
				</form>
			</Form>
		</div>
	);
}
