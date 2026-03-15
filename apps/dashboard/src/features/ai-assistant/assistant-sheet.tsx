import {
	HistoryIcon,
	MessageSquareIcon,
	MessageSquarePlusIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";
import { Skeleton } from "@/shared/ui/skeleton";
import {
	useConversations,
	useDeleteConversation,
} from "./api/use-conversations";
import { ManoaChat } from "./chat";

interface AssistantSheetProps {
	conversationId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (id: string) => void;
	onNewChat: () => void;
}

export function AssistantSheet({
	conversationId,
	open,
	onOpenChange,
	onSelect,
	onNewChat,
}: AssistantSheetProps) {
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
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="p-0 max-w-full w-full sm:max-w-md flex flex-col"
			>
				<SheetHeader className="border-b px-4 py-3 flex-row items-center justify-between space-y-0">
					<SheetTitle className="text-sm">Asistente IA</SheetTitle>
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
							variant={showHistory ? "secondary" : "ghost"}
							size="icon-xs"
							onClick={() => setShowHistory((v) => !v)}
							title="Historial"
						>
							<HistoryIcon className="size-4" />
						</Button>
					</div>
				</SheetHeader>

				<div className="relative flex-1 overflow-hidden">
					{/* Panel de historial (overlay) */}
					{showHistory && (
						<div className="absolute inset-0 z-10 flex flex-col bg-background">
							<div className="flex items-center justify-between border-b px-4 py-3">
								<span className="text-sm font-semibold">Conversaciones</span>
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() => setShowHistory(false)}
								>
									<XIcon className="size-4" />
								</Button>
							</div>
							<ScrollArea className="flex-1">
								<div className="flex flex-col gap-0.5 p-2">
									{isLoading &&
										Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map(
											(id) => (
												<Skeleton key={id} className="h-10 w-full rounded-md" />
											),
										)}

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
														conversationId === conv.id &&
															"bg-accent font-medium",
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
						</div>
					)}

					<div className="h-full flex flex-col">
						<ManoaChat key={conversationId} conversationId={conversationId} />
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
