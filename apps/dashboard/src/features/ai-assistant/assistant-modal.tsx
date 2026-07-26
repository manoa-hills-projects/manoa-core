import { AssistantModalPrimitive } from "@assistant-ui/react";
import { BotIcon, ChevronDownIcon, SparklesIcon } from "lucide-react";
import { forwardRef, lazy, Suspense, useState } from "react";
import { Button } from "@/shared/ui/button";

const LazyChatContent = lazy(() => import("./chat-popover-content"));

export function AssistantModal() {
	const [hasBeenOpened, setHasBeenOpened] = useState(false);

	return (
		<AssistantModalPrimitive.Root onOpenChange={(open) => {
			if (open) setHasBeenOpened(true);
		}}>
			<AssistantModalPrimitive.Anchor className="fixed end-4 bottom-4 size-11 z-50">
				<AssistantModalPrimitive.Trigger asChild>
					<AssistantModalButton />
				</AssistantModalPrimitive.Trigger>
			</AssistantModalPrimitive.Anchor>
			<AssistantModalPrimitive.Content
				sideOffset={16}
				className="z-50 h-100 max-h-[80vh] w-72 max-w-[calc(100vw-2rem)] md:h-120 md:w-96 overflow-hidden rounded-[2.5rem] border bg-background p-0 shadow-xl"
			>
				<div className="flex h-full flex-col">
					<div className="flex items-center justify-between px-4 py-2.5 border-b">
						<span className="text-sm font-medium flex items-center gap-2">
							<SparklesIcon className="size-4 text-primary" />
							Manoa IA
						</span>
					</div>
					<div className="flex-1 overflow-hidden">
						{hasBeenOpened ? (
							<Suspense fallback={
								<div className="flex h-full items-center justify-center">
									<p className="text-sm text-muted-foreground animate-pulse">Conectando...</p>
								</div>
							}>
								<LazyChatContent />
							</Suspense>
						) : (
							<div className="flex h-full items-center justify-center p-6 text-center">
								<div className="space-y-3">
									<SparklesIcon className="size-8 text-primary/40 mx-auto" />
									<p className="text-sm text-muted-foreground">
										Tu asistente comunitario. Pregúntame sobre el censo, trámites o leyes.
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</AssistantModalPrimitive.Content>
		</AssistantModalPrimitive.Root>
	);
}

const AssistantModalButton = forwardRef<HTMLButtonElement, { "data-state"?: "open" | "closed" }>(
	function AssistantModalButton({ "data-state": state, ...rest }, ref) {
		return (
			<Button ref={ref as any} {...rest} variant="default" className="size-full rounded-full shadow-lg">
				<BotIcon className="absolute size-6 transition-all data-[state=closed]:scale-100 data-[state=open]:scale-0" data-state={state} />
				<ChevronDownIcon className="absolute size-6 transition-all data-[state=closed]:scale-0 data-[state=open]:scale-100" data-state={state} />
			</Button>
		);
	}
);
