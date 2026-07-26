import { useMemo } from "react";
import { ChatThread } from "./chat-thread";
import { useChatRuntime } from "./api/use-chat-runtime";

export default function ChatPopoverContent() {
	const conversationId = useMemo(() => crypto.randomUUID(), []);
	const chat = useChatRuntime(conversationId);

	return (
		<ChatThread
			key={conversationId}
			messages={chat.messages}
			status={chat.status}
			onSend={chat.sendMessage}
			onStop={chat.stop}
			placeholder="Pregúntame..."
			compact
		/>
	);
}
