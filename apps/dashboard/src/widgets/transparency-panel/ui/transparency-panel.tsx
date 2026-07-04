import {
	formatBs,
	formatUsd,
	useTransparencySummary,
} from "@/entities/treasury";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export function TransparencyPanel() {
	const { data, isLoading, error } = useTransparencySummary();

	if (isLoading) {
		return (
			<Card>
				<CardContent className="py-8 text-sm text-muted-foreground">
					Cargando datos financieros...
				</CardContent>
			</Card>
		);
	}

	if (error || !data) {
		return (
			<Card>
				<CardContent className="py-8 text-sm text-destructive">
					No se pudo cargar la información de tesorería.
				</CardContent>
			</Card>
		);
	}

	const balancePositive = data.balance.usdCents >= 0;

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-normal text-muted-foreground">
							Saldo actual (USD)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p
							className={`text-3xl font-bold ${
								balancePositive ? "" : "text-destructive"
							}`}
						>
							{formatUsd(data.balance.usdCents)}
						</p>
						<p className="text-sm text-muted-foreground mt-1">
							{formatBs(data.balance.bsCents)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-normal text-muted-foreground">
							Ingresos aprobados
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-semibold">
							{formatUsd(data.totals.income.usdCents)}
						</p>
						<p className="text-sm text-muted-foreground mt-1">
							{formatBs(data.totals.income.bsCents)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-normal text-muted-foreground">
							Egresos registrados
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-semibold">
							{formatUsd(data.totals.expense.usdCents)}
						</p>
						<p className="text-sm text-muted-foreground mt-1">
							{formatBs(data.totals.expense.bsCents)}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Ingresos por categoría</CardTitle>
					</CardHeader>
					<CardContent>
						<CategoryList items={data.byCategory.income} emptyLabel="Sin ingresos" />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Egresos por categoría</CardTitle>
					</CardHeader>
					<CardContent>
						<CategoryList
							items={data.byCategory.expenses}
							emptyLabel="Sin egresos"
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

interface CategoryListProps {
	items: {
		categoryId: string | null;
		categoryName: string;
		bsCents: number;
		usdCents: number;
		count: number;
	}[];
	emptyLabel: string;
}

function CategoryList({ items, emptyLabel }: CategoryListProps) {
	if (items.length === 0) {
		return <p className="text-sm text-muted-foreground py-4">{emptyLabel}</p>;
	}
	return (
		<div className="flex flex-col divide-y">
			{items.map((item) => (
				<div
					key={item.categoryId ?? "sin-categoria"}
					className="flex items-center justify-between py-2"
				>
					<div>
						<p className="font-medium">{item.categoryName}</p>
						<p className="text-xs text-muted-foreground">
							{item.count} movimiento{item.count === 1 ? "" : "s"}
						</p>
					</div>
					<div className="text-right">
						<p className="font-medium">{formatUsd(item.usdCents)}</p>
						<p className="text-xs text-muted-foreground">
							{formatBs(item.bsCents)}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}
