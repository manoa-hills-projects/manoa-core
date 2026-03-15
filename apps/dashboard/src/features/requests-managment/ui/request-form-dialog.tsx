import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateRequest } from "@/entities/requests";
import { Button } from "@/shared/ui/button";
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

const MONTHS = [
	"enero",
	"febrero",
	"marzo",
	"abril",
	"mayo",
	"junio",
	"julio",
	"agosto",
	"septiembre",
	"octubre",
	"noviembre",
	"diciembre",
];

interface FormValues {
	fullName: string;
	idNumber: string;
	nationality: string;
	yearsOfResidence: number;
	streetName: string;
	houseNumber: string;
	issueDay: number;
	issueMonth: string;
}

interface RequestFormDialogProps {
	open: boolean;
	onClose: () => void;
}

export function RequestFormDialog({ open, onClose }: RequestFormDialogProps) {
	const { mutateAsync: createRequest, isPending } = useCreateRequest();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues: {
			nationality: "Venezolano(a)",
			issueDay: new Date().getDate(),
			issueMonth: MONTHS[new Date().getMonth()],
		},
	});

	const onSubmit = async (values: FormValues) => {
		try {
			await createRequest({
				type: "residency_letter",
				payload: {
					...values,
					yearsOfResidence: Number(values.yearsOfResidence),
					issueDay: Number(values.issueDay),
				},
			});
			toast.success("Solicitud creada correctamente. Pendiente de revisión.");
			reset();
			onClose();
		} catch {
			toast.error("No se pudo crear la solicitud. Intenta de nuevo.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Solicitud de Carta de Residencia</DialogTitle>
					<DialogDescription>
						Completa los datos para generar tu solicitud. Será revisada por un
						administrador.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
					{/* Full Name */}
					<div className="space-y-1.5">
						<Label htmlFor="fullName">Nombre completo *</Label>
						<Input
							id="fullName"
							placeholder="Ej: Juan Carlos Pérez López"
							{...register("fullName", {
								required: "Requerido",
								minLength: { value: 3, message: "Mínimo 3 caracteres" },
							})}
						/>
						{errors.fullName && (
							<p className="text-xs text-destructive">
								{errors.fullName.message}
							</p>
						)}
					</div>

					{/* ID Number */}
					<div className="space-y-1.5">
						<Label htmlFor="idNumber">Número de cédula *</Label>
						<Input
							id="idNumber"
							placeholder="Ej: V-12345678"
							{...register("idNumber", { required: "Requerido" })}
						/>
						{errors.idNumber && (
							<p className="text-xs text-destructive">
								{errors.idNumber.message}
							</p>
						)}
					</div>

					{/* Nationality */}
					<div className="space-y-1.5">
						<Label htmlFor="nationality">Nacionalidad *</Label>
						<Input
							id="nationality"
							placeholder="Venezolano(a)"
							{...register("nationality", { required: "Requerido" })}
						/>
						{errors.nationality && (
							<p className="text-xs text-destructive">
								{errors.nationality.message}
							</p>
						)}
					</div>

					{/* Years of Residence */}
					<div className="space-y-1.5">
						<Label htmlFor="yearsOfResidence">Años de residencia *</Label>
						<Input
							id="yearsOfResidence"
							type="number"
							min={0}
							max={100}
							placeholder="Ej: 5"
							{...register("yearsOfResidence", {
								required: "Requerido",
								min: { value: 0, message: "Mínimo 0" },
							})}
						/>
						{errors.yearsOfResidence && (
							<p className="text-xs text-destructive">
								{errors.yearsOfResidence.message}
							</p>
						)}
					</div>

					{/* Street Name */}
					<div className="space-y-1.5">
						<Label htmlFor="streetName">Nombre de la calle *</Label>
						<Input
							id="streetName"
							placeholder="Ej: Calle Principal"
							{...register("streetName", { required: "Requerido" })}
						/>
						{errors.streetName && (
							<p className="text-xs text-destructive">
								{errors.streetName.message}
							</p>
						)}
					</div>

					{/* House Number */}
					<div className="space-y-1.5">
						<Label htmlFor="houseNumber">Número de casa *</Label>
						<Input
							id="houseNumber"
							placeholder="Ej: 14-B"
							{...register("houseNumber", { required: "Requerido" })}
						/>
						{errors.houseNumber && (
							<p className="text-xs text-destructive">
								{errors.houseNumber.message}
							</p>
						)}
					</div>

					{/* Issue date */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label htmlFor="issueDay">Día de emisión *</Label>
							<Input
								id="issueDay"
								type="number"
								min={1}
								max={31}
								{...register("issueDay", { required: "Requerido" })}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="issueMonth">Mes de emisión *</Label>
							<select
								id="issueMonth"
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								{...register("issueMonth", { required: "Requerido" })}
							>
								{MONTHS.map((m) => (
									<option key={m} value={m}>
										{m.charAt(0).toUpperCase() + m.slice(1)}
									</option>
								))}
							</select>
						</div>
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isPending}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Enviar solicitud
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
