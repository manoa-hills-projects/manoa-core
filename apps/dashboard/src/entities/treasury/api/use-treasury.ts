/**
 * Hooks TanStack Query para el módulo de tesorería.
 * Cubren catálogo (categorías, conceptos, tasa), pagos, egresos y transparencia.
 */

import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import type {
	PaymentStatus,
	TransparencySummary,
	TreasuryCategory,
	TreasuryConcept,
	TreasuryExpense,
	TreasuryPayment,
	TreasuryRate,
} from "../model/types";

// ═══════════════════════════════════════════════════════════════
// KEYS
// ═══════════════════════════════════════════════════════════════

export const treasuryKeys = {
	all: ["treasury"] as const,
	transparency: () => [...treasuryKeys.all, "transparency"] as const,
	categories: () => [...treasuryKeys.all, "categories"] as const,
	concepts: (activeOnly = true) =>
		[...treasuryKeys.all, "concepts", { activeOnly }] as const,
	rateToday: () => [...treasuryKeys.all, "rate", "today"] as const,
	myPayments: () => [...treasuryKeys.all, "payments", "mine"] as const,
	payments: (filters: { status?: PaymentStatus; page: number; limit: number }) =>
		[...treasuryKeys.all, "payments", "all", filters] as const,
	expenses: (filters: { categoryId?: string; page: number; limit: number }) =>
		[...treasuryKeys.all, "expenses", filters] as const,
};

// Backend envuelve todo en { data, metadata }
interface Envelope<T> {
	data: T;
	metadata: null | {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

// ═══════════════════════════════════════════════════════════════
// TRANSPARENCIA
// ═══════════════════════════════════════════════════════════════

export const useTransparencySummary = () =>
	useQuery({
		queryKey: treasuryKeys.transparency(),
		queryFn: async () => {
			const res = await api
				.get("treasury/transparency")
				.json<Envelope<TransparencySummary>>();
			return res.data;
		},
	});

// ═══════════════════════════════════════════════════════════════
// CATEGORÍAS
// ═══════════════════════════════════════════════════════════════

export const useCategories = () =>
	useQuery({
		queryKey: treasuryKeys.categories(),
		queryFn: async () => {
			const res = await api
				.get("treasury/categories")
				.json<Envelope<TreasuryCategory[]>>();
			return res.data;
		},
	});

export const useCreateCategory = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			key: string;
			name: string;
			description?: string | null;
			kind: "income" | "expense" | "both";
			isActive?: boolean;
		}) => {
			const res = await api
				.post("treasury/categories", { json: data })
				.json<Envelope<TreasuryCategory>>();
			return res.data;
		},
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: treasuryKeys.categories() }),
	});
};

// ═══════════════════════════════════════════════════════════════
// CONCEPTOS
// ═══════════════════════════════════════════════════════════════

export const useConcepts = (activeOnly = true) =>
	useQuery({
		queryKey: treasuryKeys.concepts(activeOnly),
		queryFn: async () => {
			const res = await api
				.get("treasury/concepts", {
					searchParams: { activeOnly: activeOnly ? "true" : "false" },
				})
				.json<Envelope<TreasuryConcept[]>>();
			return res.data;
		},
	});

export const useCreateConcept = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			key: string;
			name: string;
			description?: string | null;
			categoryId: string;
			defaultAmountBs?: string | null;
			defaultAmountUsd?: string | null;
			isActive?: boolean;
		}) => {
			const res = await api
				.post("treasury/concepts", { json: data })
				.json<Envelope<TreasuryConcept>>();
			return res.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: treasuryKeys.all });
		},
	});
};

export const useDeleteConcept = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`treasury/concepts/${id}`).json();
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: treasuryKeys.all }),
	});
};

// ═══════════════════════════════════════════════════════════════
// TASA
// ═══════════════════════════════════════════════════════════════

export const useTodayRate = () =>
	useQuery({
		queryKey: treasuryKeys.rateToday(),
		queryFn: async () => {
			const res = await api
				.get("treasury/rates/today")
				.json<Envelope<TreasuryRate | null>>();
			return res.data;
		},
	});

export const useSetRate = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (data: { bsPerUsd: string; date?: string }) => {
			const res = await api
				.post("treasury/rates", { json: data })
				.json<Envelope<TreasuryRate>>();
			return res.data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: treasuryKeys.all }),
	});
};

