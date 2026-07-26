import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import {
  TICKET_CATEGORIES,
  TICKET_STATUS_COLORS,
  TICKET_STATUS_LABELS,
  useCreateTicket,
  useTickets,
  useUpdateTicket,
} from "@/entities/tickets";
import type { Ticket } from "@/entities/tickets";
import { usePermissions } from "@/hooks/use-permissions";
import { useTableFilters } from "@/shared/hooks/use-table-filters";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DataTable } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet";
import { Skeleton } from "@/shared/ui/skeleton";
import { Textarea } from "@/shared/ui/textarea";

export const Route = createFileRoute("/_authenticated/tickets")({
  component: TicketsPage,
});

function TicketsPage() {
  const { canManage } = usePermissions();
  const isAdmin = canManage("tickets");
  const filters = useTableFilters({ initialPageSize: 10 });

  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useTickets(statusFilter || undefined);
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();

  const tickets = data?.data || [];

  /* ── Stats ── */
  const total = tickets.length;
  const recibidos = tickets.filter((t) => t.status === "recibido").length;
  const enProceso = tickets.filter((t) => t.status === "en_proceso").length;
  const resueltos = tickets.filter((t) => t.status === "resuelto").length;

  /* ── Sheet state (create / edit) ── */
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "otro",
    resolutionNotes: "",
  });

  const isEditing = editingTicket !== null;
  const isPending = createTicket.isPending || updateTicket.isPending;

  const openCreateSheet = () => {
    setEditingTicket(null);
    setForm({ title: "", description: "", category: "otro", resolutionNotes: "" });
    setSheetOpen(true);
  };

  const openEditSheet = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setForm({
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      resolutionNotes: ticket.resolutionNotes ?? "",
    });
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      return toast.error("Todos los campos son obligatorios");
    }
    try {
      if (isEditing) {
        await updateTicket.mutateAsync({
          id: editingTicket.id,
          data: {
            title: form.title,
            description: form.description,
            category: form.category,
            resolutionNotes: form.resolutionNotes || null,
          } as Partial<Ticket>,
        });
        toast.success("Reporte actualizado correctamente");
      } else {
        await createTicket.mutateAsync({
          title: form.title,
          description: form.description,
          category: form.category,
        });
        toast.success("Reporte enviado correctamente");
      }
      setSheetOpen(false);
      setEditingTicket(null);
      setForm({ title: "", description: "", category: "otro", resolutionNotes: "" });
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar el reporte");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateTicket.mutateAsync({ id, data: { status } as Partial<Ticket> });
      toast.success("Estado actualizado");
    } catch (e: any) {
      toast.error(e?.message || "Error al actualizar el estado");
    }
  };

  /* ── Columns ── */
  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            {row.original.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[260px]">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Categoría",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {TICKET_CATEGORIES[row.original.category] || row.original.category}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const variant = TICKET_STATUS_COLORS[row.original.status] as
            | "default"
            | "secondary"
            | "outline"
            | "destructive";
          return <Badge variant={variant}>{TICKET_STATUS_LABELS[row.original.status]}</Badge>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString("es-VE")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          const ticket = row.original;
          return (
            <div className="flex gap-1">
              {isAdmin && ticket.status !== "resuelto" && (
                <>
                  {ticket.status === "recibido" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStatusChange(ticket.id, "en_proceso")}
                    >
                      En proceso
                    </Button>
                  )}
                  {ticket.status === "en_proceso" && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleStatusChange(ticket.id, "resuelto")}
                    >
                      Resolver
                    </Button>
                  )}
                </>
              )}
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => openEditSheet(ticket)}>
                  Editar
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [isAdmin],
  );

  return (
    <ProtectedRoute module="tickets">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
            <p className="text-muted-foreground">
              Reporta incidencias comunitarias o da seguimiento a las existentes.
            </p>
          </div>
          <Button onClick={openCreateSheet}>Nuevo reporte</Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total
              </CardTitle>
              <div className="rounded-md p-1.5 bg-muted">
                <FileText className="size-3.5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold tracking-tight">{total.toLocaleString("es-VE")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recibido
              </CardTitle>
              <div className="rounded-md p-1.5 bg-blue-500/10">
                <AlertCircle className="size-3.5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold tracking-tight">
                  {recibidos.toLocaleString("es-VE")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-amber-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                En proceso
              </CardTitle>
              <div className="rounded-md p-1.5 bg-amber-500/10">
                <Clock className="size-3.5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold tracking-tight">
                  {enProceso.toLocaleString("es-VE")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Resuelto
              </CardTitle>
              <div className="rounded-md p-1.5 bg-emerald-500/10">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold tracking-tight">
                  {resueltos.toLocaleString("es-VE")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">Todos</SelectItem>
              <SelectItem value="recibido">Recibido</SelectItem>
              <SelectItem value="en_proceso">En proceso</SelectItem>
              <SelectItem value="resuelto">Resuelto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data table */}
        <DataTable
          columns={columns}
          data={tickets}
          rowCount={tickets.length}
          pagination={filters.pagination}
          onPaginationChange={filters.setPagination}
        />
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{isEditing ? "Editar reporte" : "Nuevo reporte"}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? "Actualiza la información del reporte."
                : "Reporta una incidencia en tu comunidad."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 py-4 px-4">
            {/* Categoría */}
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TICKET_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: Transformador dañado"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe el problema y la ubicación..."
              />
            </div>

            {/* Resolución (solo admin editando) */}
            {isEditing && (
              <div className="space-y-2">
                <Label>Notas de resolución</Label>
                <Textarea
                  rows={3}
                  value={form.resolutionNotes}
                  onChange={(e) => setForm({ ...form, resolutionNotes: e.target.value })}
                  placeholder="Indica cómo se resolvió el reporte..."
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={isPending}>
                {isPending
                  ? "Guardando..."
                  : isEditing
                    ? "Guardar cambios"
                    : "Enviar reporte"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </ProtectedRoute>
  );
}
