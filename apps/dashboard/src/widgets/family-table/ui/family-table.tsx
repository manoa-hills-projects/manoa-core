import { useDebounce } from "@uidotdev/usehooks";
import { useState } from "react";
import { useFamilies } from "@/entities/families";
import { familyColumns } from "@/entities/families/model/columns";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { FamilyFormSheet } from "./family-form-sheet";

export function FamilyTable() {
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearch = useDebounce(searchTerm, 500);

	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const { data } = useFamilies(pagination, {
		search: debouncedSearch,
	});

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center">
				<Input
					placeholder="Buscar por nombre de familia..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-sm"
				/>
				<Button onClick={() => setIsSheetOpen(true)}>Registrar Familia</Button>
			</div>

			<DataTable
				columns={familyColumns}
				data={data?.data || []}
				rowCount={data?.metadata?.total || 0}
				pagination={pagination}
				onPaginationChange={setPagination}
			/>

			<FamilyFormSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
		</div>
	);
}
