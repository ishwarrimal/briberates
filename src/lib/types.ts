export type EntityStatus = "pending" | "approved" | "rejected";

export type Service = {
  id: number;
  slug: string;
  name: string;
  category: string;
  short_desc: string;
  official_fee_note: string;
  status: EntityStatus;
};

export type SubItem = {
  id: number;
  service_id: number;
  slug: string;
  name: string;
  description: string;
  official_fee_note: string;
  status: EntityStatus;
};

export type City = {
  id: number;
  slug: string;
  name: string;
  state: string;
  status: EntityStatus;
};

export type Office = {
  id: number;
  slug: string;
  name: string;
  area: string;
  address: string;
  city_id: number;
  service_id: number;
  status: EntityStatus;
};

export type PaidTo = "sro-staff" | "agent" | "middleman" | "other";
export type ReportStatus = "pending" | "approved" | "rejected";

export type Report = {
  id: number;
  sub_item_id: number;
  office_id: number;
  official_fee: number | null;
  extra_paid: number;
  paid_to: PaidTo;
  period: string; // "YYYY-MM"
  note: string | null;
  status: ReportStatus;
  is_sample: number;
  created_at: string;
};

export type Confidence = "none" | "low" | "medium" | "high";

export type RateStats = {
  count: number; // approved reports used
  corroborations: number;
  median: number | null;
  q1: number | null;
  q3: number | null;
  min: number | null;
  max: number | null;
  confidence: Confidence;
};

export type SubItemRate = {
  subItem: SubItem;
  stats: RateStats;
};
