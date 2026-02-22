import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'
import { AppHeader } from '@/widgets/app-header/ui/app-header'
import { AppSidebar } from '@/widgets/app-sidebar/ui/app-sidebar'

export function MainLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<AppHeader />
				<main className="flex flex-1 flex-col gap-4 p-4 pt-0">
					{children}
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}