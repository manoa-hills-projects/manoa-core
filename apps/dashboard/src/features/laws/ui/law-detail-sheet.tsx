import type { Law } from "@/entities/laws/model/types";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";
import { ExternalLink, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Link } from "@tanstack/react-router";

interface LawDetailSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	law: Law | null;
}

export function LawDetailSheet({ open, onOpenChange, law }: LawDetailSheetProps) {
	if (!law) return null;

	const hasDescription = law.full_text && law.full_text.length > 30 && law.full_text.length < 500;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" showCloseButton className="sm:max-w-lg outline-none overflow-y-auto flex flex-col gap-4">
				<SheetHeader>
					<div className="flex items-start gap-3">
						<div className="shrink-0 rounded-md bg-primary/10 p-2">
							<FileText className="size-5 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<SheetTitle className="text-left leading-snug">{law.name}</SheetTitle>
							{law.scraped_at && (
								<p className="text-xs text-muted-foreground mt-1">
									Actualizado el {new Date(law.scraped_at * 1000).toLocaleDateString("es-VE")}
								</p>
							)}
						</div>
					</div>
				</SheetHeader>

				<SheetDescription asChild>
					<div className="flex flex-col gap-4">
						{/* Descripción corta */}
						{hasDescription && (
							<div className="rounded-lg bg-muted/50 p-4 text-sm text-foreground/80 leading-relaxed">
								{law.full_text}
							</div>
						)}

						{/* Botones de acción */}
						<div className="flex flex-col gap-2">
							<Button className="w-full gap-2" asChild>
								<a href={law.pdf_url} target="_blank" rel="noopener noreferrer">
									<ExternalLink className="size-4" />
									Abrir PDF oficial
								</a>
							</Button>

							<Button variant="outline" className="w-full gap-2" asChild>
								<Link to="/ai-assistant">
									<MessageSquare className="size-4" />
									Preguntar al asistente IA sobre esta ley
								</Link>
							</Button>
						</div>
					</div>
				</SheetDescription>
			</SheetContent>
		</Sheet>
	);
}
