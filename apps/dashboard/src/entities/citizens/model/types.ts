export interface Citizen {
	id: string;
	cedula: string;
	names: string;
	surnames: string;
	gender: string;
	birth_date: string;
	is_head_of_household: boolean;
	family_id: string | null;
	family_label?: string | null;
	house_label?: string | null;
	user_id?: string | null;
}
