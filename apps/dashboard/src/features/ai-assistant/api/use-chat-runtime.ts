import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { useAgent } from "agents/react";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";
import type { useChat } from "@ai-sdk/react";

const getApiHost = () =>
  (import.meta.env.VITE_API_URL || "http://localhost:8787")
    .replace(/^https?:\/\//, "")
    .replace(/\/api\/?$/, "");

export const useChatRuntime = (conversationId: string) => {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const hasInvalidated = useRef(false);

  const body = useMemo(() => ({ userId }), [userId]);

  const agent = useAgent({
    agent: "ChatAgent",
    name: conversationId,
    host: getApiHost(),
  });

  const onFinish = useCallback(() => {
    if (!hasInvalidated.current) {
      hasInvalidated.current = true;
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [queryClient]);

  const chat = useAgentChat({
    agent,
    body,
    onFinish,
  });

  return useAISDKRuntime(chat as unknown as ReturnType<typeof useChat>);
};
