import { useDebounce } from "@uidotdev/usehooks";
import { useState } from "react";
import { useCitizens } from "@/entities/citizens/api/use-citizens";
import { citizenColumns } from "@/entities/citizens/model/columns";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { CitizenFormSheet } from "./citizen-form-sheet";

export function CitizenTable() {
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearch = useDebounce(searchTerm, 500);

	const [pagination, setPagination] = useState({ pageIndex: 1, pageSize: 10 });
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const { data } = useCitizens(pagination, {
		search: debouncedSearch,
	});

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center">
				<Input
					placeholder="Buscar por cédula..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-sm"
				/>
				<Button onClick={() => setIsSheetOpen(true)}>
					Registrar Ciudadano
				</Button>
			</div>

			<DataTable
				columns={citizenColumns}
				data={data?.data || []}
				rowCount={data?.metadata?.total || 0}
				pagination={pagination}
				onPaginationChange={setPagination}
			/>

			<CitizenFormSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
		</div>
	);
}
