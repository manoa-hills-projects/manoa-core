/**
 * Tipos del módulo de tesorería (dashboard).
 * Espeja la forma del backend (`apps/api/src/shared/database/schemas/treasury.schema.ts`).
 * Todos los montos monetarios viajan como enteros de centavos.
 */

export type CategoryKind = "income" | "expense" | "both";

export interface TreasuryCategory {
	id: string;
	key: string;
	name: string;
	description: string | null;
	kind: CategoryKind;
	isActive: boolean;
}

export interface TreasuryConcept {
	id: string;
	key: string;
	name: string;
	description: string | null;
	categoryId: string;
	defaultBsCents: number | null;
	defaultUsdCents: number | null;
	validFrom: string;
	validUntil: string | null;
	isActive: boolean;
	createdBy: string;
}

export interface TreasuryRate {
	id: string;
	date: string;
	bsPerUsd: string;
	createdBy: string;
}

export type PaymentStatus = "pending" | "approved" | "rejected";

export interface TreasuryPayment {
	id: string;
	userId: string;
	conceptId: string | null;
	description: string | null;
	amountBsCents: number;
	amountUsdCents: number;
	rateId: string;
	receiptR2Key: string;
	status: PaymentStatus;
	reviewNotes: string | null;
	reviewedBy: string | null;
	reviewedAt: string | null;
	submittedAt: string;
}

export interface TreasuryExpense {
	id: string;
	categoryId: string;
	description: string;
	beneficiary: string | null;
	amountBsCents: number;
	amountUsdCents: number;
	rateId: string;
	receiptR2Key: string | null;
	spentAt: string;
	registeredBy: string;
}

export interface CategoryAggregate {
	categoryId: string | null;
	categoryName: string;
	bsCents: number;
	usdCents: number;
	count: number;
}

export interface TransparencySummary {
	balance: { bsCents: number; usdCents: number };
	totals: {
		income: { bsCents: number; usdCents: number };
		expense: { bsCents: number; usdCents: number };
	};
	byCategory: {
		income: CategoryAggregate[];
		expenses: CategoryAggregate[];
	};
}
