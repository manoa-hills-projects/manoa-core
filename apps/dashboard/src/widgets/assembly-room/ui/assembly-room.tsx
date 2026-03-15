import { ExternalLink, Video } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";

export function AssemblyRoom() {
	const { data: session } = authClient.useSession();

	if (!session?.user) {
		return (
			<div className="p-8 text-center text-muted-foreground">
				Verificando acceso a la sala...
			</div>
		);
	}

	// Generamos un ID único para la asamblea de esta comunidad.
	// En el futuro, esto puede venir de la URL o base de datos.
	const ROOM_NAME = "Manoa-Asamblea-Comunitaria-Virtual-2024";

	const displayName = encodeURIComponent(session.user.name || "Vecino");
	const jitsiUrl = `https://meet.jit.si/${ROOM_NAME}#userInfo.displayName="${displayName}"`;

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Asamblea Virtual 🎥</CardTitle>
					<CardDescription>
						Sala de reuniones principal de la comunidad. Por favor, mantén tu
						micrófono apagado si no estás hablando.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-xl bg-muted/20">
						<div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
							<Video className="h-10 w-10" />
						</div>
						<h3 className="text-2xl font-semibold mb-2">La sala está lista</h3>
						<p className="text-muted-foreground max-w-md mb-8">
							Para garantizar la mejor calidad y evitar el límite de tiempo de
							Jitsi, la asamblea se abrirá de forma segura en una nueva pestaña.
						</p>
						<Button size="lg" className="gap-2 text-lg px-8 h-14" asChild>
							<a href={jitsiUrl} target="_blank" rel="noopener noreferrer">
								Entrar a la Asamblea
								<ExternalLink className="h-5 w-5" />
							</a>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
