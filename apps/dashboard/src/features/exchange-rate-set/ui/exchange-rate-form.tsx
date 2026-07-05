import { IconDownload, IconRefresh } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	useFetchBcvRate,
	useSetRate,
	useTodayRate,
} from "@/entities/treasury";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function ExchangeRateForm() {
	const { data: rate } = useTodayRate();
	const setRate = useSetRate();
	const fetchBcv = useFetchBcvRate();
	const [value, setValue] = useState("");

	useEffect(() => {
		if (rate?.bsPerUsd) setValue(rate.bsPerUsd);
	}, [rate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await setRate.mutateAsync({ bsPerUsd: value });
			toast.success("Tasa actualizada");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Error al actualizar la tasa",
			);
		}
	};

	const handleFetchBcv = async () => {
		try {
			const result = await fetchBcv.mutateAsync();
			setValue(result.rate.bsPerUsd);
			const sourceLabel =
				result.source === "dolarapi"
					? "dolarapi (BCV oficial)"
					: "BCV directo";
			toast.success(
				`Tasa BCV publicada: ${result.rate.bsPerUsd} Bs/USD · fuente ${sourceLabel}`,
			);
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "No se pudo obtener la tasa del BCV",
			);
		}
	};

	const anyPending = setRate.isPending || fetchBcv.isPending;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tasa Bs/USD del día</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<form onSubmit={handleSubmit} className="flex items-end gap-3">
					<div className="flex flex-col gap-1 flex-1">
						<Label htmlFor="bsPerUsd">Bolívares por 1 USD</Label>
						<Input
							id="bsPerUsd"
							inputMode="decimal"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder="35.50"
							required
						/>
					</div>
					<Button type="submit" disabled={anyPending || !value.trim()}>
						{rate ? (
							<>
								<IconRefresh className="h-4 w-4" /> Actualizar
							</>
						) : (
							"Publicar"
						)}
					</Button>
				</form>

				<div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-3 text-sm">
					<div>
						<p className="font-medium">Traer tasa oficial del BCV</p>
						<p className="text-xs text-muted-foreground">
							Automático cada mañana (09:00 VET). Podés forzarlo ahora.
						</p>
					</div>
					<Button
						type="button"
						variant="secondary"
						onClick={handleFetchBcv}
						disabled={anyPending}
					>
						<IconDownload className="h-4 w-4" />
						{fetchBcv.isPending ? "Consultando..." : "Traer de BCV"}
					</Button>
				</div>

				{rate && (
					<p className="text-xs text-muted-foreground">
						Vigente hasta el próximo cambio (fecha {rate.date}).
					</p>
				)}
			</CardContent>
		</Card>
	);
}
