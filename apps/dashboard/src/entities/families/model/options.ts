import type { Family } from "./types";

export const familyOptionAdapter = {
	getLabel: (item: Family) => item.family_name,
	getValue: (item: Family) => item.id,
	renderOption: (item: Family) => item.family_name,
};
