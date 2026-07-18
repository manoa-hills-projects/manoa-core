import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useActs, useCreateAct, useDeleteAct, BOOK_TYPES, ACT_TIPOS } from "@/entities/acts";
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

export const Route = createFileRoute("/_authenticated/acts")({
  component: ActsPage,
});

function ActsPage() {
  const { canManage } = usePermissions();
  const [filterBook, setFilterBook] = useState("");
  const { data, isLoading } = useActs(filterBook || undefined);
  const createAct = useCreateAct();
  const deleteAct = useDeleteAct();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    bookType: "asamblea_ciudadanos",
    folioNumber: 1,
    fecha: new Date().toISOString().split("T")[0],
    hora: "",
    lugar: "",
    tipo: "ordinaria",
    quorum: 0,
    contenido: "",
  });

  const acts = data?.data || [];

  const handleCreate = async () => {
    if (!form.contenido) return toast.error("El contenido es obligatorio");
    try {
      await createAct.mutateAsync(form as any);
      toast.success("Acta creada correctamente");
      setCreateOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Error al crear acta");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta acta?")) return;
    try {
      await deleteAct.mutateAsync(id);
      toast.success("Acta eliminada");
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Libro de Actas</h1>
            <p className="text-muted-foreground">
              Registro oficial de asambleas y decisiones del consejo comunal.
            </p>
          </div>
          {canManage("acts") && (
            <Button onClick={() => setCreateOpen(true)}>Nueva acta</Button>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={filterBook} onValueChange={setFilterBook}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Todos los libros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">Todos los libros</SelectItem>
              {Object.entries(BOOK_TYPES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground py-6">Cargando...</p>
            ) : acts.length === 0 ? (
              <p className="text-muted-foreground py-6">No hay actas registradas.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {acts.map((act) => (
                  <div key={act.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          Folio #{act.folioNumber}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {BOOK_TYPES[act.bookType] || act.bookType}
                        </Badge>
                        <Badge variant={act.tipo === "extraordinaria" ? "destructive" : "secondary"} className="text-xs">
                          {ACT_TIPOS[act.tipo] || act.tipo}
                        </Badge>
                        {act.isPublished ? (
                          <Badge variant="default" className="text-xs">Publicada</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Borrador</Badge>
                        )}
                      </div>
                      <p className="text-sm mt-2 line-clamp-2">{act.contenido}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {act.fecha} {act.hora ? `- ${act.hora}` : ""} · {act.quorum} asistentes
                      </p>
                    </div>
                    {canManage("acts") && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(act.id)}>
                        Eliminar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva acta</DialogTitle>
            <DialogDescription>Registre una nueva acta en el libro correspondiente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de libro</Label>
                <Select value={form.bookType} onValueChange={(v) => setForm({...form, bookType: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BOOK_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>N° de Folio</Label>
                <Input type="number" value={form.folioNumber} onChange={(e) => setForm({...form, folioNumber: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={form.fecha} onChange={(e) => setForm({...form, fecha: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={form.hora} onChange={(e) => setForm({...form, hora: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({...form, tipo: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinaria">Ordinaria</SelectItem>
                    <SelectItem value="extraordinaria">Extraordinaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lugar</Label>
                <Input value={form.lugar} onChange={(e) => setForm({...form, lugar: e.target.value})} placeholder="Sede del consejo comunal" />
              </div>
              <div className="space-y-2">
                <Label>Quórum (asistentes)</Label>
                <Input type="number" value={form.quorum} onChange={(e) => setForm({...form, quorum: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contenido del acta</Label>
              <Textarea
                rows={10}
                value={form.contenido}
                onChange={(e) => setForm({...form, contenido: e.target.value})}
                placeholder="Puntos tratados, debates, acuerdos..."
              />
              <p className="text-xs text-muted-foreground">Incluya fecha, hora, lugar, voceros presentes, puntos tratados y acuerdos tomados.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createAct.isPending}>
              {createAct.isPending ? "Guardando..." : "Guardar acta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
