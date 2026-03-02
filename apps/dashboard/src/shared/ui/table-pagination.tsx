import {
	ChevronFirst,
	ChevronLast,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import type { Table } from "@tanstack/react-table";
import { useId } from "react";

import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

interface TablePaginationProps<TData> {
	table: Table<TData>;
	rowCount: number;
}

export function TablePagination<TData>({
	table,
	rowCount,
}: TablePaginationProps<TData>) {
	const pageSizeSelectId = useId();
	const pageIndex = table.getState().pagination.pageIndex;
	const pageSize = table.getState().pagination.pageSize;
	const pageCount = table.getPageCount();

	const canPreviousPage = table.getCanPreviousPage();
	const canNextPage = table.getCanNextPage();

	const totalPages = Math.max(1, pageCount);
	const start = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
	const end = Math.min((pageIndex + 1) * pageSize, rowCount);

	const generatePaginationLinks = () => {
		if (totalPages <= 5) {
			return Array.from({ length: totalPages }, (_, index) => index);
		}

		const links: Array<number | "ellipsis-left" | "ellipsis-right"> = [0];
		const left = Math.max(1, pageIndex - 1);
		const right = Math.min(totalPages - 2, pageIndex + 1);

		if (left > 1) links.push("ellipsis-left");

		for (let page = left; page <= right; page += 1) {
			links.push(page);
		}

		if (right < totalPages - 2) links.push("ellipsis-right");

		links.push(totalPages - 1);

		return links;
	};

	const pageLinks = generatePaginationLinks();

	return (
		<div className="flex w-full flex-wrap items-center justify-between gap-4 p-4 max-sm:justify-center">
			<div className="flex shrink-0 items-center gap-3">
				<Label htmlFor={pageSizeSelectId}>Filas por página</Label>
				<Select
					value={`${pageSize}`}
					onValueChange={(value) => table.setPageSize(Number(value))}
				>
					<SelectTrigger id={pageSizeSelectId} className="h-8 w-fit whitespace-nowrap">
						<SelectValue placeholder="Selecciona cantidad" />
					</SelectTrigger>
					<SelectContent className="[&_*[role=option]]:pr-8 [&_*[role=option]]:pl-2 [&_*[role=option]>span]:right-2 [&_*[role=option]>span]:left-auto">
						{[10, 20, 30, 40, 50].map((size) => (
							<SelectItem key={size} value={`${size}`}>
								{size}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="text-muted-foreground flex grow items-center justify-end whitespace-nowrap max-sm:justify-center">
				<p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
					Mostrando <span className="text-foreground">{start}</span> a{" "}
					<span className="text-foreground">{end}</span> de{" "}
					<span className="text-foreground">{rowCount}</span> resultados
				</p>
			</div>
			<Pagination className="w-fit max-sm:mx-0">
				<PaginationContent>
					<PaginationItem>
						<Button
							variant="outline"
							size="icon"
							className="rounded-full"
							onClick={() => table.setPageIndex(0)}
							disabled={!canPreviousPage}
						>
							<span className="sr-only">Ir a la primera página</span>
							<ChevronFirst className="size-4" />
						</Button>
					</PaginationItem>
					<PaginationItem>
						<Button
							variant="outline"
							size="icon"
							className="rounded-full"
							onClick={() => table.previousPage()}
							disabled={!canPreviousPage}
						>
							<span className="sr-only">Ir a la página anterior</span>
							<ChevronLeft className="size-4" />
						</Button>
					</PaginationItem>

					{pageLinks.map((page) => {
						if (page === "ellipsis-left" || page === "ellipsis-right") {
							return (
								<PaginationItem
									key={page}
									className="max-sm:hidden"
								>
									<Tooltip>
										<TooltipTrigger asChild>
											<PaginationEllipsis />
										</TooltipTrigger>
										<TooltipContent>
											<p>Hay más páginas</p>
										</TooltipContent>
									</Tooltip>
								</PaginationItem>
							);
						}

						const isCurrentPage = page === pageIndex;

						return (
							<PaginationItem
								key={`page-${page}`}
								className={
									isCurrentPage
										? ""
										: "max-sm:hidden"
								}
							>
								<PaginationLink
									href="#"
									isActive={isCurrentPage}
									className="rounded-full"
									onClick={(event) => {
										event.preventDefault();
										table.setPageIndex(page);
									}}
								>
									{page + 1}
								</PaginationLink>
							</PaginationItem>
						);
					})}

					<PaginationItem>
						<Button
							variant="outline"
							size="icon"
							className="rounded-full"
							onClick={() => table.nextPage()}
							disabled={!canNextPage}
						>
							<span className="sr-only">Ir a la página siguiente</span>
							<ChevronRight className="size-4" />
						</Button>
					</PaginationItem>
					<PaginationItem>
						<Button
							variant="outline"
							size="icon"
							className="rounded-full"
							onClick={() => table.setPageIndex(totalPages - 1)}
							disabled={!canNextPage}
						>
							<span className="sr-only">Ir a la última página</span>
							<ChevronLast className="size-4" />
						</Button>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}
