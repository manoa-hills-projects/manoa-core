import { Component, useCallback, useState } from "react";
import { AlertTriangleIcon, SparklesIcon } from "lucide-react";
import { ChatThread } from "@/features/ai-assistant/chat-thread";
import { useChatRuntime } from "@/features/ai-assistant/api/use-chat-runtime";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

// ── Error Boundary ──

class ChatErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
	constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false }; }
	static getDerivedStateFromError() { return { hasError: true }; }
	render() {
		if (this.state.hasError) {
			return (
				<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
					<AlertTriangleIcon className="size-8 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">No se pudo conectar al asistente. Intenta de nuevo.</p>
					<Button variant="outline" size="sm" onClick={() => this.setState({ hasError: false })}>Reintentar</Button>
				</div>
			);
		}
		return this.props.children;
	}
}

// ── Chat Content ──

function ChatContent({ onNewChat }: { onNewChat: () => void }) {
	const [conversationId] = useState(() => crypto.randomUUID());
	const chat = useChatRuntime(conversationId);
	return (
		<ChatThread
			key={conversationId}
			messages={chat.messages}
			status={chat.status}
			onSend={chat.sendMessage}
			onStop={chat.stop}
			placeholder="Pregúntame sobre tu comunidad..."
			compact
		/>
	);
}

// ── Modal ──

export function AssistantModal() {
	const [open, setOpen] = useState(false);
	const [chatKey, setChatKey] = useState(0);

	const handleNewChat = useCallback(() => {
		setChatKey((k) => k + 1);
	}, []);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
			>
				<SparklesIcon className="size-6" />
			</button>

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
						<ChatErrorBoundary key={chatKey}>
							{open && <ChatContent onNewChat={handleNewChat} />}
						</ChatErrorBoundary>
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
