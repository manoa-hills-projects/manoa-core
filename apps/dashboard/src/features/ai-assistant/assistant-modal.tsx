import { useChat } from "@ai-sdk/react";
import { BotIcon, ChevronDownIcon, SparklesIcon, ArrowUpIcon, SquareIcon } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";

export function AssistantModal() {
	const [open, setOpen] = useState(false);
	const viewportRef = useRef<HTMLDivElement>(null);

	const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setInput } = useChat({
		api: `${import.meta.env.VITE_API_URL || "http://localhost:8787/api"}/ai/chat`,
		credentials: "include",
		onFinish: () => {
			setTimeout(() => {
				viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
			}, 100);
		},
	});

	const onSubmit = useCallback((e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;
		handleSubmit(e);
		setInput("");
	}, [input, isLoading, handleSubmit, setInput]);

	return createPortal(
		<>
			{open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

			<div className="fixed end-4 bottom-4 z-50">
				<div className={`absolute bottom-16 right-0 w-80 max-w-[calc(100vw-2rem)] md:w-96 rounded-[2rem] border bg-background shadow-2xl overflow-hidden transition-all duration-200 ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-2 pointer-events-none"}`}>
					<div className="flex h-[480px] max-h-[70vh] flex-col">
						<div className="flex items-center px-4 py-2.5 border-b shrink-0">
							<SparklesIcon className="size-4 text-primary mr-2" />
							<span className="text-sm font-medium">Manoa IA</span>
						</div>

						<div ref={viewportRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
							{messages.length === 0 && (
								<div className="flex h-full items-center justify-center">
									<div className="text-center space-y-2 px-4">
										<SparklesIcon className="size-8 text-primary/40 mx-auto" />
										<p className="text-sm text-muted-foreground">
											Pregúntame sobre el censo, trámites o leyes de la comunidad.
										</p>
									</div>
								</div>
							)}
							{messages.map((msg, i) => (
								<div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
									{msg.role === "assistant" && (
										<SparklesIcon className="size-5 text-primary shrink-0 mt-0.5 mr-2" />
									)}
									<div className={cn(
										"rounded-2xl px-3 py-2 max-w-[85%] text-sm leading-relaxed",
										msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : ""
									)}>
										{msg.role === "assistant" ? (
											<MarkdownRenderer content={msg.content} />
										) : (
											<p className="whitespace-pre-wrap">{msg.content}</p>
										)}
									</div>
								</div>
							))}
							{isLoading && (
								<div className="flex justify-start">
									<SparklesIcon className="size-5 text-primary shrink-0 mt-0.5 mr-2" />
									<div className="flex items-center gap-2 px-2 py-2">
										<div className="flex gap-1">
											<div className="size-1.5 rounded-full bg-primary/60 animate-bounce" />
											<div className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.1s]" />
											<div className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
										</div>
									</div>
								</div>
							)}
						</div>

						<form onSubmit={onSubmit} className="border-t px-3 py-2 flex items-center gap-2 shrink-0">
							<input
								value={input}
								onChange={handleInputChange}
								placeholder="Pregúntame..."
								className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
							/>
							{isLoading ? (
								<Button type="button" size="icon" variant="ghost" className="size-8 rounded-full" onClick={stop}>
									<SquareIcon className="size-3.5" />
								</Button>
							) : (
								<Button type="submit" size="icon" variant="ghost" className="size-8 rounded-full" disabled={!input.trim()}>
									<ArrowUpIcon className="size-4" />
								</Button>
							)}
						</form>
					</div>
				</div>

				<Button onClick={() => setOpen(!open)} variant="default" className="size-11 rounded-full shadow-lg">
					{open ? <ChevronDownIcon className="size-6" /> : <BotIcon className="size-6" />}
				</Button>
			</div>
		</>,
		document.body
	);
}

const MarkdownRenderer = memo(function MarkdownRenderer({ content }: { content: string }) {
	return <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm leading-relaxed prose-sm max-w-none"
		components={{
			p: ({ ...props }) => <p className="my-1 first:mt-0 last:mb-0" {...props} />,
			strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
			ul: ({ ...props }) => <ul className="my-1 ml-4 list-disc marker:text-muted-foreground" {...props} />,
			ol: ({ ...props }) => <ol className="my-1 ml-4 list-decimal marker:text-muted-foreground" {...props} />,
			li: ({ ...props }) => <li className="text-sm leading-relaxed" {...props} />,
		}}
	/>;
});
