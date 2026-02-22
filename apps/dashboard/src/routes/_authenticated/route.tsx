import { MainLayout } from '@/widgets/main-layout'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),
})