// ═══════════════════════════════════════════════════════════════
// PAGOS
// ═══════════════════════════════════════════════════════════════

interface CreatePaymentArgs {
	conceptId?: string | null;
	description?: string | null;
	amountBs: string;
	amountUsd: string;
	receipt: File;
}

const buildPaymentFormData = (args: Partial<CreatePaymentArgs>) => {
	const form = new FormData();
	if (args.conceptId) form.append("conceptId", args.conceptId);
	if (args.description) form.append("description", args.description);
	if (args.amountBs) form.append("amountBs", args.amountBs);
	if (args.amountUsd) form.append("amountUsd", args.amountUsd);
	if (args.receipt) form.append("receipt", args.receipt);
	return form;
};

export const useSubmitPayment = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (args: CreatePaymentArgs) => {
			const res = await api
				.post("treasury/payments", { body: buildPaymentFormData(args) })
				.json<Envelope<TreasuryPayment>>();
			return res.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: treasuryKeys.all });
		},
	});
};

export const useResubmitPayment = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (
			args: { id: string } & Partial<CreatePaymentArgs>,
		) => {
			const { id, ...rest } = args;
			const res = await api
				.patch(`treasury/payments/${id}`, {
					body: buildPaymentFormData(rest),
				})
				.json<Envelope<TreasuryPayment>>();
			return res.data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: treasuryKeys.all }),
	});
};

export const useMyPayments = () =>
	useQuery({
		queryKey: treasuryKeys.myPayments(),
		queryFn: async () => {
			const res = await api
				.get("treasury/payments/mine")
				.json<Envelope<TreasuryPayment[]>>();
			return res.data;
		},
	});

export const usePayments = (filters: {
	status?: PaymentStatus;
	page: number;
	limit: number;
}) =>
	useQuery({
		queryKey: treasuryKeys.payments(filters),
		queryFn: async () => {
			const searchParams: Record<string, string | number> = {
				page: filters.page,
				limit: filters.limit,
			};
			if (filters.status) searchParams.status = filters.status;
			const res = await api
				.get("treasury/payments", { searchParams })
				.json<Envelope<TreasuryPayment[]>>();
			return res;
		},
	});

export const useReviewPayment = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (args: {
			id: string;
			action: "approve" | "reject";
			notes?: string | null;
		}) => {
			const res = await api
				.post(`treasury/payments/${args.id}/review`, {
					json: { action: args.action, notes: args.notes ?? null },
				})
				.json<Envelope<TreasuryPayment>>();
			return res.data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: treasuryKeys.all }),
	});
};

// ═══════════════════════════════════════════════════════════════
// EGRESOS
// ═══════════════════════════════════════════════════════════════

interface CreateExpenseArgs {
	categoryId: string;
	description: string;
	beneficiary?: string | null;
	amountBs: string;
	amountUsd: string;
	spentAt?: string;
	receipt?: File | null;
}

export const useCreateExpense = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (args: CreateExpenseArgs) => {
			const form = new FormData();
			form.append("categoryId", args.categoryId);
			form.append("description", args.description);
			if (args.beneficiary) form.append("beneficiary", args.beneficiary);
			form.append("amountBs", args.amountBs);
			form.append("amountUsd", args.amountUsd);
			if (args.spentAt) form.append("spentAt", args.spentAt);
			if (args.receipt) form.append("receipt", args.receipt);
			const res = await api
				.post("treasury/expenses", { body: form })
				.json<Envelope<TreasuryExpense>>();
			return res.data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: treasuryKeys.all }),
	});
};

export const useExpenses = (filters: {
	categoryId?: string;
	page: number;
	limit: number;
}) =>
	useQuery({
		queryKey: treasuryKeys.expenses(filters),
		queryFn: async () => {
			const searchParams: Record<string, string | number> = {
				page: filters.page,
				limit: filters.limit,
			};
			if (filters.categoryId) searchParams.categoryId = filters.categoryId;
			const res = await api
				.get("treasury/expenses", { searchParams })
				.json<Envelope<TreasuryExpense[]>>();
			return res;
		},
	});

/**
 * Path relativo al backend para descargar un comprobante.
 * Se prepende la API base porque `api` de ky ya la resuelve.
 */
export function receiptUrl(key: string): string {
	return `treasury/receipts/${key}`;
}
