import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import { authClient } from "@/lib/auth-client";
import {
	HomeIcon,
	UsersIcon,
	UserIcon,
	SparklesIcon,
	ArrowRightIcon,
	MessageSquareIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

export const Route = createFileRoute("/_authenticated/")({
	component: RouteComponent,
});

type CensusSummary = {
	houses: number;
	families: number;
	citizens: number;
};

const useCensusSummary = () =>
	useQuery({
		queryKey: ["census-summary"],
		queryFn: async () => {
			const [houses, families, citizens] = await Promise.all([
				api.get("houses", { searchParams: { limit: 1 } }).json<{ metadata: { total: number } }>(),
				api.get("families", { searchParams: { limit: 1 } }).json<{ metadata: { total: number } }>(),
				api.get("citizens", { searchParams: { limit: 1 } }).json<{ metadata: { total: number } }>(),
			]);
			return {
				houses: houses.metadata.total,
				families: families.metadata.total,
				citizens: citizens.metadata.total,
			} satisfies CensusSummary;
		},
	});

const STATS = [
	{ key: "houses" as const, label: "Viviendas", icon: HomeIcon, color: "text-blue-500", bg: "bg-blue-500/10" },
	{ key: "families" as const, label: "Familias", icon: UsersIcon, color: "text-violet-500", bg: "bg-violet-500/10" },
	{ key: "citizens" as const, label: "Habitantes", icon: UserIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

function RouteComponent() {
	const { data: session } = authClient.useSession();
	const { data, isLoading } = useCensusSummary();

	const firstName = session?.user?.name?.split(" ")[0] ?? "Admin";

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Saludo */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Bienvenido, {firstName} 👋
				</h1>
				<p className="text-muted-foreground text-sm mt-1">
					Aquí está el resumen del Consejo Comunal de Manoa.
				</p>
			</div>

			{/* Stats del censo */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{STATS.map(({ key, label, icon: Icon, color, bg }) => (
					<Card key={key}>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								{label}
							</CardTitle>
							<div className={`rounded-md p-2 ${bg}`}>
								<Icon className={`size-4 ${color}`} />
							</div>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<Skeleton className="h-8 w-20" />
							) : (
								<p className="text-3xl font-bold">
									{data?.[key].toLocaleString("es-VE") ?? "—"}
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Acceso rápido al asistente */}
			<Card className="border-dashed">
				<CardContent className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-start gap-4">
						<div className="rounded-xl bg-primary/10 p-3">
							<SparklesIcon className="size-6 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold">Asistente Manoa IA</h2>
							<p className="text-sm text-muted-foreground max-w-sm">
								Consulta estadísticas, información del censo o gestiona
								trámites usando lenguaje natural.
							</p>
						</div>
					</div>
					<Button asChild className="shrink-0 gap-2">
						<Link to="/ai-assistant">
							<MessageSquareIcon className="size-4" />
							Abrir asistente
							<ArrowRightIcon className="size-4" />
						</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
