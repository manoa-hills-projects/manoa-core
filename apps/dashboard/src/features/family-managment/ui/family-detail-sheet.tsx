import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { type Citizen, useCitizens } from "@/entities/citizens";
import { citizenColumns } from "@/entities/citizens/model/columns";
import type { Family } from "@/entities/families";
import { DataTable } from "@/shared/ui/data-table";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";

interface FamilyDetailSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	family: Family | null;
}

export function FamilyDetailSheet({
	open,
	onOpenChange,
	family,
}: FamilyDetailSheetProps) {
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

	const { data: response } = useCitizens(pagination, { family_id: family?.id });

	const columns = useMemo<ColumnDef<Citizen>[]>(() => {
		return citizenColumns;
	}, []);

	if (!family) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				showCloseButton
				className="sm:max-w-xl outline-none"
			>
				<SheetHeader>
					<SheetTitle>Detalles de la Familia</SheetTitle>
					<SheetDescription>
						<div className="mb-4">
							<div>
								<b>Nombre de Familia:</b> {family.family_name}
							</div>
							<div className="mt-2">
								<b>Vivienda:</b> {family.house_label || "No especificada"}
							</div>
							<div className="mt-2">
								<b>Jefe de Hogar:</b>{" "}
								{family.head_of_household_label || "No asignado"}
							</div>
						</div>

						<div className="mt-8">
							<h3 className="text-sm font-semibold mb-3">
								Miembros de la Familia
							</h3>
							<DataTable
								columns={columns}
								data={response?.data ?? []}
								rowCount={response?.metadata?.total ?? 0}
								pagination={pagination}
								onPaginationChange={setPagination}
							/>
						</div>
					</SheetDescription>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
}
