import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useTickets, useCreateTicket, useUpdateTicket, TICKET_CATEGORIES, TICKET_STATUS_LABELS, TICKET_STATUS_COLORS } from "@/entities/tickets";
import { usePermissions } from "@/hooks/use-permissions";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

export const Route = createFileRoute("/_authenticated/tickets")({
  component: TicketsPage,
});

function TicketsPage() {
  const { canManage } = usePermissions();
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useTickets(statusFilter || undefined);
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "otro" });

  const tickets = data?.data || [];

  const handleCreate = async () => {
    if (!form.title || !form.description) return toast.error("Todos los campos son obligatorios");
    try {
      await createTicket.mutateAsync(form);
      toast.success("Reporte enviado correctamente");
      setCreateOpen(false);
      setForm({ title: "", description: "", category: "otro" });
    } catch (e: any) {
      toast.error(e.message || "Error al crear reporte");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateTicket.mutateAsync({ id, data: { status } as any });
      toast.success("Estado actualizado");
    } catch (e: any) {
      toast.error(e.message || "Error al actualizar");
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
            <p className="text-muted-foreground">
              Reporta incidencias comunitarias o da seguimiento a las existentes.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Nuevo reporte</Button>
        </div>

        <div className="flex gap-2">
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

        {/* ═══ ZONA 1/2: Todos los reportes ═══ */}
        <Card>
          <CardHeader>
            <CardTitle>Reportes de la comunidad</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground py-6">Cargando...</p>
            ) : tickets.length === 0 ? (
              <p className="text-muted-foreground py-6">No hay reportes.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={TICKET_STATUS_COLORS[ticket.status] as any}>
                          {TICKET_STATUS_LABELS[ticket.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {TICKET_CATEGORIES[ticket.category] || ticket.category}
                        </span>
                      </div>
                      <p className="font-medium mt-1">{ticket.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                      {ticket.resolutionNotes && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          Resolución: {ticket.resolutionNotes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(ticket.createdAt).toLocaleDateString("es-VE")}
                      </p>
                    </div>

                    {/* ═══ ZONA 3: Admin gestiona ═══ */}
                    {canManage("tickets") && (
                      <div className="flex gap-1 shrink-0">
                        {ticket.status !== "resuelto" && (
                          <>
                            {ticket.status === "recibido" && (
                              <Button size="sm" variant="secondary" onClick={() => handleStatusChange(ticket.id, "en_proceso")}>
                                En proceso
                              </Button>
                            )}
                            {ticket.status === "en_proceso" && (
                              <Button size="sm" variant="default" onClick={() => handleStatusChange(ticket.id, "resuelto")}>
                                Resolver
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo reporte</DialogTitle>
            <DialogDescription>Reporta una incidencia en tu comunidad.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TICKET_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="Ej: Transformador dañado" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Describe el problema y la ubicación..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createTicket.isPending}>
              {createTicket.isPending ? "Enviando..." : "Enviar reporte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
