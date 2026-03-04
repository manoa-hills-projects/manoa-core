import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import type { House } from "./types";

export const columnHelper = createColumnHelper<House>();

export const houseColumns: ColumnDef<House>[] = [
	columnHelper.accessor("sector", {
		header: "Sector",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("address", {
		header: "Dirección",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor((row) => `${row.number}`, {
		id: "houseNumber",
		header: "Nro de Vivienda",
		cell: (info) => info.getValue(),
	}),
] as Array<ColumnDef<House, unknown>>;
