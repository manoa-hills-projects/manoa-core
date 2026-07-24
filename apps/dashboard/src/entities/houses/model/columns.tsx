import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Building2, Hash, Map as MapIcon, Phone, Pin } from "lucide-react";
import type { House } from "./types";

export const columnHelper = createColumnHelper<House>();

export const houseColumns: ColumnDef<House>[] = [
	columnHelper.accessor("sector", {
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<MapIcon className="size-3.5" /> Sector
			</div>
		),
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("address", {
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Pin className="size-3.5" /> Dirección
			</div>
		),
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor((row) => `${row.number}`, {
		id: "houseNumber",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Hash className="size-3.5" /> Nro
			</div>
		),
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("phone", {
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Phone className="size-3.5" /> Teléfono
			</div>
		),
		cell: (info) => info.getValue() || "-",
	}),
	columnHelper.accessor("type", {
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Building2 className="size-3.5" /> Tipo
			</div>
		),
		cell: (info) => {
			const v = info.getValue();
			const labels: Record<string, string> = { casa: "Casa", apartamento: "Apartamento", rancho: "Rancho", local: "Local", otro: "Otro" };
			return v ? labels[v] ?? v : "-";
		},
	}),
] as Array<ColumnDef<House, unknown>>;
