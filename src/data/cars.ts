/** Official Verdun WhatsApp number (Argentina). */
export const WHATSAPP_NUMBER = "5493795300020";

export const whatsappLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export type Car = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  version: string;
  year: number | null;
  km: number | null;
  transmission: string;
  fuel: string;
  body: string;
  drive: string;
  power: number | null;
  color: string;
  condition: string;
  category: string;
  categorySlug: string;
  categoryId: string;
  price: number | null;
  priceLabel: string;
  image: string;
  photos: string[];
  badge: string;
  description: string;
  tagline: string;
  features: string[];
  whatsappMsg: string;
  featured: boolean;
};

const img = (id: number, w = 1200, h = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

export const images = {
  hero: img(33345485, 1500, 1300),
  showroom: img(18108314, 1200, 1000),
  interior: img(36742939, 900, 700),
  lounge: img(15513826, 1200, 900),
};

/** Hero background videos (self-hosted, optimized loops). */
export const heroVideos = [
  "/videos/hero-2.mp4",
  "/videos/hero-3.mp4",
  "/videos/hero-1.mp4",
];

export const heroPoster = "/videos/hero-poster.jpg";

/** Used when a vehicle has no photo in Supabase Storage. */
export const FALLBACK_CAR_IMAGE = heroPoster;

const numberFormat = new Intl.NumberFormat("es-AR");

export const formatUSD = (value: number) => `USD ${numberFormat.format(Math.round(value))}`;

export const formatKm = (value: number | null | undefined) => {
  if (value == null) return "Consultar";
  return value === 0 ? "0 km" : `${numberFormat.format(value)} km`;
};

export const formatPrice = (value: number | null | undefined) =>
  value == null ? "Consultar precio" : formatUSD(value);
