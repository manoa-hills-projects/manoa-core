import type { RequestStatus, RequestType } from "./types";

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
    residency_letter: "Carta de Residencia",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
};

export const requestsConfig = {
    entityName: "Solicitudes",
    description: "Gestión de solicitudes para generación de documentos oficiales.",
};
