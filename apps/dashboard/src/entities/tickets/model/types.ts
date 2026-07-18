export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "recibido" | "en_proceso" | "resuelto";
  submittedBy: string;
  assignedTo: string | null;
  resolutionNotes: string | null;
  createdAt: number;
  updatedAt: number | null;
}

export const TICKET_CATEGORIES: Record<string, string> = {
  electricidad: "💡 Electricidad",
  agua: "💧 Agua",
  gas: "🔥 Gas",
  alumbrado: "💡 Alumbrado público",
  areas_verdes: "🌳 Áreas verdes",
  seguridad: "🔒 Seguridad",
  vialidad: "🛣️ Vialidad",
  otro: "📌 Otro",
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  recibido: "Recibido",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
};

export const TICKET_STATUS_COLORS: Record<string, string> = {
  recibido: "secondary",
  en_proceso: "default",
  resuelto: "outline",
};
