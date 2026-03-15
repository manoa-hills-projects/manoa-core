import { Save } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

interface FormSubmitButtonProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
	isSubmitting?: boolean;
	isDisabled?: boolean;
	children: ReactNode;
}

export function FormSubmitButton({
	isSubmitting,
	isDisabled,
	children,
	...props
}: FormSubmitButtonProps) {
	return (
		<Button
			type="submit"
			disabled={isSubmitting || isDisabled}
			aria-busy={isSubmitting}
			{...props}
		>
			<Save />
			{isSubmitting ? <Spinner size="sm" /> : null}
			<span>{children}</span>
		</Button>
	);
}
