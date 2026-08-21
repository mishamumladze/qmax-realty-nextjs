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
