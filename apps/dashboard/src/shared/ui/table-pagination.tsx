import {
	ChevronFirst,
	ChevronLast,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import type { Table } from "@tanstack/react-table";

import { Button } from "@/shared/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
} from "@/shared/ui/pagination";

interface TablePaginationProps<TData> {
	table: Table<TData>;
	rowCount: number;
}

export function TablePagination<TData>({
	table,
	rowCount,
}: TablePaginationProps<TData>) {
	const pageIndex = table.getState().pagination.pageIndex;
	const pageSize = table.getState().pagination.pageSize;
	const pageCount = table.getPageCount();

	const canPreviousPage = table.getCanPreviousPage();
	const canNextPage = table.getCanNextPage();

	// Calculate visible pages logic (simple version for now)
	const renderPageLinks = () => {
		const visiblePages = 5;
		let startPage = Math.max(0, pageIndex - Math.floor(visiblePages / 2));
		const endPage = Math.min(pageCount - 1, startPage + visiblePages - 1);

		if (endPage - startPage + 1 < visiblePages) {
			startPage = Math.max(0, endPage - visiblePages + 1);
		}

		const pages = [];
		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}
		return pages;
	};

	return (
		<div className="flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-4 sm:flex-row sm:gap-8">
			<div className="flex-1 whitespace-nowrap text-sm text-muted-foreground">
				Mostrando {Math.min(pageSize * (pageIndex + 1), rowCount)} de {rowCount}{" "}
				resultados
			</div>
			<div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
				<div className="flex items-center space-x-2">
					<p className="whitespace-nowrap text-sm font-medium">
						Filas por página
					</p>
					<Select
						value={`${pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue placeholder={pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[100px] items-center justify-center text-sm font-medium">
					Página {pageIndex + 1} de {pageCount}
				</div>
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!canPreviousPage}
							>
								<span className="sr-only">Ir a la primera página</span>
								<ChevronFirst className="h-4 w-4" />
							</Button>
						</PaginationItem>
						<PaginationItem>
							<Button
								variant="outline"
								className="h-8 w-8 p-0"
								onClick={() => table.previousPage()}
								disabled={!canPreviousPage}
							>
								<span className="sr-only">Anterior</span>
								<ChevronLeft className="h-4 w-4" />
							</Button>
						</PaginationItem>
						<PaginationItem>
							<Button
								variant="outline"
								className="h-8 w-8 p-0"
								onClick={() => table.nextPage()}
								disabled={!canNextPage}
							>
								<span className="sr-only">Siguiente</span>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</PaginationItem>
						<PaginationItem>
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(pageCount - 1)}
								disabled={!canNextPage}
							>
								<span className="sr-only">Ir a la última página</span>
								<ChevronLast className="h-4 w-4" />
							</Button>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	);
}
