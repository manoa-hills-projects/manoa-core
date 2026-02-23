import {
	type ColumnDef,
	type PaginationState,
	type OnChangeFn,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table"

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"

interface DataTableProps<TData> {
	columns: ColumnDef<TData>[]
	data: TData[]
	rowCount: number
	pagination: PaginationState
	onPaginationChange: OnChangeFn<PaginationState>
}

export function DataTable<TData>({
	columns,
	data,
	rowCount,
	pagination,
	onPaginationChange,
}: DataTableProps<TData>) {
	const table = useReactTable({
		data,
		columns,
		rowCount,
		state: { pagination },
		onPaginationChange,
		manualPagination: true,
		getCoreRowModel: getCoreRowModel(),
	})

	return (
		<div className="overflow-hidden rounded-md border">
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(
											header.column.columnDef.header,
											header.getContext()
										)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No hay resultados.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			{/* FOOTER DE PAGINACIÓN */}
			<div className="flex items-center justify-between px-4 py-4 border-t">
				<div className="text-sm text-muted-foreground">
					Mostrando {table.getRowModel().rows.length} de {rowCount} filas
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Anterior
					</Button>
					<div className="text-sm font-medium">
						Página {pagination.pageIndex + 1} de {table.getPageCount()}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Siguiente
					</Button>
				</div>
			</div>
		</div>
	)
}