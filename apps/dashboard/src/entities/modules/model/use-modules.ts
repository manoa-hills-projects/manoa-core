import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/shared/api/api-client";
import type { Module } from "./types";

type ModulesResponse = { data: Module[] };

/**
 * Hook para obtener los módulos del sistema desde GET /api/modules.
 * Los módulos vienen de la DB, no están hardcodeados.
 */
export function useModules() {
	const { data, isLoading, isError } = useQuery({
		queryKey: ["modules"],
		queryFn: () => api.get("modules").json<ModulesResponse>(),
		staleTime: 10 * 60 * 1000, // 10 min - cambia poco
	});

	// Módulos agrupados por groupKey
	const modulesByGroup = useMemo(() => {
		if (!data?.data) return [];
		const groups = new Map<string, { label: string; modules: Module[] }>();

		for (const mod of data.data) {
			if (!groups.has(mod.groupKey)) {
				groups.set(mod.groupKey, {
					label: mod.groupLabel,
					modules: [],
				});
			}
			groups.get(mod.groupKey)!.modules.push(mod);
		}

		return Array.from(groups.entries()).map(([key, group]) => ({
			key,
			...group,
		}));
	}, [data]);

	return {
		modules: data?.data ?? [],
		modulesByGroup,
		isLoading,
		isError,
	};
}

/**
 * Hook para obtener un solo módulo por su key
 */
export function useModule(key: string) {
	const { modules } = useModules();
	return modules.find((m) => m.key === key);
}
