import { Form } from "@/shared/ui/form";
import { FormInputField } from "@/shared/ui/form-fields";
import { FormSubmitButton } from "@/shared/ui/form-submit-button";
import { useLoginForm } from "../model/use-auth-form";

interface LoginFormProps {
	onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
	const { form, onSubmit, isSubmitting, errorMessage } = useLoginForm({
		onSuccess,
	});

	return (
		<div className="space-y-4">
			{errorMessage ? (
				<p className="text-sm font-medium text-destructive">{errorMessage}</p>
			) : null}

			<Form {...form}>
				<form onSubmit={onSubmit} className="space-y-4">
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
						Entrar
					</FormSubmitButton>
				</form>
			</Form>
		</div>
	);
}
