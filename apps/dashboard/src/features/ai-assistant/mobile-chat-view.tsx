import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Skeleton } from "@/shared/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { cn } from "@/lib/utils";
import {
  HistoryIcon,
  MessageSquarePlusIcon,
  MessageSquareIcon,
  Trash2Icon,
} from "lucide-react";
import { ManoaChat } from "./chat";
import { useConversations, useDeleteConversation } from "./api/use-conversations";

interface MobileChatViewProps {
  conversationId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function MobileChatView({ conversationId, onSelect, onNewChat }: MobileChatViewProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { data: conversations, isLoading } = useConversations();
  const deleteMutation = useDeleteConversation();

  const handleSelect = (id: string) => {
    onSelect(id);
    setShowHistory(false);
  };

  const handleNewChat = () => {
    onNewChat();
    setShowHistory(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Header mobile */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-semibold">Asistente IA</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleNewChat}
            title="Nueva conversación"
          >
            <MessageSquarePlusIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowHistory(true)}
            title="Historial de conversaciones"
          >
            <HistoryIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ManoaChat key={conversationId} conversationId={conversationId} />
      </div>

      {/* Drawer de historial */}
      <Sheet open={showHistory} onOpenChange={setShowHistory}>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-sm">Conversaciones</SheetTitle>
          </SheetHeader>
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={handleNewChat}
            >
              <MessageSquarePlusIcon className="size-3.5" />
              Nueva conversación
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-0.5 p-2">
              {isLoading &&
                Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((id) => (
                  <Skeleton key={id} className="h-10 w-full rounded-md" />
                ))}

              {!isLoading && conversations?.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Sin conversaciones aún
                </p>
              )}

              {conversations
                ?.slice()
                .reverse()
                .map((conv) => (
                  <div key={conv.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => handleSelect(conv.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-2 pr-7 text-left text-sm transition-colors hover:bg-accent",
                        conversationId === conv.id && "bg-accent font-medium",
                      )}
                    >
                      <MessageSquareIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        {conv.title || "Nueva conversación"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteMutation.mutate(conv.id, {
                          onSuccess: () => {
                            if (conversationId === conv.id) handleNewChat();
                          },
                        });
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
