import type { ReactNode } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";

interface DataSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	children: ReactNode;
}

export function DataSheet({
	open,
	onOpenChange,
	title,
	description,
	children,
}: DataSheetProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="sm:max-w-md">
				<SheetHeader>
					<SheetTitle>{title}</SheetTitle>
					{description && <SheetDescription>{description}</SheetDescription>}
				</SheetHeader>
				<div className="py-4 px-4">{children}</div>
			</SheetContent>
		</Sheet>
	);
}
