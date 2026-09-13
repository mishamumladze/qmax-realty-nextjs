export interface AdminCredentials {
  username: string;
  password: string;
}

export interface MessageSummary {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  created_at: string;
  contact_id?: number | null;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  created_at: string;
}

export type CrmStatus = "prospect" | "lead" | "customer" | "archived";

export interface CrmContact {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: CrmStatus;
  tags: string[];
  source: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  deleted_at?: string | null;
}

export type CrmActivityKind = "call" | "email" | "meeting" | "note" | "status";

export interface CrmActivity {
  id: number;
  contact_id: number;
  kind: CrmActivityKind;
  body: string | null;
  occurred_at: string;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
}

export type CrmMessageDirection = "in" | "out";
export type CrmMessageChannel = "email" | "chat" | "sms" | "note";

export interface CrmMessage {
  id: number;
  contact_id: number;
  direction: CrmMessageDirection;
  channel: CrmMessageChannel;
  sender: string | null;
  subject: string | null;
  body: string;
  occurred_at: string;
  created_at: string;
}

export interface CrmListParams {
  q?: string;
  status?: CrmStatus;
  tag?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PropertyFormData {
  title: string;
  type?: string;
  neighborhood?: string;
  city?: string;
  region?: string;
  country?: string;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqmt?: number;
  price?: number;
  currency?: string;
  sale_type?: string;
  price_type?: string;
  cadastral_code?: string;
  energy_class?: string;
  floor_plan_url?: string;
  year_built?: number;
  renovation_year?: number;
  floor?: number | string;
  meta_description?: string;
  description?: string;
  gallery?: string[];
  floor_plan?: string;
  coords?: [number, number];
  card_image?: string;
  property_subtype?: string;
  furnishing?: string;
  balcony?: boolean;
  balcony_sqmt?: number;
  lot_sqmt?: number;
  view?: string[];
  video_url?: string;
  virtual_tour_url?: string;
  listing_status?: string;
  is_featured?: boolean;
  street_address?: string;
  building_status?: string;
  condition?: string;
  project_type?: string;
  ceiling_height?: number;
  heating_type?: string;
  hot_water_type?: string;
  parking_type?: string;
  kitchen_appliances?: string[];
  total_floors?: number;
  natural_gas?: boolean;
  internet?: boolean;
  water_supply?: boolean;
  electricity?: boolean;
  tv?: boolean;
  sewerage?: boolean;
  elevator?: boolean;
  ac?: boolean;
  security?: boolean;
  swimming_pool?: boolean;
  sauna_jacuzzi?: boolean;
  gym?: boolean;
  private_yard?: boolean;
  bbq_area?: boolean;
  concierge?: boolean;
  fireplace?: boolean;
  storage?: boolean;
  intercom?: boolean;
  pet_friendly?: boolean;
  wheelchair_accessible?: boolean;
}
