import { BotIcon, ChevronDownIcon, SparklesIcon } from "lucide-react";
import { lazy, Suspense, useCallback, useState } from "react";
import { Button } from "@/shared/ui/button";

const LazyChatContent = lazy(() => import("./chat-popover-content"));

export function AssistantModal() {
	const [open, setOpen] = useState(false);
	const [loaded, setLoaded] = useState(false);

	const handleToggle = useCallback(() => {
		setOpen((prev) => {
			if (!prev) setLoaded(true);
			return !prev;
		});
	}, []);

	return (
		<>
			{/* Backdrop */}
			{open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

			{/* Popover */}
			<div className={`fixed end-4 bottom-4 z-50 transition-all duration-300 ${open ? "bottom-20" : ""}`}>
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
								{loaded ? (
									<Suspense fallback={
										<div className="flex h-full items-center justify-center">
											<p className="text-sm text-muted-foreground animate-pulse">Conectando...</p>
										</div>
									}>
										<LazyChatContent />
									</Suspense>
								) : null}
							</div>
						</div>
					</div>
				)}

				{/* Button */}
				<Button
					onClick={handleToggle}
					variant="default"
					className="size-11 rounded-full shadow-lg"
				>
					{open ? (
						<ChevronDownIcon className="size-6" />
					) : (
						<BotIcon className="size-6" />
					)}
				</Button>
			</div>
		</>
	);
}
