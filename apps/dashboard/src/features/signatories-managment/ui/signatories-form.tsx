import { ImageIcon, Loader2, Save, Upload, UserCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { SignatoryRole } from "@/entities/signatories";
import {
	SIGNATORY_ROLE_LABELS,
	SIGNATORY_ROLES,
	useSignatories,
	useUpdateSignatory,
} from "@/entities/signatories";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";

// ----- Individual signatory card -----
interface SignatoryCardProps {
	role: SignatoryRole;
	initialName: string;
	initialIdNumber: string;
	initialSignatureImage: string | null;
}

function SignatoryCard({
	role,
	initialName,
	initialIdNumber,
	initialSignatureImage,
}: SignatoryCardProps) {
	const [name, setName] = useState(initialName);
	const [idNumber, setIdNumber] = useState(initialIdNumber);
	// selectedFile: File to upload | null to clear | undefined = no change
	const [selectedFile, setSelectedFile] = useState<File | null | undefined>(
		undefined,
	);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Sync when server data refreshes
	useEffect(() => {
		setName(initialName);
	}, [initialName]);
	useEffect(() => {
		setIdNumber(initialIdNumber);
	}, [initialIdNumber]);
	useEffect(() => {
		setSelectedFile(undefined);
		setPreviewUrl(null);
	}, [initialSignatureImage]);

	const { mutateAsync: update, isPending } = useUpdateSignatory(role);

	// Displayed image: new local preview > server base64 > nothing
	const displayedImage = previewUrl ?? initialSignatureImage ?? null;
	const hasClearedImage = selectedFile === null;

	const isDirty =
		name !== initialName ||
		idNumber !== initialIdNumber ||
		selectedFile !== undefined;

	const handleFileSelect = (file: File) => {
		if (!["image/png", "image/jpeg"].includes(file.type)) {
			toast.error("Solo se aceptan imágenes PNG o JPG");
			return;
		}
		if (file.size > 512_000) {
			toast.error("La imagen no debe superar 500 KB");
			return;
		}
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setSelectedFile(file);
		setPreviewUrl(URL.createObjectURL(file));
	};

	const handleClearImage = () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPreviewUrl(null);
		setSelectedFile(null); // null = explicit clear
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSave = async () => {
		try {
			await update({ name, idNumber, signatureImage: selectedFile });
			toast.success(`Firmante "${SIGNATORY_ROLE_LABELS[role]}" actualizado`);
		} catch {
			toast.error("Error al guardar el firmante");
		}
	};

	return (
		<div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm transition-shadow hover:shadow-md">
			<div className="flex items-center gap-2">
				<UserCheck className="h-4 w-4 text-primary" />
				<h3 className="font-semibold text-sm">{SIGNATORY_ROLE_LABELS[role]}</h3>
			</div>

			{/* Text fields */}
			<div className="grid gap-3">
				<div className="space-y-1.5">
					<Label htmlFor={`name-${role}`} className="text-xs">
						Nombre completo
					</Label>
					<Input
						id={`name-${role}`}
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Nombre del firmante"
						className="h-9 text-sm"
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor={`ci-${role}`} className="text-xs">
						Cédula de identidad
					</Label>
					<Input
						id={`ci-${role}`}
						value={idNumber}
						onChange={(e) => setIdNumber(e.target.value)}
						placeholder="Ej: V-12345678"
						className="h-9 text-sm"
					/>
				</div>
			</div>

			{/* Signature image */}
			<div className="space-y-1.5">
				<Label className="text-xs">Firma escaneada</Label>

				{displayedImage && !hasClearedImage ? (
					/* ── Preview ── */
					<div className="relative group rounded-lg border bg-muted/30 p-3 flex items-center justify-center h-24">
						<img
							src={displayedImage}
							alt="Firma"
							className="max-h-full max-w-full object-contain"
						/>
						<button
							type="button"
							onClick={handleClearImage}
							className="absolute top-1.5 right-1.5 rounded-full bg-destructive/90 text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
							title="Quitar firma"
						>
							<X className="h-3 w-3" />
						</button>
					</div>
				) : (
					/* ── Drop zone ── */
					<div
						role="button"
						tabIndex={0}
						onClick={() => fileInputRef.current?.click()}
						onKeyDown={(e) =>
							e.key === "Enter" && fileInputRef.current?.click()
						}
						onDragOver={(e) => {
							e.preventDefault();
							setIsDragging(true);
						}}
						onDragLeave={() => setIsDragging(false)}
						onDrop={(e) => {
							e.preventDefault();
							setIsDragging(false);
							const file = e.dataTransfer.files[0];
							if (file) handleFileSelect(file);
						}}
						className={cn(
							"flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed h-24 cursor-pointer transition-colors text-muted-foreground",
							isDragging
								? "border-primary bg-primary/5 text-primary"
								: "border-border hover:border-primary/50 hover:bg-muted/30",
						)}
					>
						{hasClearedImage ? (
							<>
								<ImageIcon className="h-5 w-5 text-muted-foreground/50" />
								<p className="text-xs">
									Firma eliminada — sube una nueva o guarda sin firma
								</p>
							</>
						) : (
							<>
								<Upload className="h-5 w-5" />
								<p className="text-xs font-medium">
									Arrastra o haz clic para subir
								</p>
								<p className="text-[10px] text-muted-foreground">
									PNG o JPG · máx. 500 KB
								</p>
							</>
						)}
					</div>
				)}

				<input
					ref={fileInputRef}
					type="file"
					accept="image/png,image/jpeg"
					className="hidden"
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) handleFileSelect(file);
					}}
				/>
			</div>

			<div className="flex justify-end">
				<Button
					size="sm"
					onClick={handleSave}
					disabled={isPending || !isDirty}
					className="gap-1.5"
				>
					{isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Save className="h-3.5 w-3.5" />
					)}
					Guardar
				</Button>
			</div>
		</div>
	);
}

// ----- Main form -----
export function SignatoriesForm() {
	const { data, isLoading, isError } = useSignatories();
	const signatories = data?.data ?? [];

	if (isLoading) {
		return (
			<div className="grid gap-4 sm:grid-cols-2">
				{SIGNATORY_ROLES.map((role) => (
					<Skeleton key={role} className="h-72 rounded-xl" />
				))}
			</div>
		);
	}

	if (isError) {
		return (
			<p className="text-sm text-destructive">
				Error al cargar los firmantes. Intenta recargar la página.
			</p>
		);
	}

	const sigMap = Object.fromEntries(
		signatories.map((s) => [s.role, s]),
	) as Record<SignatoryRole, (typeof signatories)[number] | undefined>;

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{SIGNATORY_ROLES.map((role) => (
				<SignatoryCard
					key={role}
					role={role}
					initialName={sigMap[role]?.name ?? ""}
					initialIdNumber={sigMap[role]?.idNumber ?? ""}
					initialSignatureImage={sigMap[role]?.signatureImage ?? null}
				/>
			))}
		</div>
	);
}
