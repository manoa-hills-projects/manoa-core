import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, PlusIcon, VideoIcon, ExternalLinkIcon, ClockIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Event } from "@/entities/events/model/types";
import { useEvents, useCreateEvent, useDeleteEvent } from "@/entities/events/api/use-events";
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS } from "@/entities/events/model/types";
import { usePermissions } from "@/hooks/use-permissions";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DataSheet } from "@/shared/ui/data-sheet";
import { DataTable } from "@/shared/ui/data-table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { InputSearch } from "@/shared/ui/input-search";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { useTableFilters } from "@/shared/hooks/use-table-filters";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FormSubmitButton } from "@/shared/ui/form-submit-button";

export const Route = createFileRoute("/_authenticated/meetings")({
	component: MeetingsPage,
});

const meetingSchema = z.object({
	title: z.string().min(1, "Requerido"),
	description: z.string().optional(),
	date: z.string().min(1, "Requerido"),
	time: z.string().optional(),
	duration: z.coerce.number().optional(),
});

type MeetingForm = z.infer<typeof meetingSchema>;

function MeetingsPage() {
	const filters = useTableFilters();
	const { canManage } = usePermissions();
	const isAdmin = canManage("settings");
	const [sheetOpen, setSheetOpen] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState("");

	const { data: response, isLoading } = useEvents(selectedStatus);
	const createEvent = useCreateEvent();
	const deleteEvent = useDeleteEvent();

	const events = response?.data ?? [];
	const activeCount = events.filter((e) => e.status === "active").length;
	const upcomingCount = events.filter((e) => e.status === "scheduled").length;
	const completedCount = events.filter((e) => e.status === "completed").length;

	const form = useForm<MeetingForm>({
		resolver: zodResolver(meetingSchema),
		defaultValues: { title: "", description: "", date: "", time: "", duration: 60 },
	});

	const columns = useMemo<ColumnDef<Event>[]>(() => [
		{
			accessorKey: "title",
			header: "Asamblea",
			cell: ({ row }) => (
				<div>
					<p className="font-medium">{row.original.title}</p>
					{row.original.description && (
						<p className="text-xs text-muted-foreground truncate max-w-[250px]">{row.original.description}</p>
					)}
				</div>
			),
		},
		{
			id: "date",
			header: "Fecha",
			cell: ({ row }) => (
				<div className="flex items-center gap-1.5 text-sm">
					<CalendarIcon className="size-3.5 text-muted-foreground" />
					{format(new Date(row.original.date + "T" + (row.original.time || "00:00")), "PPP", { locale: es })}
					{row.original.time && <span className="text-muted-foreground">· {row.original.time}</span>}
				</div>
			),
		},
		{
			id: "status",
			accessorKey: "status",
			header: "Estado",
			cell: ({ row }) => (
				<Badge variant={(EVENT_STATUS_VARIANTS[row.original.status] as "default" | "secondary" | "destructive" | "outline") ?? "outline"}>
					{EVENT_STATUS_LABELS[row.original.status]}
				</Badge>
			),
		},
		{
			id: "join",
			header: "",
			cell: ({ row }) =>
				row.original.status === "active" ? (
					<Button size="sm" asChild>
						<a href={`https://meet.jit.si/${row.original.jitsiRoomName || "Manoa-Asamblea"}`} target="_blank" rel="noreferrer">
							<VideoIcon className="h-4 w-4 mr-1" /> Entrar
						</a>
					</Button>
				) : row.original.jitsiRoomName ? (
					<Button size="sm" variant="ghost" asChild>
						<a href={`https://meet.jit.si/${row.original.jitsiRoomName}`} target="_blank" rel="noreferrer">
							<ExternalLinkIcon className="h-4 w-4" />
						</a>
					</Button>
				) : null,
		},
	], []);

	const handleCreate = async (values: MeetingForm) => {
		try {
			const roomName = `Manoa-${values.title.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}`;
			await createEvent.mutateAsync({
				...values,
				jitsiRoomName: roomName,
				status: "scheduled",
				location: "online",
			});
			toast.success("Asamblea creada");
			setSheetOpen(false);
			form.reset();
		} catch {
			toast.error("Error al crear asamblea");
		}
	};

	return (
		<ProtectedRoute>
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Asambleas</h1>
						<p className="text-muted-foreground">Reuniones y asambleas virtuales de la comunidad.</p>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Card className="border border-violet-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Próximas</CardTitle>
							<div className="rounded-md p-1.5 bg-violet-500/10">
								<CalendarIcon className="size-3.5 text-violet-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							<p className="text-3xl font-bold tracking-tight">{upcomingCount}</p>
						</CardContent>
					</Card>
					<Card className="border border-emerald-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">En Vivo</CardTitle>
							<div className="rounded-md p-1.5 bg-emerald-500/10">
								<VideoIcon className="size-3.5 text-emerald-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							<p className="text-3xl font-bold tracking-tight">{activeCount}</p>
						</CardContent>
					</Card>
					<Card className="border border-amber-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Realizadas</CardTitle>
							<div className="rounded-md p-1.5 bg-amber-500/10">
								<ClockIcon className="size-3.5 text-amber-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							<p className="text-3xl font-bold tracking-tight">{completedCount}</p>
						</CardContent>
					</Card>
				</div>

				<div className="flex items-end justify-between gap-2">
					<div className="flex items-center gap-2 w-full max-w-sm">
						<InputSearch label="Buscar" placeholder="Buscar asamblea..." value={filters.search} onChange={filters.setSearch} />
					</div>
					{isAdmin && (
						<Button onClick={() => setSheetOpen(true)}>
							<PlusIcon className="h-4 w-4" /> Programar
						</Button>
					)}
				</div>

				<DataTable
					columns={columns}
					data={events}
					rowCount={events.length}
					pagination={filters.pagination}
					onPaginationChange={filters.setPagination}
					isLoading={isLoading}
				/>
			</div>

			<DataSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Programar Asamblea" description="Crea una nueva asamblea virtual para la comunidad.">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleCreate)} className="flex flex-col gap-4">
						<FormField control={form.control} name="title" render={({ field }) => (
							<FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} placeholder="Rendición de cuentas" /></FormControl><FormMessage /></FormItem>
						)} />
						<FormField control={form.control} name="description" render={({ field }) => (
							<FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} placeholder="Orden del día..." rows={3} /></FormControl><FormMessage /></FormItem>
						)} />
						<div className="grid grid-cols-2 gap-4">
							<FormField control={form.control} name="date" render={({ field }) => (
								<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input {...field} type="date" /></FormControl><FormMessage /></FormItem>
							)} />
							<FormField control={form.control} name="time" render={({ field }) => (
								<FormItem><FormLabel>Hora</FormLabel><FormControl><Input {...field} value={field.value ?? ""} type="time" /></FormControl><FormMessage /></FormItem>
							)} />
						</div>
						<FormField control={form.control} name="duration" render={({ field }) => (
							<FormItem><FormLabel>Duración (min)</FormLabel><FormControl><Input {...field} type="number" placeholder="60" /></FormControl><FormMessage /></FormItem>
						)} />
						<FormSubmitButton isSubmitting={createEvent.isPending}>Programar Asamblea</FormSubmitButton>
					</form>
				</Form>
			</DataSheet>
		</ProtectedRoute>
	);
}
