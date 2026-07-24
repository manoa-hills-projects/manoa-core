export type DniType = 'NATIONAL' | 'FOREIGN' | 'SYNTHETIC';

export interface CitizenDisability {
	disability_type: string;
	description?: string | null;
}

export interface Citizen {
	id: string;
	cedula: string;
	dni_type: DniType;
	phone: string | null;
	names: string;
	surnames: string;
	gender: string;
	birth_date: string;
	is_head_of_household: boolean;
	family_id: string | null;
	family_label?: string | null;
	house_label?: string | null;
	user_id?: string | null;
	has_disability?: boolean;
	disabilities?: CitizenDisability[];
}
