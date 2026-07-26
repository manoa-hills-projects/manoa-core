import { BotIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function AssistantModal() {
	return (
		<Link
			to="/ai-assistant"
			className="fixed bottom-6 right-6 z-[9999] flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
		>
			<BotIcon className="size-6" />
		</Link>
	);
}
