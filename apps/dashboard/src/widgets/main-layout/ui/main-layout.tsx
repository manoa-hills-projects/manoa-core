import { useCallback, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { MessageSquareIcon } from "lucide-react";
import { AssistantSheet } from "@/features/ai-assistant/assistant-sheet";
import { Button } from "@/shared/ui/button";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { AppHeader } from "@/widgets/app-header/ui/app-header";
import { AppSidebar } from "@/widgets/app-sidebar/ui/app-sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
	const { pathname } = useLocation();
	const isAiAssistant = pathname === "/ai-assistant";
	const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
	const [sheetOpen, setSheetOpen] = useState(false);

	const handleNewChat = useCallback(() => {
		setConversationId(crypto.randomUUID());
	}, []);

	const handleSelect = useCallback((id: string) => {
		setConversationId(id as `${string}-${string}-${string}-${string}-${string}`);
	}, []);

	return (
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

			{/* Floating assistant button */}
			{!isAiAssistant && (
				<div className="fixed bottom-6 right-6 z-50">
					<Button
						type="button"
						onClick={() => setSheetOpen(true)}
						className="h-14 w-14 rounded-full shadow-lg"
						size="icon"
					>
						<MessageSquareIcon className="size-6" />
					</Button>
				</div>
			)}

			<AssistantSheet
				conversationId={conversationId}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				onSelect={handleSelect}
				onNewChat={handleNewChat}
			/>
		</SidebarProvider>
	);
}
