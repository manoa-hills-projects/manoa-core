import { ChatThread } from "./chat-thread";
import { useChatRuntime } from "./api/use-chat-runtime";

export function ManoaChat({ conversationId }: { conversationId: string }) {
	const { messages, status, sendMessage, stop } = useChatRuntime(conversationId);

	return (
		<ChatThread
			messages={messages}
			status={status}
			onSend={sendMessage}
			onStop={stop}
		/>
	);
}
