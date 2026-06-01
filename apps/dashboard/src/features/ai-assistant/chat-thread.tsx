import {
	ArrowDownIcon,
	ArrowUpIcon,
	CopyIcon,
	CheckIcon,
	Loader2Icon,
	SquareIcon,
} from "lucide-react";
import {
	type FormEvent,
	type KeyboardEvent,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import type { ChatStatus, UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";

interface ChatThreadProps {
	messages: UIMessage[];
	status: ChatStatus;
	onSend: (message: { role: "user"; parts: [{ type: "text"; text: string }] }) => void;
	onStop: () => void;
}

export function ChatThread({ messages, status, onSend, onStop }: ChatThreadProps) {
	const [input, setInput] = useState("");
	const viewportRef = useRef<HTMLDivElement>(null);
	const [showScrollButton, setShowScrollButton] = useState(false);

	const isRunning = status === "submitted" || status === "streaming";
	const isEmpty = messages.length === 0;

	const scrollToBottom = useCallback(() => {
		const viewport = viewportRef.current;
		if (viewport) {
			viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
		}
	}, []);

	useEffect(() => {
		if (isRunning) {
			scrollToBottom();
		}
	}, [messages, isRunning, scrollToBottom]);

	const handleScroll = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const { scrollTop, scrollHeight, clientHeight } = viewport;
		setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
	}, []);

	const handleSubmit = useCallback(
		(e?: FormEvent) => {
			e?.preventDefault();
			const text = input.trim();
			if (!text || isRunning) return;
			onSend({ role: "user", parts: [{ type: "text", text }] });
			setInput("");
		},
		[input, isRunning, onSend],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
		},
		[handleSubmit],
	);

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Viewport */}
			<div
				ref={viewportRef}
				onScroll={handleScroll}
				className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-4"
			>
				{isEmpty ? (
					<WelcomeScreen onSuggestionClick={(text) => onSend({ role: "user", parts: [{ type: "text", text }] })} />
				) : (
					<div className="mx-auto w-full max-w-3xl space-y-4 pb-4">
						{messages.map((message) => (
							<MessageBubble key={message.id} message={message} />
						))}
						{status === "submitted" && <TypingIndicator />}
					</div>
				)}

				{/* Composer footer */}
				<div className="sticky bottom-0 mx-auto w-full max-w-3xl pb-4 pt-2 md:pb-6">
					{showScrollButton && (
						<Button
							variant="outline"
							size="icon"
							className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 rounded-full shadow-md"
							onClick={scrollToBottom}
						>
							<ArrowDownIcon className="size-4" />
						</Button>
					)}
					<Composer
						input={input}
						onInputChange={setInput}
						onSubmit={handleSubmit}
						onStop={onStop}
						onKeyDown={handleKeyDown}
						isRunning={isRunning}
					/>
				</div>
			</div>
		</div>
	);
}

/* ─── Welcome Screen ─── */

function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
	const suggestions = [
		{ title: "Resumen del censo", description: "¿Cuántas familias hay registradas?" },
		{ title: "Estadísticas", description: "¿Cuántos habitantes hay por sector?" },
		{ title: "Trámites", description: "¿Qué necesito para una carta de residencia?" },
		{ title: "Leyes", description: "¿Qué dice la Ley de los Consejos Comunales?" },
	];

	return (
		<div className="mx-auto flex w-full max-w-3xl grow flex-col items-center justify-center px-4">
			<h1 className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both font-bold text-3xl duration-200">
				¡Hola, soy Manoa IA! 🏙️
			</h1>
			<p className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both text-muted-foreground text-lg delay-75 duration-200">
				¿En qué puedo ayudarte hoy con los datos de tu comunidad?
			</p>
			<div className="mt-6 grid w-full grid-cols-1 gap-2 md:grid-cols-2">
				{suggestions.map((s) => (
					<button
						key={s.title}
						type="button"
						onClick={() => onSuggestionClick(s.description)}
						className="flex flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
					>
						<span className="font-medium">{s.title}</span>
						<span className="text-muted-foreground">{s.description}</span>
					</button>
				))}
			</div>
		</div>
	);
}

/* ─── Message Bubble ─── */

