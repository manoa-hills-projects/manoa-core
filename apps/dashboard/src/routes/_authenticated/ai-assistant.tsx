import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useState } from "react";
import { ManoaChat } from "@/features/ai-assistant/chat";
import { ConversationSidebar } from "@/features/ai-assistant/conversation-sidebar";
import { Loader2Icon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-assistant")({
  component: ManoaAssistantPage,
});

function ManoaAssistantPage() {
  const [conversationId, setConversationId] = useState(() =>
    crypto.randomUUID(),
  );

  const handleNewChat = useCallback(() => {
    setConversationId(crypto.randomUUID());
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <ConversationSidebar
        activeId={conversationId}
        onSelect={(id: string) => setConversationId(id as `${string}-${string}-${string}-${string}-${string}`)}
        onNewChat={handleNewChat}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Suspense fallback={<ChatSkeleton />}>
          <ManoaChat key={conversationId} conversationId={conversationId} />
        </Suspense>
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
