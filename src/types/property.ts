export interface Property {
  id: number;
  type?: string;
  // we will replace slug with id
  slug: string;
  title: string;
  location?: string;
  neighborhood?: string;
  city?: string;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqmt?: number;
  price?: number;
  sale_type?: string;
  country?: string;
  card_image?: string;
}