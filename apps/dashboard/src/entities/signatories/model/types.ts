export const SIGNATORY_ROLES = [
	"vocero_electoral",
	"vocero_contraloria",
	"testigo_1",
	"testigo_2",
] as const;

export type SignatoryRole = (typeof SIGNATORY_ROLES)[number];

export const SIGNATORY_ROLE_LABELS: Record<SignatoryRole, string> = {
	vocero_electoral: "Vocero de Unidad Electoral",
	vocero_contraloria: "Vocero de Contraloría",
	testigo_1: "Testigo 1",
	testigo_2: "Testigo 2",
};

export interface CouncilSignatory {
	id: string;
	role: SignatoryRole;
	name: string;
	idNumber: string;
	signatureImage: string | null;
	createdAt: string | number;
	updatedAt: string | number | null;
}
