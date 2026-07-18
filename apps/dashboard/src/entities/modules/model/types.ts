export interface Module {
  id: number;
  key: string;
  name: string;
  description: string | null;
  route: string | null;
  icon: string | null;
  groupKey: string;
  groupLabel: string;
  sortOrder: number;
  isActive: boolean;
}
