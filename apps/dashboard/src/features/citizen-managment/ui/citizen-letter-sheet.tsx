import { Document, usePDF } from "@react-pdf/renderer";
import { Download, Loader2, Printer } from "lucide-react";
import type { Citizen } from "@/entities/citizens";
import { useCitizens } from "@/entities/citizens";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import { ResidencyLetterPDF } from "./residency-letter-pdf";

interface CitizenLetterSheetProps {
	citizen: Citizen | null;
	onOpenChange: () => void;
}

export function CitizenLetterSheet({
	citizen,
	onOpenChange,
}: CitizenLetterSheetProps) {

	const { data: sessionData } = authClient.useSession();
	const userId = sessionData?.user?.id;

	const { data: userCitizensResponse } = useCitizens(
		{ pageIndex: 0, pageSize: 1 },
		{ user_id: userId },
	);

	const loggedInCitizen = userCitizensResponse?.data?.[0];

	// Use the PDF generation hook inline when the sheet is opened
	const [instance] = usePDF({
		document: citizen ? (
			<ResidencyLetterPDF
				citizen={citizen}
				loggedInCitizen={loggedInCitizen}
				sessionUser={sessionData?.user}
			/>
		) : (
			<Document />
		),
	});

	if (!citizen) return null;

	const handlePrint = () => {
		if (instance.url) {
			// Open standard print dialog for PDFs
			const printWindow = window.open(instance.url, "_blank");
			if (printWindow) {
				printWindow.onload = () => {
					printWindow.print();
				};
			}
		}
	};

	return (
		<DataSheet
			open={!!citizen}
			onOpenChange={onOpenChange}
			title="Carta de Residencia"
			description={`Generando documento oficial para ${citizen.names} ${citizen.surnames}`}
		>
			<div className="flex flex-col h-[70vh]">
				{instance.loading && (
					<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p>Compilando documento...</p>
					</div>
				)}

				{instance.error && (
					<div className="flex-1 flex items-center justify-center text-destructive">
						<p>Ups, ocurrió un error generando la carta.</p>
					</div>
				)}

				{!instance.loading && !instance.error && instance.url && (
					<>
						<div className="flex-1 border rounded-md overflow-hidden bg-muted/20 mb-4">
							<iframe
								src={`${instance.url}#toolbar=0&navpanes=0`}
								className="w-full h-full"
								title="Vista previa Carta de Residencia"
							/>
						</div>

						<div className="flex gap-2 justify-end mt-auto pt-4 border-t">
							<Button variant="outline" onClick={handlePrint}>
								<Printer className="mr-2 h-4 w-4" />
								Imprimir
							</Button>

							<Button asChild>
								<a
									href={instance.url}
									download={`CartaRecidencia_${citizen.cedula}.pdf`}
								>
									<Download className="mr-2 h-4 w-4" />
									Descargar PDF
								</a>
							</Button>
						</div>
					</>
				)}
			</div>
		</DataSheet>
	);
}
