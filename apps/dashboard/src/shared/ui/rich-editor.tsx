/**
 * Editor de texto enriquecido ligero (contentEditable + execCommand)
 *
 * Almacena HTML y lo renderiza con estilos básicos.
 * Toolbar: negrita, cursiva, subrayado, listas, encabezados.
 */
import { useCallback, useRef, useState } from "react";
import {
	BoldIcon,
	ItalicIcon,
	UnderlineIcon,
	ListIcon,
	ListOrderedIcon,
	Heading1Icon,
	Heading2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";

interface RichEditorProps {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	minHeight?: string;
}

export function RichEditor({ value, onChange, placeholder, minHeight = "200px" }: RichEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const [isFocused, setIsFocused] = useState(false);

	const exec = useCallback((command: string, val?: string) => {
		document.execCommand(command, false, val);
		editorRef.current?.focus();
		// Disparar onChange después del comando
		const html = editorRef.current?.innerHTML || "";
		onChange(html);
	}, [onChange]);

	const handleInput = useCallback(() => {
		const html = editorRef.current?.innerHTML || "";
		onChange(html);
	}, [onChange]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		// Enter = <p> (no <div>) para mejor estructura
		if (e.key === "Enter" && !e.shiftKey) {
			document.execCommand("insertLineBreak");
			e.preventDefault();
		}
	}, []);

	const handlePaste = useCallback((e: React.ClipboardEvent) => {
		e.preventDefault();
		const text = e.clipboardData.getData("text/plain");
		document.execCommand("insertText", false, text);
	}, []);

	return (
		<div className={cn(
			"rounded-lg border bg-background transition-colors",
			isFocused && "ring-1 ring-ring border-primary"
		)}>
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30 rounded-t-lg">
				<ToolbarButton icon={BoldIcon} onClick={() => exec("bold")} title="Negrita" />
				<ToolbarButton icon={ItalicIcon} onClick={() => exec("italic")} title="Cursiva" />
				<ToolbarButton icon={UnderlineIcon} onClick={() => exec("underline")} title="Subrayado" />
				<span className="w-px h-5 bg-border mx-1" />
				<ToolbarButton icon={Heading1Icon} onClick={() => exec("formatBlock", "h3")} title="Título" />
				<ToolbarButton icon={Heading2Icon} onClick={() => exec("formatBlock", "h4")} title="Subtítulo" />
				<span className="w-px h-5 bg-border mx-1" />
				<ToolbarButton icon={ListIcon} onClick={() => exec("insertUnorderedList")} title="Lista" />
				<ToolbarButton icon={ListOrderedIcon} onClick={() => exec("insertOrderedList")} title="Lista numerada" />
			</div>

			{/* Editor */}
			<div
				ref={editorRef}
				contentEditable
				suppressContentEditableWarning
				className="px-4 py-3 text-sm outline-none overflow-y-auto prose prose-sm max-w-none"
				style={{ minHeight }}
				onInput={handleInput}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				onKeyDown={handleKeyDown}
				onPaste={handlePaste}
				dangerouslySetInnerHTML={{ __html: value || "" }}
			/>
			{!value && !isFocused && (
				<div
					className="pointer-events-none absolute text-sm text-muted-foreground/50 px-4"
					style={{ marginTop: `-${minHeight}` }}
				>
					{placeholder || "Escribe aquí..."}
				</div>
			)}
		</div>
	);
}

function ToolbarButton({ icon: Icon, onClick, title }: { icon: any; onClick: () => void; title: string }) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className="size-7 rounded-md"
			onClick={onClick}
			title={title}
		>
			<Icon className="size-3.5" />
		</Button>
	);
}

/**
 * Renderiza HTML plano con estilos básicos
 */
export function RichRenderer({ html }: { html: string }) {
	if (!html) return null;
	return (
		<div
			className="prose prose-sm max-w-none prose-p:my-1 prose-headings:mb-1 prose-headings:mt-3 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:font-semibold"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
