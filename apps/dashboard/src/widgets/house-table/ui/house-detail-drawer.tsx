import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/shared/ui/drawer";
import type { House } from "@/entities/houses/model/types";
import { LocationPicker } from "@/shared/ui/location-picker";

interface HouseDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  house: House | null;
}

export function HouseDetailDrawer({ open, onOpenChange, house }: HouseDetailDrawerProps) {
  if (!house) return null;
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Detalles de la Vivienda</DrawerTitle>
          <DrawerDescription>
            <div className="mb-2">
              <div><b>Dirección:</b> {house.address}</div>
              <div><b>Sector:</b> {house.sector}</div>
              <div><b>Número:</b> {house.number}</div>
            </div>
            {house.latitude && house.longitude ? (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Ubicación</label>
                <LocationPicker
                  value={{ latitude: house.latitude, longitude: house.longitude }}
                  onChange={() => {}}
                />
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-4">Sin ubicación registrada</div>
            )}
          </DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
}
