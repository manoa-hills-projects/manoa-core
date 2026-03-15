import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	Calendar,
	CheckCircle2,
	FileText,
	Loader2,
	ShieldCheck,
	User,
	XCircle,
} from "lucide-react";
import { api } from "@/shared/api/api-client";

export const Route = createFileRoute("/verify/$id")({
	component: VerifyDocumentPage,
});

function VerifyDocumentPage() {
	const { id } = Route.useParams();

	const { data, isLoading, isError } = useQuery({
		queryKey: ["verify-document", id],
		queryFn: async () => {
			const res = await api.get(`documents/verify/${id}`).json<{ data: any }>();
			return res.data;
		},
		retry: false,
	});

	return (
		<div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
				{/* Header Branding */}
				<div className="bg-neutral-900 p-6 flex flex-col items-center justify-center text-white">
					<ShieldCheck className="w-12 h-12 mb-2 text-emerald-400" />
					<h1 className="text-xl font-bold tracking-tight">
						Sistema de Verificación
					</h1>
					<p className="text-sm text-neutral-400">
						Plataforma de Certificación de Documentos
					</p>
				</div>

				<div className="p-6">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-12 space-y-4">
							<Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
							<p className="text-neutral-500 font-medium animate-pulse">
								Consultando registro matriz...
							</p>
						</div>
					) : isError || !data ? (
						<div className="flex flex-col items-center text-center space-y-4 py-6">
							<div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-2">
								<XCircle className="w-10 h-10 text-red-600" />
							</div>
							<h2 className="text-2xl font-bold text-neutral-900">
								Documento Inválido
							</h2>
							<p className="text-neutral-500 bg-red-50 p-4 rounded-xl text-sm border border-red-100">
								El código QR escaneado no corresponde a un documento válido o el
								mismo ha sido revocado del sistema.
							</p>
						</div>
					) : (
						<div className="space-y-6">
							<div className="flex flex-col items-center text-center space-y-2 py-4 border-b border-neutral-100">
								<div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
									<CheckCircle2 className="w-10 h-10 text-emerald-600" />
								</div>
								<h2 className="text-2xl font-bold text-neutral-900">
									Documento Auténtico
								</h2>
								<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
									Certificado Activo
								</span>
							</div>

							<div className="space-y-4">
								<div className="flex items-start space-x-3">
									<FileText className="w-5 h-5 text-neutral-400 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-neutral-500">
											Tipo de Documento
										</p>
										<p className="text-neutral-900 font-semibold">
											{data.documentType}
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-3">
									<User className="w-5 h-5 text-neutral-400 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-neutral-500">
											Titular / Ciudadano
										</p>
										<p className="text-neutral-900 font-semibold capitalize">
											{data.citizenNames ? data.citizenNames.toLowerCase() : ""}{" "}
											{data.citizenSurnames
												? data.citizenSurnames.toLowerCase()
												: ""}
											{!data.citizenNames &&
												!data.citizenSurnames &&
												"Ciudadano No Registrado"}
										</p>
										<p className="text-xs text-neutral-500 mt-0.5">
											C.I / DNI: {data.citizenDni || "N/A"}
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-3">
									<Calendar className="w-5 h-5 text-neutral-400 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-neutral-500">
											Fecha de Emisión
										</p>
										<p className="text-neutral-900">
											{format(new Date(data.issuedAt), "PPP 'a las' p", {
												locale: es,
											})}
										</p>
									</div>
								</div>
							</div>

							<div className="mt-8 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
								<p className="text-xs text-neutral-400 text-center break-all">
									ID: {data.id}
									<br />
									HASH: {data.hash.slice(0, 16)}...
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="bg-neutral-50 p-4 text-center border-t border-neutral-100">
					<p className="text-xs text-neutral-400">
						© {new Date().getFullYear()} Manoa Core. Todos los derechos
						reservados.
					</p>
				</div>
			</div>
		</div>
	);
}
