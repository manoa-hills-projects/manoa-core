import { BotIcon, ChevronDownIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { ManoaChat } from "./chat";
import { Button } from "@/shared/ui/button";

export function AssistantModal() {
	const [open, setOpen] = useState(false);
	const [conversationId, setConversationId] = useState(() => crypto.randomUUID());

	return (
		<>
			{open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

			<div className="fixed end-4 bottom-4 z-50">
				{open && (
					<div className="absolute bottom-16 right-0 w-80 max-w-[calc(100vw-2rem)] md:w-96 rounded-[2rem] border bg-background shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
						<div className="flex h-[480px] max-h-[70vh] flex-col">
							<div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
								<span className="text-sm font-medium flex items-center gap-2">
									<SparklesIcon className="size-4 text-primary" />
									Manoa IA
								</span>
							</div>
							<div className="flex-1 overflow-hidden">
								<ManoaChat key={conversationId} conversationId={conversationId} />
							</div>
						</div>
					</div>
				)}

				<Button onClick={() => setOpen(!open)} variant="default" className="size-11 rounded-full shadow-lg">
					{open ? <ChevronDownIcon className="size-6" /> : <BotIcon className="size-6" />}
				</Button>
			</div>
		</>
	);
}
