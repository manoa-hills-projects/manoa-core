import { useDebouncedValue } from "@tanstack/react-pacer";
import { useState } from "react";

import { houseColumns, useHouses } from "@/entities/houses";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { HouseFormSheet } from "./house-form-sheet";

export function HouseTable() {
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
	const [search, setSearch] = useState("");
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const [debouncedSearch] = useDebouncedValue(search, {
		wait: 500,
	});

	const { data: response, isLoading } = useHouses(
		{
			pageIndex: pagination.pageIndex,
			pageSize: pagination.pageSize,
		},
		{
			search: debouncedSearch,
		},
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 w-full max-w-sm">
					<Input
						placeholder="Buscar casa o sector..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						}}
					/>
					{isLoading && (
						<span className="text-sm animate-pulse whitespace-nowrap">Buscando...</span>
					)}
				</div>
				<Button onClick={() => setIsSheetOpen(true)}>Registrar Casa</Button>
			</div>

			<DataTable
				columns={houseColumns}
				data={response?.data ?? []}
				rowCount={response?.metadata?.total ?? 0}
				pagination={pagination}
				onPaginationChange={setPagination}
			/>

			<HouseFormSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
		</div>
	);
}
