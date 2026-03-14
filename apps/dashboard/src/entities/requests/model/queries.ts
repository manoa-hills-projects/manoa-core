import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import type { ApiResponse } from "@/shared/api/api-client";
import type { DocumentRequest } from "./types";

export const requestKeys = {
    all: ["requests"] as const,
    lists: () => [...requestKeys.all, "list"] as const,
    list: (params: Record<string, unknown>) => [...requestKeys.lists(), params] as const,
    detail: (id: string) => [...requestKeys.all, "detail", id] as const,
};

interface RequestsParams {
    page?: number;
    limit?: number;
    mine?: boolean;
}

export const useRequests = (params: RequestsParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.mine) searchParams.set("mine", "true");

    return useQuery({
        queryKey: requestKeys.list(params as Record<string, unknown>),
        queryFn: () =>
            api.get(`requests?${searchParams.toString()}`).json<ApiResponse<DocumentRequest>>(),
    });
};

export const useRequest = (id: string) =>
    useQuery({
        queryKey: requestKeys.detail(id),
        queryFn: () => api.get(`requests/${id}`).json<{ data: DocumentRequest }>(),
        enabled: !!id,
    });

export interface CreateRequestPayload {
    type: "residency_letter";
    payload: {
        fullName: string;
        idNumber: string;
        nationality: string;
        yearsOfResidence: number;
        streetName: string;
        houseNumber: string;
        issueDay: number;
        issueMonth: string;
    };
}

export const useCreateRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateRequestPayload) =>
            api.post("requests", { json: data }).json<{ data: DocumentRequest }>(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
        },
    });
};

export interface ReviewRequestPayload {
    status: "approved" | "rejected";
    rejectionReason?: string;
}

export const useReviewRequest = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ReviewRequestPayload) =>
            api.patch(`requests/${id}/review`, { json: data }).json<{ data: DocumentRequest }>(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
        },
    });
};

export const downloadRequestDocument = async (id: string) => {
    const response = await api.get(`requests/${id}/document`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carta-de-residencia-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
};
