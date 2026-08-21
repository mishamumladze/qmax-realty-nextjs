export interface Property {
  id: number;
  title: string;
  type?: string;
  subtitle?: string;
  location?: string;
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
  parking?: boolean;
  meta_description?: string;
  description?: string;
  inclusions?: string[];
  gallery?: string[];
  floor_plan?: string;
  coords?: [number, number];
  card_image?: string;
}
