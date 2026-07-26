import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { ChatThread } from "./chat-thread";
import { useChatRuntime } from "./api/use-chat-runtime";
import { Button } from "@/shared/ui/button";

export default function ChatPopoverContent() {
	const conversationId = useMemo(() => crypto.randomUUID(), []);
	const chat = useChatRuntime(conversationId);

	if (chat.status === "error") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
				<AlertTriangleIcon className="size-8 text-destructive/60" />
				<p className="text-sm text-muted-foreground">Error de conexión con el asistente.</p>
				<Button variant="outline" size="sm" onClick={() => window.location.reload()}>
					<RefreshCwIcon className="size-4 mr-2" />
					Reintentar
				</Button>
			</div>
		);
	}

	return (
		<ChatThread
			messages={chat.messages}
			status={chat.status}
			onSend={chat.sendMessage}
			onStop={chat.stop}
			placeholder="Pregúntame sobre tu comunidad..."
			compact
		/>
	);
}
