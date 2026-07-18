export interface Act {
  id: string;
  bookType: string;
  folioNumber: number;
  fecha: string;
  hora: string | null;
  lugar: string | null;
  tipo: string;
  quorum: number;
  contenido: string;
  vocerosPresentes: string | null;
  acuerdos: string | null;
  pdfUrl: string | null;
  isPublished: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number | null;
}

export const BOOK_TYPES: Record<string, string> = {
  asamblea_ciudadanos: "Asamblea de Ciudadanos",
  coordinacion: "Colectivo de Coordinación Comunitaria",
  ejecutiva: "Unidad Ejecutiva",
  administrativa: "Unidad Administrativa Financiera Comunitaria",
  contraloria: "Contraloría Social",
};

export const ACT_TIPOS: Record<string, string> = {
  ordinaria: "Ordinaria",
  extraordinaria: "Extraordinaria",
};
