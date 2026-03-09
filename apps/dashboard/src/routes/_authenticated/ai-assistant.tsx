import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useState } from "react";
import { ManoaChat } from "@/features/ai-assistant/chat";
import { ConversationSidebar } from "@/features/ai-assistant/conversation-sidebar";
import { MobileChatView } from "@/features/ai-assistant/mobile-chat-view";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2Icon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-assistant")({
  component: ManoaAssistantPage,
});

function ManoaAssistantPage() {
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  const isMobile = useIsMobile();

  const handleNewChat = useCallback(() => {
    setConversationId(crypto.randomUUID());
  }, []);

  const handleSelect = useCallback((id: string) => {
    setConversationId(id as `${string}-${string}-${string}-${string}-${string}`);
  }, []);

  if (isMobile) {
    return (
      <MobileChatView
        conversationId={conversationId}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <ConversationSidebar
        activeId={conversationId}
        onSelect={handleSelect}
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
