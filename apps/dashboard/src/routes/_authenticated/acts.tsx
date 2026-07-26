import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
	FileTextIcon,
	PenLineIcon,
	BookTypeIcon,
	FileCheckIcon,
	EyeIcon,
	PencilIcon,
	Trash2Icon,
	FileEditIcon,
} from "lucide-react";
import {
	useActs,
	useCreateAct,
	useUpdateAct,
	useDeleteAct,
	BOOK_TYPES,
	ACT_TIPOS,
} from "@/entities/acts";
import type { Act } from "@/entities/acts";
import { usePermissions } from "@/hooks/use-permissions";
import { DataTable } from "@/shared/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/shared/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/shared/ui/dialog";
import { RichEditor, RichRenderer } from "@/shared/ui/rich-editor";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { ProtectedRoute } from "@/shared/ui/protected-route";

export const Route = createFileRoute("/_authenticated/acts")({
	component: ActsPage,
	staticData: {
		breadcrumb: "Actas",
	},
});

const DEFAULT_FORM = {
	bookType: "asamblea_ciudadanos",
	folioNumber: 1,
	fecha: "",
	hora: "",
	lugar: "",
	tipo: "ordinaria",
	quorum: 0,
	contenido: "",
};

function ActsPage() {
	const { canManage } = usePermissions();

	// ── Filters ─────────────────────────────────────────────
	const [filterBook, setFilterBook] = useState("all");
	const [statusFilter, setStatusFilter] = useState("todas");

	// ── Pagination ──────────────────────────────────────────
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

	// ── Data ─────────────────────────────────────────────────
	const bookFilter = filterBook === "all" ? undefined : filterBook;
	const { data, isLoading } = useActs(bookFilter);
	const createAct = useCreateAct();
	const updateAct = useUpdateAct();
	const deleteAct = useDeleteAct();

	const acts = data?.data ?? [];

	// ── Client-side filtering ───────────────────────────────
	const filteredActs = useMemo(() => {
		if (statusFilter === "todas") return acts;
		if (statusFilter === "borrador") return acts.filter((a) => !a.isPublished);
		if (statusFilter === "publicada") return acts.filter((a) => a.isPublished);
		return acts;
	}, [acts, statusFilter]);

	// ── Stats ────────────────────────────────────────────────
	const stats = useMemo(() => {
		const total = acts.length;
		const borrador = acts.filter((a) => !a.isPublished).length;
		const publicada = acts.filter((a) => a.isPublished).length;
		const byBookType: Record<string, number> = {};
		for (const a of acts) {
			byBookType[a.bookType] = (byBookType[a.bookType] ?? 0) + 1;
		}
		return { total, borrador, publicada, byBookType };
	}, [acts]);

	// ── Sheet state (create / edit) ──────────────────────────
	const [sheetOpen, setSheetOpen] = useState(false);
	const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [sheetTab, setSheetTab] = useState("general");

	// ── Detail sheet state ───────────────────────────────────
	const [detailOpen, setDetailOpen] = useState(false);
	const [detailAct, setDetailAct] = useState<Act | null>(null);

	// ── Delete dialog state ──────────────────────────────────
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<Act | null>(null);

	// ── Form state ───────────────────────────────────────────
	const [form, setForm] = useState({ ...DEFAULT_FORM, fecha: new Date().toISOString().split("T")[0] });

	const resetForm = useCallback(() => {
		setForm({ ...DEFAULT_FORM, fecha: new Date().toISOString().split("T")[0] });
	}, []);

	// ── Handlers ─────────────────────────────────────────────
	const openCreate = useCallback(() => {
		resetForm();
		setEditingId(null);
		setSheetMode("create");
		setSheetTab("general");
		setSheetOpen(true);
	}, [resetForm]);

	const openEdit = useCallback((act: Act) => {
		setForm({
			bookType: act.bookType,
			folioNumber: act.folioNumber,
			fecha: act.fecha,
			hora: act.hora ?? "",
			lugar: act.lugar ?? "",
			tipo: act.tipo,
			quorum: act.quorum,
			contenido: act.contenido,
		});
		setEditingId(act.id);
		setSheetMode("edit");
		setSheetTab("general");
		setSheetOpen(true);
	}, []);

	const openDetail = useCallback((act: Act) => {
		setDetailAct(act);
		setDetailOpen(true);
	}, []);

	const closeSheet = useCallback(() => {
		setSheetOpen(false);
		setEditingId(null);
	}, []);

	const handleCreate = useCallback(async () => {
		if (!form.contenido) {
			toast.error("El contenido es obligatorio");
			return;
		}
		try {
			await createAct.mutateAsync(form);
			toast.success("Acta creada correctamente");
			closeSheet();
		} catch (e: any) {
			toast.error(e?.message ?? "Error al crear acta");
		}
	}, [form, createAct, closeSheet]);

	const handleUpdate = useCallback(async () => {
		if (!editingId) return;
		if (!form.contenido) {
			toast.error("El contenido es obligatorio");
			return;
		}
		try {
			await updateAct.mutateAsync({ id: editingId, data: form });
			toast.success("Acta actualizada correctamente");
			closeSheet();
		} catch (e: any) {
			toast.error(e?.message ?? "Error al actualizar acta");
		}
	}, [editingId, form, updateAct, closeSheet]);

	const handleDeleteConfirm = useCallback(async () => {
		if (!deleteTarget) return;
		try {
			await deleteAct.mutateAsync(deleteTarget.id);
			toast.success("Acta eliminada correctamente");
			setDeleteDialogOpen(false);
			setDeleteTarget(null);
		} catch (e: any) {
			toast.error(e?.message ?? "Error al eliminar acta");
		}
	}, [deleteTarget, deleteAct]);

	// ── Columns ──────────────────────────────────────────────
	const columns = useMemo<ColumnDef<Act>[]>(
		() => [
			{
				accessorKey: "folioNumber",
				header: "Folio",
				cell: ({ row }) => (
					<span className="font-mono text-sm">#{row.original.folioNumber}</span>
				),
			},
			{
				accessorKey: "bookType",
				header: "Tipo libro",
				cell: ({ row }) => {
					const label = BOOK_TYPES[row.original.bookType] ?? row.original.bookType;
					return (
						<Badge variant="outline" className="text-xs max-w-[180px] truncate" title={label}>
							{label}
						</Badge>
					);
				},
			},
			{
				accessorKey: "tipo",
				header: "Tipo acta",
				cell: ({ row }) => (
					<Badge
						variant={row.original.tipo === "extraordinaria" ? "destructive" : "secondary"}
						className="text-xs"
					>
						{ACT_TIPOS[row.original.tipo] ?? row.original.tipo}
					</Badge>
				),
			},
			{
				accessorKey: "fecha",
				header: "Fecha",
				cell: ({ row }) => {
					const { fecha, hora } = row.original;
					return <span className="text-sm">{fecha}{hora ? ` ${hora}` : ""}</span>;
				},
			},
			{
				accessorKey: "isPublished",
				header: "Estado",
				cell: ({ row }) =>
					row.original.isPublished ? (
						<Badge variant="default" className="text-xs">Publicada</Badge>
					) : (
						<Badge variant="secondary" className="text-xs">Borrador</Badge>
					),
			},
			{
				id: "actions",
				header: "Acciones",
				cell: ({ row }) => (
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={() => openDetail(row.original)}
							title="Ver detalle"
						>
							<EyeIcon className="size-3.5" />
						</Button>
						{canManage("acts") && (
							<>
								<Button
									variant="ghost"
									size="icon"
									className="size-8"
									onClick={() => openEdit(row.original)}
									title="Editar"
								>
									<PencilIcon className="size-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="size-8 text-destructive hover:text-destructive"
									onClick={() => {
										setDeleteTarget(row.original);
										setDeleteDialogOpen(true);
									}}
									title="Eliminar"
								>
									<Trash2Icon className="size-3.5" />
								</Button>
							</>
						)}
					</div>
				),
			},
		],
		[canManage, openDetail, openEdit],
	);

	// ── Client-side page slice ───────────────────────────────
	const pageData = useMemo(() => {
		const start = pagination.pageIndex * pagination.pageSize;
		return filteredActs.slice(start, start + pagination.pageSize);
	}, [filteredActs, pagination]);

	// ── Render ────────────────────────────────────────────────
	return (
		<ProtectedRoute module="acts">
			<div className="flex flex-col gap-6">
				{/* ── Header ─────────────────────────────────── */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Libro de Actas</h1>
						<p className="text-muted-foreground">
							Registro oficial de asambleas y decisiones del consejo comunal.
						</p>
					</div>
					{canManage("acts") && (
						<Button onClick={openCreate}>
							<FileEditIcon className="size-4 mr-2" />
							Nueva acta
						</Button>
					)}
				</div>

				{/* ── Stats cards ────────────────────────────── */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card className="border border-blue-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								Total Actas
							</CardTitle>
							<div className="rounded-md p-1.5 bg-blue-500/10">
								<FileTextIcon className="size-3.5 text-blue-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								<p className="text-3xl font-bold tracking-tight">{stats.total}</p>
							)}
						</CardContent>
					</Card>

					<Card className="border border-emerald-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								Asamblea Ciudadanos
							</CardTitle>
							<div className="rounded-md p-1.5 bg-emerald-500/10">
								<BookTypeIcon className="size-3.5 text-emerald-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								<p className="text-3xl font-bold tracking-tight">
									{stats.byBookType["asamblea_ciudadanos"] ?? 0}
								</p>
							)}
						</CardContent>
					</Card>

					<Card className="border border-amber-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								Borradores
							</CardTitle>
							<div className="rounded-md p-1.5 bg-amber-500/10">
								<PenLineIcon className="size-3.5 text-amber-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								<p className="text-3xl font-bold tracking-tight">{stats.borrador}</p>
							)}
						</CardContent>
					</Card>

					<Card className="border border-green-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								Publicadas
							</CardTitle>
							<div className="rounded-md p-1.5 bg-green-500/10">
								<FileCheckIcon className="size-3.5 text-green-500" />
							</div>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								<p className="text-3xl font-bold tracking-tight">{stats.publicada}</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* ── Filters ───────────────────────────────── */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Tabs
						value={statusFilter}
						onValueChange={(v) => {
							setStatusFilter(v);
							setPagination((p) => ({ ...p, pageIndex: 0 }));
						}}
					>
						<TabsList>
							<TabsTrigger value="todas">Todas</TabsTrigger>
							<TabsTrigger value="borrador">Borrador</TabsTrigger>
							<TabsTrigger value="publicada">Publicada</TabsTrigger>
						</TabsList>
					</Tabs>

					<Select
						value={filterBook}
						onValueChange={(v) => {
							setFilterBook(v);
							setPagination((p) => ({ ...p, pageIndex: 0 }));
						}}
					>
						<SelectTrigger className="w-72">
							<SelectValue placeholder="Todos los libros" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos los libros</SelectItem>
							{Object.entries(BOOK_TYPES).map(([k, v]) => (
								<SelectItem key={k} value={k}>{v}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* ── Data table ──────────────────────────────── */}
				<Card>
					<CardHeader>
						<CardTitle>Actas</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-3">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						) : (
							<DataTable
								columns={columns}
								data={pageData}
								rowCount={filteredActs.length}
								pagination={pagination}
								onPaginationChange={setPagination}
							/>
						)}
					</CardContent>
				</Card>
			</div>

			{/* ── Create / Edit Sheet ─────────────────────────── */}
			<Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
				<SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col h-full">
					<SheetHeader>
						<SheetTitle>{sheetMode === "create" ? "Nueva acta" : "Editar acta"}</SheetTitle>
						<SheetDescription>
							{sheetMode === "create"
								? "Registre una nueva acta en el libro correspondiente."
								: "Modifique los datos del acta seleccionada."}
						</SheetDescription>
					</SheetHeader>

					<div className="flex-1 overflow-y-auto px-4 pb-4">
						<Tabs value={sheetTab} onValueChange={setSheetTab} className="mt-2">
							<TabsList variant="line" className="w-full justify-start">
								<TabsTrigger value="general">Información general</TabsTrigger>
								<TabsTrigger value="contenido">Contenido</TabsTrigger>
							</TabsList>

							<TabsContent value="general" className="space-y-4 pt-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="bookType">Tipo de libro</Label>
										<Select
											value={form.bookType}
											onValueChange={(v) => setForm((f) => ({ ...f, bookType: v }))}
										>
											<SelectTrigger id="bookType">
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
										<Label htmlFor="folioNumber">N.° de Folio</Label>
										<Input
											id="folioNumber"
											type="number"
											value={form.folioNumber}
											onChange={(e) =>
												setForm((f) => ({ ...f, folioNumber: parseInt(e.target.value) || 0 }))
											}
										/>
									</div>
								</div>

								<div className="grid grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label htmlFor="fecha">Fecha</Label>
										<Input
											id="fecha"
											type="date"
											value={form.fecha}
											onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="hora">Hora</Label>
										<Input
											id="hora"
											type="time"
											value={form.hora}
											onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="tipo">Tipo</Label>
										<Select
											value={form.tipo}
											onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}
										>
											<SelectTrigger id="tipo">
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
										<Label htmlFor="lugar">Lugar</Label>
										<Input
											id="lugar"
											value={form.lugar}
											onChange={(e) => setForm((f) => ({ ...f, lugar: e.target.value }))}
											placeholder="Sede del consejo comunal"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="quorum">Quórum (asistentes)</Label>
										<Input
											id="quorum"
											type="number"
											value={form.quorum}
											onChange={(e) =>
												setForm((f) => ({ ...f, quorum: parseInt(e.target.value) || 0 }))
											}
										/>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="contenido" className="space-y-4 pt-4">
								<div className="space-y-2">
									<Label>Contenido del acta</Label>
									<RichEditor
										value={form.contenido}
										onChange={(html) => setForm((f) => ({ ...f, contenido: html }))}
										placeholder="Puntos tratados, debates, acuerdos..."
										minHeight="300px"
									/>
									<p className="text-xs text-muted-foreground">
										Incluya fecha, hora, lugar, voceros presentes, puntos tratados y acuerdos
										tomados.
									</p>
								</div>
							</TabsContent>
						</Tabs>
					</div>

					<div className="border-t p-4 flex items-center justify-end gap-2">
						<Button variant="outline" onClick={closeSheet}>
							Cancelar
						</Button>
						<Button
							onClick={sheetMode === "create" ? handleCreate : handleUpdate}
							disabled={createAct.isPending || updateAct.isPending}
						>
							{createAct.isPending || updateAct.isPending
								? "Guardando..."
								: sheetMode === "create"
									? "Guardar acta"
									: "Actualizar acta"}
						</Button>
					</div>
				</SheetContent>
			</Sheet>

			{/* ── Detail Sheet ─────────────────────────────────── */}
			<Sheet open={detailOpen} onOpenChange={setDetailOpen}>
				<SheetContent side="right" className="sm:max-w-xl w-full flex flex-col h-full">
					<SheetHeader>
						<SheetTitle>Detalle del acta</SheetTitle>
						<SheetDescription>
							Acta #{detailAct?.folioNumber} ·{" "}
							{detailAct ? (BOOK_TYPES[detailAct.bookType] ?? detailAct.bookType) : ""}
						</SheetDescription>
					</SheetHeader>

					{detailAct && (
						<div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="text-muted-foreground block text-xs">Folio</span>
									<span className="font-mono font-medium">#{detailAct.folioNumber}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">Tipo de acta</span>
									<Badge
										variant={detailAct.tipo === "extraordinaria" ? "destructive" : "secondary"}
										className="text-xs mt-0.5"
									>
										{ACT_TIPOS[detailAct.tipo] ?? detailAct.tipo}
									</Badge>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">Fecha</span>
									<span>{detailAct.fecha}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">Hora</span>
									<span>{detailAct.hora || "—"}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">Lugar</span>
									<span>{detailAct.lugar || "—"}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">Quórum</span>
									<span>{detailAct.quorum} asistentes</span>
								</div>
								<div className="col-span-2">
									<span className="text-muted-foreground block text-xs mb-1">Estado</span>
									{detailAct.isPublished ? (
										<Badge variant="default" className="text-xs">Publicada</Badge>
									) : (
										<Badge variant="secondary" className="text-xs">Borrador</Badge>
									)}
								</div>
							</div>

							<div>
								<h4 className="text-sm font-medium mb-2">Contenido</h4>
								<div className="rounded-lg border p-4 bg-muted/20">
									<RichRenderer html={detailAct.contenido} />
								</div>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>

			{/* ── Delete confirmation dialog ───────────────────── */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Eliminar acta</DialogTitle>
						<DialogDescription>
							¿Está seguro de eliminar el acta #{deleteTarget?.folioNumber}? Esta acción no se
							puede deshacer.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={deleteAct.isPending}
						>
							{deleteAct.isPending ? "Eliminando..." : "Eliminar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</ProtectedRoute>
	);
}
