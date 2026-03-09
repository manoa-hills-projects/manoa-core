import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useState } from "react";
import { ManoaChat } from "@/features/ai-assistant/chat";
import { ConversationSidebar } from "@/features/ai-assistant/conversation-sidebar";
import { AssistantSheet } from "@/features/ai-assistant/assistant-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2Icon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-assistant")({
  component: ManoaAssistantPage,
});

function ManoaAssistantPage() {
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleNewChat = useCallback(() => {
    setConversationId(crypto.randomUUID());
  }, []);

  if (isMobile) {
    return (
      <>
        <button
          className="fixed bottom-6 right-6 z-50 rounded-full bg-primary px-6 py-3 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          onClick={() => setOpen(true)}
        >
          Asistente IA
        </button>
        <AssistantSheet
          conversationId={conversationId}
          open={open}
          onOpenChange={setOpen}
        />
      </>
    );
  }

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
