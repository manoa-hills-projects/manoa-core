import { useState, useCallback } from "react";
import { useDebouncedValue } from "@tanstack/react-pacer";

interface UseTableFiltersOptions {
  initialPageSize?: number;
  debounceWait?: number;
}

export function useTableFilters(options: UseTableFiltersOptions = {}) {
  const { initialPageSize = 10, debounceWait = 500 } = options;

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, { wait: debounceWait });

  // Resetear a la página 0 cuando se busca algo nuevo
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  return {
    // Estados para la UI (Inputs/DataTable)
    search,
    pagination,
    // Funciones para actualizar
    setSearch: handleSearchChange,
    setPagination,
    // Valor procesado para la API (React Query)
    filters: {
      search: debouncedSearch,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
    },
  };
}
