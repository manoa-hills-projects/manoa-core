import { Document, usePDF } from "@react-pdf/renderer";
import { Download, FileCheck, Loader2, Printer } from "lucide-react";
import QRCode from "qrcode";
import { useState } from "react";
import type { Citizen } from "@/entities/citizens";
import { useCitizens } from "@/entities/citizens";
import { useCreateDocument } from "@/entities/documents";
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
	const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
	const [isEmitting, setIsEmitting] = useState(false);

	const { mutateAsync: createDocument } = useCreateDocument();
	const { data: sessionData } = authClient.useSession();
	const userId = sessionData?.user?.id;

	const { data: userCitizensResponse } = useCitizens(
		{ pageIndex: 0, pageSize: 1 },
		{ user_id: userId },
	);

	const loggedInCitizen = userCitizensResponse?.data?.[0];

	// Use the PDF generation hook inline when the sheet is opened
	const [instance] = usePDF({
		document:
			citizen && qrCodeBase64 ? (
				<ResidencyLetterPDF
					citizen={citizen}
					loggedInCitizen={loggedInCitizen}
					sessionUser={sessionData?.user}
					qrCodeBase64={qrCodeBase64}
				/>
			) : (
				<Document />
			),
	});

	if (!citizen) return null;

	const handleEmitDocument = async () => {
		setIsEmitting(true);
		try {
			// 1. Emite el certificado en DB
			const { data } = await createDocument({
				documentType: "CARTA_RESIDENCIA",
				citizenId: citizen.id,
			});
			const docId = data.id;

			// 2. Generar QR Code
			const verificationUrl = `https://manoa-backoffice.pages.dev/verify/${docId}`;
			const dataUri = await QRCode.toDataURL(verificationUrl, {
				width: 256,
				margin: 1,
			});

			setQrCodeBase64(dataUri);
		} catch (error) {
			console.error("Error al emitir el documento", error);
		} finally {
			setIsEmitting(false);
		}
	};

	const handleOpenChange = () => {
		if (qrCodeBase64) setQrCodeBase64(null);
		onOpenChange();
	};

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
			onOpenChange={handleOpenChange}
			title="Carta de Residencia"
			description={`Generando documento oficial para ${citizen.names} ${citizen.surnames}`}
		>
			<div className="flex flex-col h-[70vh]">
				{!qrCodeBase64 ? (
					<div className="flex-1 flex flex-col items-center justify-center text-center gap-6 p-6">
						<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
							<FileCheck className="w-8 h-8 text-primary" />
						</div>
						<div className="max-w-md space-y-2">
							<h3 className="text-lg font-medium">
								Emisión de Certificado Autorizado
							</h3>
							<p className="text-sm text-muted-foreground">
								Esta acción generará un identificador único en la base de datos
								y adjuntará un Código QR verificable en el documento para
								garantizar su autenticidad oficial.
							</p>
						</div>
						<Button
							size="lg"
							onClick={handleEmitDocument}
							disabled={isEmitting}
						>
							{isEmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Emitiendo y sellando...
								</>
							) : (
								"Emitir Certificado con QR"
							)}
						</Button>
					</div>
				) : (
					<>
						{instance.loading && (
							<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
								<p>Compilando documento final...</p>
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
					</>
				)}
			</div>
		</DataSheet>
	);
}
