import {
	ArrowUpIcon,
	BotIcon,
	CopyIcon,
	CheckIcon,
	Loader2Icon,
	SparklesIcon,
	SquareIcon,
	UserIcon,
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
	placeholder?: string;
	compact?: boolean;
}

export function ChatThread({ messages, status, onSend, onStop, placeholder, compact }: ChatThreadProps) {
	const [input, setInput] = useState("");
	const viewportRef = useRef<HTMLDivElement>(null);

	const isRunning = status === "submitted" || status === "streaming";
	const isEmpty = messages.length === 0;

	const scrollToBottom = useCallback(() => {
		const viewport = viewportRef.current;
		if (viewport) {
			viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
		}
	}, []);

	useEffect(() => {
		if (isRunning) scrollToBottom();
	}, [messages, isRunning, scrollToBottom]);

	const handleSubmit = useCallback((e?: FormEvent) => {
		e?.preventDefault();
		const text = input.trim();
		if (!text || isRunning) return;
		onSend({ role: "user", parts: [{ type: "text", text }] });
		setInput("");
	}, [input, isRunning, onSend]);

	const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
	}, [handleSubmit]);

	return (
		<div className="flex h-full flex-col bg-background">
			<div ref={viewportRef} className="flex-1 overflow-y-auto scroll-smooth">
				{isEmpty ? (
					<WelcomeScreen onSuggestionClick={(text) => onSend({ role: "user", parts: [{ type: "text", text }] })} compact={compact} />
				) : (
					<div className={cn("mx-auto w-full max-w-3xl space-y-6", compact ? "px-3 py-3" : "px-4 py-6")}>
						{messages.map((message) => (
							<MessageBubble key={message.id} message={message} />
						))}
						{status === "submitted" && (
							<div className="flex items-start gap-3">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
									<SparklesIcon className="size-4 text-primary" />
								</div>
								<div className="flex items-center gap-2 px-2 py-3">
									<Loader2Icon className="size-4 animate-spin text-muted-foreground" />
									<span className="text-sm text-muted-foreground">Pensando...</span>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Composer */}
			<div className={cn("mx-auto w-full max-w-3xl", compact ? "px-3 pb-3" : "px-4 pb-4 md:pb-6")}>
				<form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border bg-background px-3 py-2 shadow-sm transition-shadow focus-within:shadow-md focus-within:border-primary/30">
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder || "Escribe un mensaje..."}
						className="min-h-[44px] max-h-32 w-full resize-none bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60"
						rows={1}
						autoFocus={!compact}
					/>
					<div className="flex shrink-0 items-center gap-1 pb-0.5">
						{isRunning ? (
							<Button type="button" size="icon" className="size-8 rounded-full" onClick={onStop}>
								<SquareIcon className="size-3.5 fill-current" />
							</Button>
						) : (
							<Button type="submit" size="icon" className="size-8 rounded-full" disabled={!input.trim()}>
								<ArrowUpIcon className="size-4" />
							</Button>
						)}
					</div>
				</form>
				<p className="text-center text-[10px] text-muted-foreground/40 mt-2">
					Manoa IA puede cometer errores. Verifica la información importante.
				</p>
			</div>
		</div>
	);
}

/* ─── Welcome Screen ─── */

function WelcomeScreen({ onSuggestionClick, compact }: { onSuggestionClick: (text: string) => void; compact?: boolean }) {
	const suggestions = [
		{ icon: "📊", title: "Resumen del censo", q: "¿Cuántas familias hay registradas?" },
		{ icon: "📋", title: "Trámites", q: "¿Qué necesito para una carta de residencia?" },
		{ icon: "⚖️", title: "Leyes", q: "¿Qué dice la Ley de los Consejos Comunales?" },
		{ icon: "🏠", title: "Viviendas por sector", q: "¿Cuántos habitantes hay por sector?" },
	];

	return (
		<div className="flex h-full flex-col items-center justify-center px-4">
			<div className={cn("flex flex-col items-center text-center", compact ? "gap-3 py-6" : "gap-4 py-12")}>
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
					<SparklesIcon className="size-8 text-primary" />
				</div>
				<h1 className="text-2xl font-bold tracking-tight">¡Hola, soy Manoa IA!</h1>
				<p className="text-muted-foreground text-sm max-w-sm">
					Tu asistente comunitario. Pregúntame sobre el censo, trámites, leyes o datos de la comunidad.
				</p>
				<div className={cn("grid w-full max-w-lg gap-2", compact ? "grid-cols-1" : "grid-cols-2")}>
					{suggestions.slice(0, compact ? 3 : 4).map((s) => (
						<button
							key={s.title}
							type="button"
							onClick={() => onSuggestionClick(s.q)}
							className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all hover:bg-muted/50 hover:border-primary/20"
						>
							<span className="text-lg">{s.icon}</span>
							<div className="min-w-0">
								<p className="font-medium truncate">{s.title}</p>
								<p className="text-xs text-muted-foreground truncate">{s.q}</p>
							</div>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

/* ─── Message Bubble ─── */

function MessageBubble({ message }: { message: UIMessage }) {
	const isUser = message.role === "user";
	const text = message.parts.filter((p): p is { type: "text"; text: string } => p.type === "text").map((p) => p.text).join("");

	return (
		<div className={cn("flex items-start gap-3", isUser ? "justify-end" : "")}>
			{!isUser && (
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
					<BotIcon className="size-4 text-primary" />
				</div>
			)}
			<div className={cn("group relative", isUser ? "max-w-[80%]" : "max-w-[85%] flex-1")}>
				{isUser ? (
					<div className="rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5">
						<p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
					</div>
				) : (
					<div className="space-y-1">
						<div className="prose prose-sm max-w-none text-sm leading-relaxed">
							<MarkdownRenderer content={text} />
						</div>
						<MessageActions text={text} />
					</div>
				)}
			</div>
			{isUser && (
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
					<UserIcon className="size-4 text-muted-foreground" />
				</div>
			)}
		</div>
	);
}

/* ─── Message Actions ─── */

function MessageActions({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
			<Button variant="ghost" size="icon" className="size-7 rounded-full" onClick={() => {
				navigator.clipboard.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}} title="Copiar">
				{copied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
			</Button>
		</div>
	);
}

/* ─── Markdown Renderer ─── */

const MarkdownRenderer = memo(function MarkdownRenderer({ content }: { content: string }) {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				p: ({ className, ...props }) => <p className={cn("my-2 leading-normal first:mt-0 last:mb-0", className)} {...props} />,
				ul: ({ className, ...props }) => <ul className={cn("my-2 ml-4 list-disc marker:text-muted-foreground [&>li]:mt-1", className)} {...props} />,
				ol: ({ className, ...props }) => <ol className={cn("my-2 ml-4 list-decimal marker:text-muted-foreground [&>li]:mt-1", className)} {...props} />,
				li: ({ className, ...props }) => <li className={cn("leading-normal", className)} {...props} />,
				a: ({ className, ...props }) => <a className={cn("text-primary underline underline-offset-2 hover:text-primary/80", className)} {...props} />,
				strong: ({ className, ...props }) => <strong className="font-semibold" {...props} />,
				code: ({ className, ...props }) => <code className="rounded-md border bg-muted/50 px-1.5 py-0.5 font-mono text-[0.85em]" {...props} />,
				pre: ({ className, ...props }) => <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed" {...props} />,
				blockquote: ({ className, ...props }) => <blockquote className="my-2 border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground" {...props} />,
				h1: ({ className, ...props }) => <h1 className="mb-2 mt-3 font-semibold text-base" {...props} />,
				h2: ({ className, ...props }) => <h2 className="mb-1.5 mt-2.5 font-semibold text-sm" {...props} />,
				h3: ({ className, ...props }) => <h3 className="mb-1 mt-2 font-semibold text-sm" {...props} />,
			}}
		>{content}</ReactMarkdown>
	);
});
