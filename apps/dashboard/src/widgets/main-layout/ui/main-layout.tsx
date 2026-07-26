import { useLocation } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SparklesIcon } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { AppHeader } from "@/widgets/app-header/ui/app-header";
import { AppSidebar } from "@/widgets/app-sidebar/ui/app-sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
	const { pathname } = useLocation();
	const isAiAssistant = pathname === "/ai-assistant";

	return (
		<>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<AppHeader />
					<main
						className={
							isAiAssistant
								? "flex flex-1 flex-col"
								: "flex flex-1 flex-col gap-6 px-4 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8 lg:px-10 lg:pt-8"
						}
					>
						{children}
					</main>
				</SidebarInset>
			</SidebarProvider>

			{!isAiAssistant && (
				<Link
					to="/ai-assistant"
					className="fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
				>
					<SparklesIcon className="size-6" />
				</Link>
			)}
		</>
	);
}
