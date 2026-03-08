import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/ui/sheet";
import { LocationPicker } from "@/shared/ui/location-picker";
import { DataTable } from "@/shared/ui/data-table";

import type { House } from "@/entities/houses/model/types";
import { useFamilies, type Family } from "@/entities/families";
import { familyColumns } from "@/entities/families/model/columns";

interface HouseDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  house: House | null;
}

export function HouseDetailSheet({
  open,
  onOpenChange,
  house,
}: HouseDetailSheetProps) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data: response } = useFamilies(
    pagination,
    { house_id: house?.id }
  );

  const columns = useMemo<ColumnDef<Family>[]>(() => {
    return familyColumns;
  }, []);

  if (!house) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton className="sm:max-w-xl outline-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalles de la Vivienda</SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-col gap-6 mt-4">
              <div>
                <div className="mb-2">
                  <div>
                    <b>Dirección:</b> {house.address}
                  </div>
                  <div>
                    <b>Sector:</b> {house.sector}
                  </div>
                  <div>
                    <b>Número:</b> {house.number}
                  </div>
                </div>
                {house.latitude && house.longitude ? (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">
                      Ubicación
                    </label>
                    <LocationPicker
                      value={{
                        latitude: house.latitude,
                        longitude: house.longitude,
                      }}
                      onChange={() => { }}
                    />
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-4">
                    Sin ubicación registrada
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Familias residentes</h3>
                <DataTable
                  columns={columns}
                  data={response?.data ?? []}
                  rowCount={response?.metadata?.total ?? 0}
                  pagination={pagination}
                  onPaginationChange={setPagination}
                />
              </div>
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
