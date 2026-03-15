export type RequestStatus = "pending" | "approved" | "rejected";
export type RequestType = "residency_letter";

export interface ResidencyLetterPayload {
    fullName: string;
    idNumber: string;
    nationality: string;
    yearsOfResidence: number;
    streetName: string;
    houseNumber: string;
    issueDay: number;
    issueMonth: string;
}

export interface DocumentRequest {
    id: string;
    type: RequestType;
    status: RequestStatus;
    userId: string;
    payload: string; // JSON string
    rejectionReason: string | null;
    reviewedBy: string | null;
    reviewedAt: string | number | null;
    createdAt: string | number;
    updatedAt: string | number | null;
}