function MessageBubble({ message }: { message: UIMessage }) {
	const isUser = message.role === "user";
	const textParts = message.parts.filter(
		(p): p is { type: "text"; text: string } => p.type === "text",
	);
	const text = textParts.map((p) => p.text).join("");

	if (isUser) {
		return (
			<div className="flex justify-end">
				<div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5">
					<p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex justify-start">
			<div className="max-w-[85%] px-2">
				<div className="prose prose-sm max-w-none text-sm leading-relaxed">
					<MarkdownRenderer content={text} />
				</div>
				<MessageActions text={text} />
			</div>
		</div>
	);
}

/* ─── Message Actions ─── */

function MessageActions({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(() => {
		if (!text || copied) return;
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}, [text, copied]);

	return (
		<div className="mt-1 flex items-center gap-1 text-muted-foreground">
			<Button
				variant="ghost"
				size="icon"
				className="size-7"
				onClick={handleCopy}
				title="Copiar"
			>
				{copied ? (
					<CheckIcon className="size-3.5" />
				) : (
					<CopyIcon className="size-3.5" />
				)}
			</Button>
		</div>
	);
}

/* ─── Typing Indicator ─── */

function TypingIndicator() {
	return (
		<div className="flex justify-start">
			<div className="flex items-center gap-2 px-2 py-3 text-muted-foreground text-sm">
				<Loader2Icon className="size-4 animate-spin" />
				<span>Pensando...</span>
			</div>
		</div>
	);
}

/* ─── Composer ─── */

interface ComposerProps {
	input: string;
	onInputChange: (value: string) => void;
	onSubmit: (e?: FormEvent) => void;
	onStop: () => void;
	onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
	isRunning: boolean;
}

function Composer({
	input,
	onInputChange,
	onSubmit,
	onStop,
	onKeyDown,
	isRunning,
}: ComposerProps) {
	return (
		<form onSubmit={onSubmit} className="flex w-full flex-col rounded-2xl border bg-background px-1 pt-2 shadow-sm">
			<textarea
				value={input}
				onChange={(e) => onInputChange(e.target.value)}
				onKeyDown={onKeyDown}
				placeholder="Escribe un mensaje..."
				className="mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-muted-foreground"
				rows={1}
				autoFocus
			/>
			<div className="mx-2 mb-2 flex items-center justify-end">
				{isRunning ? (
					<Button
						type="button"
						variant="default"
						size="icon"
						className="size-8 rounded-full"
						onClick={onStop}
						title="Detener generación"
					>
						<SquareIcon className="size-3 fill-current" />
					</Button>
				) : (
					<Button
						type="submit"
						variant="default"
						size="icon"
						className="size-8 rounded-full"
						disabled={!input.trim()}
						title="Enviar mensaje"
					>
						<ArrowUpIcon className="size-4" />
					</Button>
				)}
			</div>
		</form>
	);
}

/* ─── Markdown Renderer ─── */

const MarkdownRenderer = memo(function MarkdownRenderer({ content }: { content: string }) {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				p: ({ className, ...props }) => (
					<p className={cn("my-2.5 leading-normal first:mt-0 last:mb-0", className)} {...props} />
				),
				ul: ({ className, ...props }) => (
					<ul className={cn("my-2 ml-4 list-disc marker:text-muted-foreground [&>li]:mt-1", className)} {...props} />
				),
				ol: ({ className, ...props }) => (
					<ol className={cn("my-2 ml-4 list-decimal marker:text-muted-foreground [&>li]:mt-1", className)} {...props} />
				),
				li: ({ className, ...props }) => (
					<li className={cn("leading-normal", className)} {...props} />
				),
				a: ({ className, ...props }) => (
					<a className={cn("text-primary underline underline-offset-2 hover:text-primary/80", className)} {...props} />
				),
				strong: ({ className, ...props }) => (
					<strong className={cn("font-semibold", className)} {...props} />
				),
				code: ({ className, ...props }) => (
					<code className={cn("rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 font-mono text-[0.85em]", className)} {...props} />
				),
				pre: ({ className, ...props }) => (
					<pre className={cn("overflow-x-auto rounded-lg border border-border/50 bg-muted/30 p-3 text-xs leading-relaxed", className)} {...props} />
				),
				blockquote: ({ className, ...props }) => (
					<blockquote className={cn("my-2.5 border-muted-foreground/30 border-l-2 pl-3 text-muted-foreground italic", className)} {...props} />
				),
				h1: ({ className, ...props }) => (
					<h1 className={cn("mb-2 scroll-m-20 font-semibold text-base first:mt-0 last:mb-0", className)} {...props} />
				),
				h2: ({ className, ...props }) => (
					<h2 className={cn("mt-3 mb-1.5 scroll-m-20 font-semibold text-sm first:mt-0 last:mb-0", className)} {...props} />
				),
				h3: ({ className, ...props }) => (
					<h3 className={cn("mt-2.5 mb-1 scroll-m-20 font-semibold text-sm first:mt-0 last:mb-0", className)} {...props} />
				),
				table: ({ className, ...props }) => (
					<table className={cn("my-2 w-full border-separate border-spacing-0 overflow-y-auto", className)} {...props} />
				),
				th: ({ className, ...props }) => (
					<th className={cn("bg-muted px-2 py-1 text-left font-medium first:rounded-tl-lg last:rounded-tr-lg", className)} {...props} />
				),
				td: ({ className, ...props }) => (
					<td className={cn("border-muted-foreground/20 border-b border-l px-2 py-1 text-left last:border-r", className)} {...props} />
				),
				tr: ({ className, ...props }) => (
					<tr className={cn("m-0 border-b p-0 first:border-t", className)} {...props} />
				),
				hr: ({ className, ...props }) => (
					<hr className={cn("my-2 border-muted-foreground/20", className)} {...props} />
				),
			}}
		>
			{content}
		</ReactMarkdown>
	);
});
