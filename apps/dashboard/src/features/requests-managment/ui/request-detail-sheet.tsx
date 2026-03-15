import { CheckCircle, FileDown, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
	DocumentRequest,
	ResidencyLetterPayload,
} from "@/entities/requests";
import {
	downloadRequestDocument,
	REQUEST_STATUS_COLORS,
	REQUEST_STATUS_LABELS,
	REQUEST_TYPE_LABELS,
	useReviewRequest,
} from "@/entities/requests";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";
import { Textarea } from "@/shared/ui/textarea";

interface RequestDetailSheetProps {
	request: DocumentRequest | null;
	open: boolean;
	onClose: () => void;
}

export function RequestDetailSheet({
	request,
	open,
	onClose,
}: RequestDetailSheetProps) {
	const { data: sessionData } = authClient.useSession();
	const role = (sessionData?.user?.role ?? "user") as string;
	const isAdmin = role === "admin" || role === "superadmin";

	const [rejectionReason, setRejectionReason] = useState("");
	const [showRejectForm, setShowRejectForm] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);

	const { mutateAsync: reviewRequest, isPending: isReviewing } =
		useReviewRequest(request?.id ?? "");

	if (!request) return null;

	const payload = JSON.parse(request.payload) as ResidencyLetterPayload;
	const statusClass = REQUEST_STATUS_COLORS[request.status];

	const handleApprove = async () => {
		try {
			await reviewRequest({ status: "approved" });
			toast.success("Solicitud aprobada correctamente");
			onClose();
		} catch {
			toast.error("Error al aprobar la solicitud");
		}
	};

	const handleReject = async () => {
		if (!rejectionReason.trim()) {
			toast.error("Debe ingresar un motivo de rechazo");
			return;
		}
		try {
			await reviewRequest({ status: "rejected", rejectionReason });
			toast.success("Solicitud rechazada");
			setShowRejectForm(false);
			onClose();
		} catch {
			toast.error("Error al rechazar la solicitud");
		}
	};

	const handleDownload = async () => {
		setIsDownloading(true);
		try {
			await downloadRequestDocument(request.id);
			toast.success("Documento descargado");
		} catch {
			toast.error("No se pudo descargar el documento");
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={(v) => !v && onClose()}>
			<SheetContent className="overflow-y-auto w-full sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>{REQUEST_TYPE_LABELS[request.type]}</SheetTitle>
					<SheetDescription>
						Detalle de la solicitud y datos para el documento.
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-4 text-sm">
					{/* Status badge */}
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground font-medium">Estado:</span>
						<span
							className={cn(
								"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
								statusClass,
							)}
						>
							{REQUEST_STATUS_LABELS[request.status]}
						</span>
					</div>

					{request.status === "rejected" && request.rejectionReason && (
						<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
							<p className="font-medium">Motivo de rechazo:</p>
							<p className="mt-1">{request.rejectionReason}</p>
						</div>
					)}

					{/* Payload fields */}
					<div className="rounded-lg border bg-muted/30 p-4 space-y-2">
						<h4 className="font-semibold mb-3">Datos del ciudadano</h4>
						{[
							["Nombre completo", payload.fullName],
							["Cédula", payload.idNumber],
							["Nacionalidad", payload.nationality],
							["Años de residencia", String(payload.yearsOfResidence)],
							["Calle", payload.streetName],
							["Casa Nro.", payload.houseNumber],
							[
								"Fecha de emisión",
								`${payload.issueDay} de ${payload.issueMonth} del 2025`,
							],
						].map(([label, value]) => (
							<div key={label} className="flex justify-between gap-2">
								<span className="text-muted-foreground">{label}:</span>
								<span className="font-medium text-right">{value}</span>
							</div>
						))}
					</div>

					{/* Dates */}
					<div className="text-xs text-muted-foreground space-y-1">
						<p>Creado: {new Date(request.createdAt).toLocaleString("es-VE")}</p>
					</div>
				</div>

				{/* Action buttons */}
				<div className="mt-6 space-y-3">
					{/* Download (approved only) */}
					{request.status === "approved" && (
						<Button
							className="w-full"
							variant="outline"
							onClick={handleDownload}
							disabled={isDownloading}
						>
							{isDownloading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<FileDown className="mr-2 h-4 w-4" />
							)}
							Descargar PDF
						</Button>
					)}

					{/* Admin review (pending only) */}
					{isAdmin && request.status === "pending" && (
						<>
							{showRejectForm ? (
								<div className="space-y-2">
									<Label>Motivo del rechazo</Label>
									<Textarea
										value={rejectionReason}
										onChange={(e) => setRejectionReason(e.target.value)}
										placeholder="Explica el motivo del rechazo..."
										rows={3}
									/>
									<div className="flex gap-2">
										<Button
											variant="outline"
											className="flex-1"
											onClick={() => setShowRejectForm(false)}
										>
											Cancelar
										</Button>
										<Button
											variant="destructive"
											className="flex-1"
											onClick={handleReject}
											disabled={isReviewing}
										>
											{isReviewing && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)}
											Confirmar rechazo
										</Button>
									</div>
								</div>
							) : (
								<div className="flex gap-2">
									<Button
										variant="outline"
										className="flex-1 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
										onClick={() => setShowRejectForm(true)}
										disabled={isReviewing}
									>
										<XCircle className="mr-2 h-4 w-4" />
										Rechazar
									</Button>
									<Button
										className="flex-1 bg-emerald-600 hover:bg-emerald-700"
										onClick={handleApprove}
										disabled={isReviewing}
									>
										{isReviewing ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<CheckCircle className="mr-2 h-4 w-4" />
										)}
										Aprobar
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
