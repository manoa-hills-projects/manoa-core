import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	CheckCircle2,
	Loader2,
	MoreVertical,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { Poll } from "@/entities/polls";
import {
	useDeletePoll,
	usePolls,
	useUpdatePollStatus,
	useVotePoll,
} from "@/entities/polls";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import { PollFormSheet } from "./poll-form-sheet";

export function PollList() {
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);
	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, string>
	>({});

	const { data: sessionData } = authClient.useSession();
	const isAdmin = authClient.admin.checkRolePermission({
		role:
			(sessionData?.user?.role as "user" | "admin" | "superadmin") || "user",
		permissions: { project: ["create"] },
	});

	const { data, isLoading } = usePolls({ limit: 50 }); // Fetching enough for the demo
	const { mutate: updateStatus, isPending: isUpdating } = useUpdatePollStatus();
	const { mutate: deletePoll, isPending: isDeleting } = useDeletePoll();
	const { mutate: vote, isPending: isVoting } = useVotePoll();

	const handleCreate = () => {
		setIsSheetOpen(true);
	};

	const handleToggleStatus = (
		pollId: string,
		currentStatus: "open" | "closed",
	) => {
		const newStatus = currentStatus === "open" ? "closed" : "open";
		updateStatus(
			{ id: pollId, data: { status: newStatus } },
			{
				onSuccess: () => {
					toast.success(
						`Asamblea ${newStatus === "open" ? "abierta" : "cerrada"}`,
					);
				},
				onError: () => {
					toast.error("Error al actualizar el estado");
				},
			},
		);
	};

	const handleConfirmDelete = () => {
		if (!pollToDelete) return;
		deletePoll(pollToDelete.id, {
			onSuccess: () => {
				toast.success("Asamblea eliminada correctamente");
				setPollToDelete(null);
			},
			onError: () => {
				toast.error("No se pudo eliminar la asamblea");
			},
		});
	};

	const handleVote = (pollId: string) => {
		const optionId = selectedOptions[pollId];
		if (!optionId) {
			toast.error("Por favor, selecciona una opción antes de votar");
			return;
		}

		vote(
			{ id: pollId, data: { option_id: optionId } },
			{
				onSuccess: () => {
					toast.success("Voto registrado exitosamente");
				},
				onError: (error: unknown) => {
					toast.error(
						error instanceof Error
							? error.message
							: "Error al registrar el voto",
					);
				},
			},
		);
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const polls = data?.data || [];

	if (polls.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
					<CheckCircle2 className="h-6 w-6 text-primary" />
				</div>
				<div>
					<h3 className="text-lg font-semibold">No hay asambleas activas</h3>
					<p className="text-sm text-muted-foreground mt-1 max-w-sm">
						Por el momento no hay proyectos o consultas disponibles para
						votación.
					</p>
				</div>
				{isAdmin && (
					<Button onClick={handleCreate} className="mt-2">
						<Plus className="mr-2 h-4 w-4" />
						Crear Primera Asamblea
					</Button>
				)}
				<PollFormSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{isAdmin && (
				<div className="flex justify-end">
					<Button onClick={handleCreate}>
						<Plus className="mr-2 h-4 w-4" />
						Nueva Asamblea
					</Button>
				</div>
			)}

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{polls.map((poll) => {
					const isOpen = poll.status === "open";
					const canVote = isOpen && !poll.hasVoted && !isAdmin; // Admin no suele votar en esta vista para la demo, pero si quieres, quita el !isAdmin
					const showResults = !isOpen || poll.hasVoted || isAdmin;

					return (
						<Card
							key={poll.id}
							className={`flex flex-col transition-all hover:shadow-md ${
								!isOpen ? "bg-muted/30" : ""
							}`}
						>
							<CardHeader>
								<div className="flex items-start justify-between gap-4">
									<div className="space-y-1">
										<CardTitle className="leading-tight">
											{poll.title}
										</CardTitle>
										<CardDescription>
											{format(new Date(poll.createdAt), "PPP", { locale: es })}
										</CardDescription>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant={isOpen ? "default" : "secondary"}>
											{isOpen ? "En Curso" : "Finalizada"}
										</Badge>
										{isAdmin && (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 shrink-0"
													>
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															handleToggleStatus(poll.id, poll.status)
														}
														disabled={isUpdating}
													>
														{isOpen ? "Cerrar Asamblea" : "Reabrir Asamblea"}
													</DropdownMenuItem>
													<DropdownMenuItem
														variant="destructive"
														onClick={() => setPollToDelete(poll)}
													>
														<Trash2 className="h-4 w-4" />
														Eliminar Asamblea
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</div>
								</div>
							</CardHeader>

							<CardContent className="flex-1 space-y-4">
								{poll.description && (
									<p className="text-sm text-muted-foreground">
										{poll.description}
									</p>
								)}

								<div className="space-y-3 pt-4">
									{showResults ? (
										// View Results (Admin, Closed, or Already Voted)
										<div className="space-y-2">
											<h4 className="text-sm font-medium mb-3">Resultados:</h4>
											{poll.options.map((opt) => {
												const percentage =
													poll.totalVotes > 0
														? Math.round(
																(opt.votesCount / poll.totalVotes) * 100,
															)
														: 0;
												const isMyVote = poll.userVote === opt.id;

												return (
													<div key={opt.id} className="space-y-1">
														<div className="flex justify-between text-sm">
															<span className="flex items-center gap-2">
																{opt.text}
																{isMyVote && (
																	<Badge
																		variant="outline"
																		className="text-[10px] px-1 py-0 h-4"
																	>
																		Tu voto
																	</Badge>
																)}
															</span>
															<span className="font-medium">{percentage}%</span>
														</div>
														<div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
															<div
																className={`h-full ${
																	isMyVote ? "bg-primary" : "bg-primary/50"
																}`}
																style={{ width: `${percentage}%` }}
															/>
														</div>
														<div className="text-xs text-muted-foreground text-right">
															{opt.votesCount} votos
														</div>
													</div>
												);
											})}
											<div className="text-sm text-center text-muted-foreground pt-4 font-medium border-t mt-4">
												Total de votos: {poll.totalVotes}
											</div>
										</div>
									) : (
										// View Voting Form (Open and Has Not Voted)
										<RadioGroup
											value={selectedOptions[poll.id] || ""}
											onValueChange={(val) =>
												setSelectedOptions((prev) => ({
													...prev,
													[poll.id]: val,
												}))
											}
											className="gap-3"
										>
											{poll.options.map((opt) => (
												<div
													key={opt.id}
													className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
														selectedOptions[poll.id] === opt.id
															? "border-primary bg-primary/5"
															: "hover:bg-muted/50"
													}`}
												>
													<RadioGroupItem value={opt.id} id={opt.id} />
													<Label
														htmlFor={opt.id}
														className="flex-1 cursor-pointer font-normal"
													>
														{opt.text}
													</Label>
												</div>
											))}
										</RadioGroup>
									)}
								</div>
							</CardContent>

							<CardFooter className="border-t bg-muted/10 p-4">
								{canVote && (
									<Button
										className="w-full"
										disabled={!selectedOptions[poll.id] || isVoting}
										onClick={() => handleVote(poll.id)}
									>
										{isVoting ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : null}
										Emitir Voto
									</Button>
								)}

								{poll.hasVoted && !isAdmin && (
									<div className="flex w-full items-center justify-center text-sm font-medium text-emerald-600 gap-2">
										<CheckCircle2 className="h-4 w-4" />
										Muchas gracias por votar
									</div>
								)}

								{isAdmin && (
									<Button
										variant={isOpen ? "secondary" : "outline"}
										className="w-full"
										disabled={isUpdating}
										onClick={() => handleToggleStatus(poll.id, poll.status)}
									>
										{isUpdating ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : null}
										{isOpen ? "Cerrar Asamblea" : "Reabrir Asamblea"}
									</Button>
								)}
							</CardFooter>
						</Card>
					);
				})}
			</div>

			<PollFormSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />

			<ConfirmDialog
				open={!!pollToDelete}
				onOpenChange={(open) => !open && setPollToDelete(null)}
				title="Eliminar asamblea"
				description={`¿Está seguro de eliminar la asamblea "${pollToDelete?.title}"? Esta acción no se puede deshacer.`}
				onConfirm={handleConfirmDelete}
				confirmText="Eliminar"
				isLoading={isDeleting}
			/>
		</div>
	);
}
