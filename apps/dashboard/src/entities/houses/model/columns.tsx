import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { House } from "./types"
import { Button } from "@/shared/ui/button"

export const columnHelper = createColumnHelper<House>()

export const houseColumns: ColumnDef<House>[] = [
  columnHelper.accessor('sector', {
    header: 'Sector',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('address', {
    header: 'Dirección',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor(row => `${row.number}`, {
    id: 'houseNumber',
    header: 'Nro de Casa',
    cell: info => info.getValue(),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Acciones',
    cell: props => (
      <Button onClick={() => console.log("Editando casa:", props.row.original.id)}>
        Editar
      </Button>
    ),
  })
] as Array<ColumnDef<House, unknown>>