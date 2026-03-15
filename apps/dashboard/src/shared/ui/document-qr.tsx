import { QRCodeSVG } from "qrcode.react";

export interface DocumentQRProps {
	documentId: string;
	size?: number;
}

export function DocumentQR({ documentId, size = 128 }: DocumentQRProps) {
	const baseUrl =
		typeof window !== "undefined"
			? window.location.origin
			: "https://manoa.app";
	const qrValue = `${baseUrl}/verify/${documentId}`;

	return (
		<div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-neutral-200 shadow-sm w-fit">
			<QRCodeSVG value={qrValue} size={size} level="Q" includeMargin={false} />
			<p className="mt-2 text-[10px] text-neutral-500 font-mono">
				ESCANEAR PARA VERIFICAR
			</p>
		</div>
	);
}
