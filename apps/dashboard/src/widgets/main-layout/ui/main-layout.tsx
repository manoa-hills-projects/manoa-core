import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { AppHeader } from "@/widgets/app-header/ui/app-header";
import { AppSidebar } from "@/widgets/app-sidebar/ui/app-sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<AppHeader />
				<main
					className="flex flex-1 flex-col gap-6 px-4 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8 lg:px-10 lg:pt-8"
				>
					{children}
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
