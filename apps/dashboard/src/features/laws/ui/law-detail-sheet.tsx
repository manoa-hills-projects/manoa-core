import type { Law } from "@/entities/laws/model/types";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";
import { ExternalLink, FileText, MessageSquare, ScrollText } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Link } from "@tanstack/react-router";

interface LawDetailSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	law: Law | null;
}

export function LawDetailSheet({ open, onOpenChange, law }: LawDetailSheetProps) {
	if (!law) return null;

	const summary = law.full_text && law.full_text.length > 30 ? law.full_text : null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="sm:max-w-lg p-0 flex flex-col">
				<SheetHeader className="px-4 pt-4 pb-0">
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
					<div className="flex flex-col gap-4 px-4 pb-4 pt-4 overflow-y-auto">
						{summary ? (
							<div className="rounded-lg border bg-card p-4">
								<div className="flex items-center gap-2 mb-3">
									<ScrollText className="size-4 text-muted-foreground" />
									<span className="text-sm font-medium">Resumen</span>
								</div>
								<p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
									{summary}
								</p>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center gap-3 py-8 text-center rounded-lg border border-dashed">
								<FileText className="size-8 text-muted-foreground/40" />
								<p className="text-sm text-muted-foreground max-w-xs">
									Esta ley aún no tiene resumen. Sincroniza las leyes para obtenerlo.
								</p>
							</div>
						)}

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
									Preguntar al asistente IA
								</Link>
							</Button>
						</div>
					</div>
				</SheetDescription>
			</SheetContent>
		</Sheet>
	);
}
