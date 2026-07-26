export interface Event {
	id: string;
	title: string;
	description?: string | null;
	date: string;
	time?: string | null;
	duration?: number | null;
	location?: string | null;
	jitsiRoomName?: string | null;
	status: "scheduled" | "active" | "completed" | "cancelled";
	createdBy?: string | null;
	createdAt: number;
	updatedAt?: number | null;
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
	scheduled: "Programada",
	active: "En Vivo",
	completed: "Realizada",
	cancelled: "Cancelada",
};

export const EVENT_STATUS_VARIANTS: Record<string, string> = {
	scheduled: "secondary",
	active: "default",
	completed: "outline",
	cancelled: "destructive",
};
