import type { Law } from "@/entities/laws/model/types";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";
import { ExternalLink, FileText, ScrollText } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface LawDetailSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	law: Law | null;
}

export function LawDetailSheet({ open, onOpenChange, law }: LawDetailSheetProps) {
	if (!law) return null;

	const syncDate = law.scraped_at
		? new Date(law.scraped_at * 1000).toLocaleDateString("es-VE", {
				day: "2-digit",
				month: "long",
				year: "numeric",
		  })
		: null;

	const hasText = law.full_text && law.full_text.length > 50;
	const textPreview = hasText
		? law.full_text!.slice(0, 3000) + (law.full_text!.length > 3000 ? "..." : "")
		: null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				showCloseButton
				className="sm:max-w-2xl outline-none overflow-y-auto flex flex-col gap-4"
			>
				<SheetHeader>
					<div className="flex items-start gap-3">
						<div className="shrink-0 rounded-md bg-primary/10 p-2">
							<FileText className="size-5 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<SheetTitle className="text-left leading-snug">{law.name}</SheetTitle>
							{syncDate && (
								<p className="text-xs text-muted-foreground mt-1">
									Sincronizado el {syncDate}
								</p>
							)}
						</div>
					</div>
				</SheetHeader>

				<SheetDescription asChild>
					<div className="flex flex-col gap-4">
						<Button variant="outline" size="sm" className="w-fit gap-2" asChild>
							<a href={law.pdf_url} target="_blank" rel="noopener noreferrer">
								<ExternalLink className="size-4" />
								Abrir PDF oficial
							</a>
						</Button>

						{textPreview ? (
							<div className="rounded-lg border bg-card p-5">
								<div className="flex items-center gap-2 mb-4 pb-3 border-b">
									<ScrollText className="size-4 text-muted-foreground" />
									<span className="text-sm font-medium">Texto de la Ley</span>
									<span className="text-xs text-muted-foreground ml-auto">
										{law.full_text!.length.toLocaleString()} caracteres
									</span>
								</div>
								<div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line max-h-[55vh] overflow-y-auto">
									{textPreview}
								</div>
								{law.full_text!.length > 3000 && (
									<p className="text-xs text-muted-foreground text-center mt-4 pt-3 border-t">
										El texto completo está disponible en el PDF oficial.
									</p>
								)}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center gap-3 py-12 text-center rounded-lg border border-dashed">
								<FileText className="size-10 text-muted-foreground/40" />
								<p className="text-sm text-muted-foreground max-w-xs">
									El texto de esta ley aún no ha sido extraído. Usa el botón 
									"Abrir PDF oficial" para consultarla.
								</p>
							</div>
						)}
					</div>
				</SheetDescription>
			</SheetContent>
		</Sheet>
	);
}
