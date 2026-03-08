import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
	size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
	const sizeClass =
		size === "sm"
			? "h-3 w-3 border-[2px]"
			: size === "lg"
				? "h-6 w-6 border-4"
				: "h-4 w-4 border-[2.5px]";

	return (
		<div
			aria-label="Cargando"
			role="status"
			className={cn(
				"inline-block animate-spin rounded-full border-current border-t-transparent text-current",
				sizeClass,
				className,
			)}
			{...props}
		/>
	);
}
