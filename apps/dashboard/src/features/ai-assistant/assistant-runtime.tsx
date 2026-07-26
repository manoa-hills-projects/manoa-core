import { useCallback, useMemo } from "react";
import { useExternalStoreRuntime } from "@assistant-ui/react";
import { RuntimeAdapterProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@/features/ai-assistant/api/use-chat-runtime";
import type { ReactNode } from "react";

function useAssistantBridge(conversationId: string) {
	const chat = useChatRuntime(conversationId);

	const runtime = useExternalStoreRuntime({
		convertMessage: (message) => message as any,
		messages: chat.messages as any,
		isRunning: chat.status === "submitted" || chat.status === "streaming",
		onSend: useCallback((parentId: string | null, content: string) => {
			chat.sendMessage({ role: "user", parts: [{ type: "text", text: content } as any] });
		}, [chat]),
		onCancel: chat.stop,
	});

	return runtime;
}

export function AssistantRuntimeBridge({
	conversationId,
	children,
}: {
	conversationId: string;
	children: ReactNode;
}) {
	const runtime = useAssistantBridge(conversationId);
	return (
		<RuntimeAdapterProvider adapters={{ chatModel: {} as any }}>
			{children}
		</RuntimeAdapterProvider>
	);
}
