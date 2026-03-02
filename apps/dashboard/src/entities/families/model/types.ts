export interface Family {
	id: string;
	family_name: string;
	head_of_household_id: string | null;
	head_of_household_label?: string | null;
	house_id: string;
	house_label?: string | null;
}
