export interface SectorStat {
  sector: string;
  houses: number;
  citizens: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface MonthStat {
  month: string;
  count: number;
}

export interface StatsOverview {
  census: {
    totals: {
      houses: number;
      families: number;
      citizens: number;
    };
    bySector: SectorStat[];
    composition: {
      heads: number;
      members: number;
    };
    gender: {
      male: number;
      female: number;
    };
    age: {
      minors: number;
      adults: number;
    };
  };
  requests: {
    total: number;
    byStatus: StatusStat[];
    byMonth: MonthStat[];
  };
  polls: {
    total: number;
    open: number;
    closed: number;
  };
}

export interface CitizenStats {
  total: number;
  gender: {
    male: number;
    female: number;
  };
  headsOfHousehold: number;
  disabilities: {
    total: number;
    byType: Record<string, number>;
  };
}
