import { Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { importReportCsv, type ReportResource } from "@/entities/reports";
import { Button } from "@/shared/ui/button";

interface ImportCsvButtonProps {
	resource: ReportResource;
}

export function ImportCsvButton({ resource }: ImportCsvButtonProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [isImporting, setIsImporting] = useState(false);

	const handlePickFile = () => {
		inputRef.current?.click();
	};

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];

		if (!selectedFile) return;

		setIsImporting(true);

		try {
			const result = await importReportCsv({ resource, file: selectedFile });

			if (result.failedRows > 0) {
				toast.warning(
					`Importación parcial: ${result.importedRows}/${result.totalRows} filas importadas.`,
				);
			} else {
				toast.success(
					`Importación completada: ${result.importedRows} filas importadas.`,
				);
			}
		} catch {
			toast.error("No se pudo importar el CSV");
		} finally {
			setIsImporting(false);
			event.target.value = "";
		}
	};

	return (
		<>
			<input
				ref={inputRef}
				type="file"
				accept=".csv,text/csv"
				className="hidden"
				onChange={handleFileChange}
			/>
			<Button variant="outline" onClick={handlePickFile} disabled={isImporting}>
				<Upload className="h-4 w-4" />
				{isImporting ? "Importando..." : "Importar CSV"}
			</Button>
		</>
	);
}
