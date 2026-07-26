import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Poll } from "@/entities/polls";
import { useDeletePoll, useUpdatePollStatus, useVotePoll } from "@/entities/polls";
import { usePermissions } from "@/hooks/use-permissions";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";

interface PollDetailSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	poll: Poll | null;
	onChange?: () => void;
}

export function PollDetailSheet({
	open,
	onOpenChange,
	poll,
	onChange,
}: PollDetailSheetProps) {
	const { canManage } = usePermissions();
	const isAdmin = canManage("polls");
	const [selectedOption, setSelectedOption] = useState("");
	const { mutate: updateStatus, isPending: isUpdating } = useUpdatePollStatus();
	const { mutate: deletePoll, isPending: isDeleting } = useDeletePoll();
	const { mutate: vote, isPending: isVoting } = useVotePoll();

	if (!poll) return null;

	const isOpen = poll.status === "open";
	const canVote = isOpen && !poll.hasVoted && !isAdmin;
	const showResults = !isOpen || poll.hasVoted || isAdmin;

	const handleVote = () => {
		if (!selectedOption) {
			toast.error("Selecciona una opción antes de votar");
			return;
		}
		vote(
			{ id: poll.id, data: { option_id: selectedOption } },
			{
				onSuccess: () => {
					toast.success("Voto registrado exitosamente");
					onChange?.();
				},
				onError: (error: unknown) => {
					toast.error(error instanceof Error ? error.message : "Error al votar");
				},
			},
		);
	};

	const handleToggleStatus = () => {
		const newStatus = isOpen ? "closed" : "open";
		updateStatus(
			{ id: poll.id, data: { status: newStatus as "open" | "closed" } },
			{
				onSuccess: () => {
					toast.success(`Votación ${newStatus === "open" ? "abierta" : "cerrada"}`);
					onChange?.();
				},
				onError: () => toast.error("Error al actualizar estado"),
			},
		);
	};

	const handleDelete = () => {
		if (!confirm(`¿Eliminar "${poll.title}"?`)) return;
		deletePoll(poll.id, {
			onSuccess: () => {
				toast.success("Votación eliminada");
				onOpenChange(false);
				onChange?.();
			},
			onError: () => toast.error("Error al eliminar"),
		});
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="sm:max-w-md overflow-y-auto">
				<SheetHeader className="pb-4">
					<div className="flex items-center gap-2">
						<SheetTitle>{poll.title}</SheetTitle>
						<Badge variant={isOpen ? "default" : "secondary"}>
							{isOpen ? "Activa" : "Cerrada"}
						</Badge>
					</div>
					<SheetDescription>
						{format(new Date(poll.createdAt), "PPP", { locale: es })} 
						{" · "}{poll.totalVotes} voto{poll.totalVotes !== 1 ? "s" : ""}
					</SheetDescription>
				</SheetHeader>

				{poll.description && (
					<p className="text-sm text-muted-foreground mb-6 pb-4 border-b">
						{poll.description}
					</p>
				)}

				{/* Resultados o formulario de voto */}
				<div className="space-y-4">
					{showResults ? (
						<div className="space-y-3">
							<h4 className="text-sm font-medium">Resultados:</h4>
							{poll.options.map((opt) => {
								const pct = poll.totalVotes > 0 ? Math.round((opt.votesCount / poll.totalVotes) * 100) : 0;
								const isMyVote = poll.userVote === opt.id;
								return (
									<div key={opt.id} className="space-y-1">
										<div className="flex justify-between text-sm">
											<span className="flex items-center gap-2">
												{opt.text}
												{isMyVote && <Badge variant="outline" className="text-[10px] h-4 px-1">Tu voto</Badge>}
											</span>
											<span className="font-medium">{pct}%</span>
										</div>
										<div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
											<div className={`h-full transition-all ${isMyVote ? "bg-primary" : "bg-primary/50"}`} style={{ width: `${pct}%` }} />
										</div>
										<div className="text-xs text-muted-foreground text-right">{opt.votesCount} votos</div>
									</div>
								);
							})}
							<div className="text-sm text-center text-muted-foreground pt-3 font-medium border-t mt-3">
								Total: {poll.totalVotes} voto{poll.totalVotes !== 1 ? "s" : ""}
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<h4 className="text-sm font-medium">Tu voto:</h4>
							<RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="gap-3">
								{poll.options.map((opt) => (
									<div key={opt.id} className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${selectedOption === opt.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
										<RadioGroupItem value={opt.id} id={opt.id} />
										<Label htmlFor={opt.id} className="flex-1 cursor-pointer font-normal">{opt.text}</Label>
									</div>
								))}
							</RadioGroup>
							<Button className="w-full" disabled={!selectedOption || isVoting} onClick={handleVote}>
								{isVoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
								Emitir Voto
							</Button>
						</div>
					)}
				</div>

				{/* Estado post-voto */}
				{poll.hasVoted && !isAdmin && (
					<div className="flex items-center justify-center gap-2 mt-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
						<CheckCircle2 className="h-5 w-5" />
						Muchas gracias por votar
					</div>
				)}

				{/* Acciones admin */}
				{isAdmin && (
					<div className="flex flex-col gap-2 mt-6 pt-4 border-t">
						<Button variant={isOpen ? "secondary" : "outline"} className="w-full" disabled={isUpdating} onClick={handleToggleStatus}>
							{isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
							{isOpen ? "Cerrar votación" : "Reabrir votación"}
						</Button>
						<Button variant="destructive" className="w-full" disabled={isDeleting} onClick={handleDelete}>
							<Trash2 className="mr-2 h-4 w-4" />
							Eliminar votación
						</Button>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
