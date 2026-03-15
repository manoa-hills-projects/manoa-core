import type { Law } from "@/entities/laws/model/types";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";
import { Badge } from "@/shared/ui/badge";
import { ExternalLink, FileText } from "lucide-react";
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

						{law.full_text ? (
							<div className="rounded-md border bg-muted/40 p-4">
								<div className="flex items-center justify-between mb-2">
									<Badge variant="secondary" className="text-xs">
										Texto completo
									</Badge>
								</div>
								<pre className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-sans max-h-[60vh] overflow-y-auto">
									{law.full_text}
								</pre>
							</div>
						) : (
							<p className="text-sm text-muted-foreground text-center py-8">
								El texto de esta ley aún no ha sido extraído. Ejecuta una
								sincronización para obtenerlo.
							</p>
						)}
					</div>
				</SheetDescription>
			</SheetContent>
		</Sheet>
	);
}
