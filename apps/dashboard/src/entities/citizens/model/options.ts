import type { Citizen } from "./types";

export const citizenOptionAdapter = {
	getLabel: (item: Citizen) =>
		`${item.names} ${item.surnames} (${item.cedula})`,
	getValue: (item: Citizen) => item.id,
	renderOption: (item: Citizen) =>
		`${item.names} ${item.surnames} - ${item.cedula}`,
};
