import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSetRate, useTodayRate } from "@/entities/treasury";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function ExchangeRateForm() {
	const { data: rate } = useTodayRate();
	const setRate = useSetRate();
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
			toast.error(err instanceof Error ? err.message : "Error al actualizar la tasa");
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tasa Bs/USD del día</CardTitle>
			</CardHeader>
			<CardContent>
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
					<Button type="submit" disabled={setRate.isPending || !value.trim()}>
						{rate ? "Actualizar" : "Publicar"}
					</Button>
				</form>
				{rate && (
					<p className="mt-2 text-xs text-muted-foreground">
						Vigente hasta el próximo cambio del tesorero.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
