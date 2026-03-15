import { IconFileTypeCsv } from "@tabler/icons-react";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { exportReportCsv, type ReportResource } from "@/entities/reports";
import { downloadFile } from "@/shared/lib/download-file";
import { Button } from "@/shared/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface ExportMenuButtonProps {
	resource: ReportResource;
	search?: string;
}

export function ExportMenuButton({ resource, search }: ExportMenuButtonProps) {
	const [isExporting, setIsExporting] = useState(false);

	const handleExportCsv = async () => {
		setIsExporting(true);

		try {
			const { blob, fileName } = await exportReportCsv({ resource, search });
			downloadFile(blob, fileName);
			toast.success("Reporte CSV exportado correctamente");
		} catch {
			toast.error("No se pudo exportar el reporte");
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" disabled={isExporting}>
					{isExporting ? "Exportando..." : "Exportar"}
					<ChevronsUpDown className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuGroup>
					<DropdownMenuLabel>Formatos</DropdownMenuLabel>
					<DropdownMenuItem onClick={handleExportCsv} disabled={isExporting}>
						<IconFileTypeCsv className="h-4 w-4" />
						CSV
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
