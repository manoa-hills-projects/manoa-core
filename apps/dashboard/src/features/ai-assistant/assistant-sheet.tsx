import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { ManoaChat } from "./chat";

interface AssistantSheetProps {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssistantSheet({ conversationId, open, onOpenChange }: AssistantSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 max-w-full w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Asistente IA</SheetTitle>
        </SheetHeader>
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          <ManoaChat conversationId={conversationId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
