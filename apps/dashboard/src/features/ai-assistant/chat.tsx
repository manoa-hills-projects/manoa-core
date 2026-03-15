import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/shared/ui/assistant-ui/thread";
import { useChatRuntime } from "./api/use-chat-runtime";

export function ManoaChat({ conversationId }: { conversationId: string }) {
	const runtime = useChatRuntime(conversationId);

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<Thread />
		</AssistantRuntimeProvider>
	);
}
