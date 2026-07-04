import { IconPhoto, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

interface ReceiptUploaderProps {
	label?: string;
	value: File | null;
	onChange: (file: File | null) => void;
	previewKey?: string | null;
	previewUrl?: string | null;
	disabled?: boolean;
}

/**
 * Selector de comprobante (imagen). Valida tamaño y tipo en cliente,
 * muestra preview cuando el usuario elige un archivo o cuando se pasa
 * un `previewUrl` (para pagos ya subidos).
 */
export function ReceiptUploader({
	label = "Comprobante",
	value,
	onChange,
	previewUrl,
	disabled,
}: ReceiptUploaderProps) {
	const [error, setError] = useState<string | null>(null);
	const [localPreview, setLocalPreview] = useState<string | null>(null);

	useEffect(() => {
		if (!value) {
			setLocalPreview(null);
			return;
		}
		const url = URL.createObjectURL(value);
		setLocalPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [value]);

	const onFileSelected = useCallback(
		(file: File | null) => {
			setError(null);
			if (!file) {
				onChange(null);
				return;
			}
			if (file.size > MAX_BYTES) {
				setError("El comprobante excede 5 MB");
				return;
			}
			if (!/^image\//i.test(file.type)) {
				setError("Solo se aceptan imágenes (JPG, PNG, WebP, HEIC)");
				return;
			}
			onChange(file);
		},
		[onChange],
	);

	const preview = localPreview ?? previewUrl ?? null;

	return (
		<div className="flex flex-col gap-2">
			<Label>{label}</Label>

			{preview ? (
				<div className="relative overflow-hidden rounded-md border">
					<img
						src={preview}
						alt="Comprobante"
						className="w-full max-h-64 object-contain bg-muted"
					/>
					{!disabled && (
						<Button
							size="sm"
							variant="secondary"
							type="button"
							className="absolute right-2 top-2"
							onClick={() => onFileSelected(null)}
						>
							<IconX className="h-4 w-4" /> Quitar
						</Button>
					)}
				</div>
			) : (
				<label
					className={`flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-muted-foreground ${
						disabled
							? "cursor-not-allowed opacity-60"
							: "cursor-pointer hover:bg-muted/40"
					}`}
				>
					<IconPhoto className="h-8 w-8" />
					<span>Elegí una imagen del comprobante</span>
					<span className="text-xs">JPG, PNG, WebP · máx 5 MB</span>
					<input
						type="file"
						accept={ACCEPT}
						className="hidden"
						disabled={disabled}
						onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
					/>
				</label>
			)}

			{error && (
				<p className="text-xs text-destructive" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
