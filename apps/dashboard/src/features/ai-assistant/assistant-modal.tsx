import { useCallback, useState } from "react";
import { XIcon, SparklesIcon } from "lucide-react";
import { ChatThread } from "@/features/ai-assistant/chat-thread";
import { useChatRuntime } from "@/features/ai-assistant/api/use-chat-runtime";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

export function AssistantModal() {
	const [open, setOpen] = useState(false);
	const [conversationId, setConversationId] = useState(() => crypto.randomUUID());

	const chat = useChatRuntime(conversationId);

	const handleNewChat = useCallback(() => {
		setConversationId(crypto.randomUUID());
	}, []);

	return (
		<>
			{/* Floating button */}
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
			>
				<SparklesIcon className="size-6" />
			</button>

			{/* Sheet modal */}
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col" showCloseButton>
					<div className="flex items-center justify-between px-4 py-3 border-b">
						<SheetTitle className="text-sm">Manoa IA</SheetTitle>
						<div className="flex items-center gap-1">
							<Button variant="ghost" size="icon-xs" onClick={handleNewChat} title="Nuevo chat">
								<SparklesIcon className="size-4" />
							</Button>
						</div>
					</div>
					<div className="flex-1 overflow-hidden">
						<ChatThread
							key={conversationId}
							messages={chat.messages}
							status={chat.status}
							onSend={chat.sendMessage}
							onStop={chat.stop}
							placeholder="Pregúntame sobre tu comunidad..."
							compact
						/>
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
