import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Hash, Map as MapIcon, Pin } from "lucide-react";
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
				<Hash className="size-3.5" /> Nro de Vivienda
			</div>
		),
		cell: (info) => info.getValue(),
	}),
] as Array<ColumnDef<House, unknown>>;
