import { useHouses } from "@/entities/houses";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/shared/ui/table";

export const HouseTable = () => {
	const { data: houses} = useHouses();

	return (
		<div className="rounded-md border bg-card">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Sector</TableHead>
						<TableHead>Dirección</TableHead>
						<TableHead className="text-right">Número</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{houses?.map((house) => (
						<TableRow key={house.id}>
							<TableCell className="font-medium">{house.sector}</TableCell>
							<TableCell>{house.address}</TableCell>
							<TableCell className="text-right">{house.number}</TableCell>
						</TableRow>
					))}
					{houses?.length === 0 && (
						<TableRow>
							<TableCell colSpan={3} className="h-24 text-center">
								No hay casas registradas aún.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	)
}