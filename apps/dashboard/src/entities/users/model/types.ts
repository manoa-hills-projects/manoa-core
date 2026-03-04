export interface User {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string | null;
	role?: string | null;
	banned?: boolean | null;
	banReason?: string | null;
	banExpires?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserQueryParams {
	limit?: number;
	page?: number;
	search?: string;
}
