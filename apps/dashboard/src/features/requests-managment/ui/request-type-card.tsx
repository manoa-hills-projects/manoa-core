import { ArrowRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestTypeCardProps {
	title: string;
	description: string;
	onClick: () => void;
	icon?: React.ReactNode;
}

export function RequestTypeCard({
	title,
	description,
	onClick,
	icon,
}: RequestTypeCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-left",
				"shadow-sm transition-all duration-200",
				"hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				"cursor-pointer",
			)}
		>
			{/* Icon */}
			<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
				{icon ?? <FileText className="h-6 w-6" />}
			</div>

			{/* Content */}
			<div className="flex-1 space-y-1">
				<h3 className="font-semibold text-foreground">{title}</h3>
				<p className="text-sm text-muted-foreground leading-relaxed">
					{description}
				</p>
			</div>

			{/* Arrow hint */}
			<div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
				<span>Generar solicitud</span>
				<ArrowRight className="h-3 w-3" />
			</div>

			{/* Clickable indicator dot */}
			<div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
		</button>
	);
}
