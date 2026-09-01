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
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  created_at: string;
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
  year_built?: number;
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
}
