import { Button } from '@/shared/ui/button'
import { HouseTable } from '@/widgets/house-table/ui/house-table'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/houses')({
  component: RouteComponent,
  staticData: {
    breadcrumb: 'Viviendas',
  },
})

function RouteComponent() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Viviendas</h1>
          <p className="text-muted-foreground">
            Gestión de ubicación y sectores del censo.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Registrar Casa
        </Button>
      </div>

      <HouseTable />
    </>
  )
}
