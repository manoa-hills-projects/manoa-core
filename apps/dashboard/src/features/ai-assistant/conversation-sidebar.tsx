import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  useConversations,
  useDeleteConversation,
} from "./api/use-conversations";
import { cn } from "@/lib/utils";
import {
  MessageSquarePlusIcon,
  Trash2Icon,
  MessageSquareIcon,
} from "lucide-react";

interface ConversationSidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function ConversationSidebar({
  activeId,
  onSelect,
  onNewChat,
}: ConversationSidebarProps) {
  const { data: conversations, isLoading } = useConversations();
  const deleteMutation = useDeleteConversation();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between border-b px-3 py-3">
        <h2 className="text-sm font-semibold">Conversaciones</h2>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onNewChat}
          title="Nueva conversación"
        >
          <MessageSquarePlusIcon className="size-4" />
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
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 pr-7 text-left text-sm transition-colors hover:bg-accent",
                    activeId === conv.id && "bg-accent font-medium",
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
                        if (activeId === conv.id) onNewChat();
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
    </div>
  );
}
