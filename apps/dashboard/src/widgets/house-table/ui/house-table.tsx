import { useState } from 'react'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { useHouses, houseColumns } from "@/entities/houses"
import { DataTable } from "@/shared/ui/data-table"
import { z } from 'zod'
import { useForm, useStore } from '@tanstack/react-form'

const formSchema = z.object({
  search: z.string().trim()
})

export function HouseTable() {
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
	const [search, setSearch] = useState("")
	const form = useForm({
		defaultValues: {
			search: ""
		},
		validators: {
			onSubmit: formSchema,
		},
	})

	const searchValue = useStore(form.store, (state) => state.values.search)
	
	const [debouncedSearch] = useDebouncedValue(searchValue, {
		wait: 500,
	})

	const { data: response, isLoading } = useHouses({
		pageIndex: pagination.pageIndex + 1,
		pageSize: pagination.pageSize,
	}, {
		search: debouncedSearch,
	})

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<input
					placeholder="Buscar casa o sector..."
					className="border rounded px-3 py-2 w-full max-w-sm"
					value={search}
					onChange={(e) => {
						setSearch(e.target.value)
						setPagination(prev => ({ ...prev, pageIndex: 0 }))
					}}
				/>
				{isLoading && <span className="text-sm animate-pulse">Buscando...</span>}
			</div>

			<DataTable
				columns={houseColumns}
				data={response?.data ?? []}
				rowCount={response?.metadata?.total ?? 0}
				pagination={pagination}
				onPaginationChange={setPagination}
			/>
		</div>
	)
}