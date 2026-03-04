import { createFileRoute } from "@tanstack/react-router";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "@/env";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";

// ----------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/")({
	component: RouteComponent,
});

type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
};

type QueryApiResponse = {
	data?: {
		answer?: string;
	};
};

function RouteComponent() {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const apiOrigin = useMemo(
		() => env.VITE_API_ORIGIN ?? "http://localhost:8787",
		[],
	);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	});

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const question = input.trim();

		if (!question || isLoading) {
			return;
		}

		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content: question,
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);

		try {
			const response = await fetch(`${apiOrigin}/api/ai/query`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ question }),
			});

			if (!response.ok) {
				throw new Error("No se pudo obtener respuesta del asistente");
			}

			const payload = (await response.json()) as QueryApiResponse;
			const answer =
				payload.data?.answer?.trim() || "No pude generar una respuesta.";

			setMessages((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					role: "assistant",
					content: answer,
				},
			]);
		} catch {
			setMessages((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					role: "assistant",
					content: "Hubo un error procesando tu consulta.",
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex h-full w-full flex-col gap-4 p-4 lg:mx-auto lg:max-w-4xl">
			<div className="mb-4 space-y-2 text-center">
				<h1 className="text-3xl font-bold tracking-tight text-foreground">
					Asistente Manoa
				</h1>
				<p className="text-muted-foreground">
					Pregunta sobre estadísticas, ciudadanos o gestión de la comunidad.
				</p>
			</div>

			<Card className="flex flex-1 flex-col overflow-hidden border bg-background shadow-sm">
				<ScrollArea className="flex-1 p-4">
					<div className="flex flex-col gap-4 pb-4">
						{messages.length === 0 && (
							<div className="flex h-full flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
								<Bot className="mb-4 h-16 w-16" />
								<p>¿En qué puedo ayudarte hoy?</p>
							</div>
						)}

						{messages.map((m) => (
							<div
								key={m.id}
								className={`flex w-full gap-3 ${
									m.role === "user" ? "flex-row-reverse" : "flex-row"
								}`}
							>
								<Avatar className="mt-1 h-8 w-8 border bg-background">
									{m.role === "user" ? (
										<AvatarFallback className="bg-primary text-primary-foreground">
											<User className="h-4 w-4" />
										</AvatarFallback>
									) : (
										<AvatarFallback className="bg-blue-600 text-white">
											<Bot className="h-4 w-4" />
										</AvatarFallback>
									)}
								</Avatar>

								<div
									className={`max-w-[80%] rounded-xl px-4 py-2 text-sm shadow-sm ${
										m.role === "user"
											? "bg-primary text-primary-foreground"
											: "border bg-muted/50 text-foreground"
									}`}
								>
									<div className="whitespace-pre-wrap leading-relaxed">
										{m.content}
									</div>
								</div>
							</div>
						))}

						{isLoading &&
							messages.length > 0 &&
							messages[messages.length - 1].role === "user" && (
								<div className="flex w-full gap-3">
									<Avatar className="mt-1 h-8 w-8 border bg-background">
										<AvatarFallback className="bg-blue-600 text-white">
											<Bot className="h-4 w-4" />
										</AvatarFallback>
									</Avatar>
									<div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
										<Loader2 className="h-3 w-3 animate-spin" />
										<span>Pensando...</span>
									</div>
								</div>
							)}
						<div ref={messagesEndRef} />
					</div>
				</ScrollArea>

				<div className="border-t bg-background/50 p-4 backdrop-blur-sm">
					<form onSubmit={handleSubmit} className="flex gap-2">
						<Input
							value={input}
							onChange={(event) => setInput(event.target.value)}
							placeholder="Ej: ¿Cuántas familias hay registradas?"
							className="h-11 flex-1 shadow-sm"
							disabled={isLoading}
						/>
						<Button
							type="submit"
							size="icon"
							className="h-11 w-11 shrink-0 shadow-sm"
							disabled={isLoading || !input.trim()}
						>
							<Send className="h-4 w-4" />
							<span className="sr-only">Enviar</span>
						</Button>
					</form>
				</div>
			</Card>
		</div>
	);
}
