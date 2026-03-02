import type { House } from "./types";

const formatHouseLabel = (item: House) =>
	`${item.sector} · ${item.number} · ${item.address}`;

export const houseOptionAdapter = {
	getLabel: formatHouseLabel,
	getValue: (item: House) => item.id,
	renderOption: formatHouseLabel,
};
