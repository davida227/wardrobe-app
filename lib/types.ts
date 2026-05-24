export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  color: string;
  pattern: string;
  fabric: string;
  formality: string;
  seasons: string[];
  occasions: string[];      // user-selected occasions this item works for
  notes: string;
  image_url: string;
  thumbnail_url: string;
  needs_own_photo: boolean;
  purchase_date: string | null;   // ISO date string, e.g. "2024-03-15"
  purchase_price: number | null;  // in USD
  created_at: string;
}

export interface SavedOutfit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  occasion: string;
  styling_tips: string;
  item_ids: string[];
  created_at: string;
}

export interface HistoryEntry {
  id: string;
  user_id: string;
  date: string;
  item_ids: string[];
  outfit_name: string;
  occasion: string;
  event_name: string;
  notes: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  measurements: Record<string, string>;
  style_notes: string;
  preferred_model: string;
  updated_at: string;
}

export const CATEGORIES = [
  'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Dresses', 'Activewear', 'Formal'
] as const;

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter', 'All Season'] as const;
export const FORMALITY = ['Casual', 'Smart Casual', 'Business Casual', 'Business Formal', 'Formal'] as const;
export const OCCASIONS = ['Everyday', 'Work', 'Date Night', 'Weekend', 'Workout', 'Formal', 'Travel'] as const;

export const TIME_OF_DAY = [
  { label: 'Morning',   emoji: '🌅', description: 'Before noon' },
  { label: 'Afternoon', emoji: '☀️',  description: 'Noon to 5pm' },
  { label: 'Evening',   emoji: '🌙', description: 'After 5pm' },
] as const;

export const TEMPERATURES = [
  { label: 'Hot',   emoji: '🔥', description: '85°F+ (29°C+)' },
  { label: 'Warm',  emoji: '☀️',  description: '70–84°F (21–29°C)' },
  { label: 'Mild',  emoji: '🌤️',  description: '60–69°F (15–20°C)' },
  { label: 'Cool',  emoji: '🍂',  description: '50–59°F (10–14°C)' },
  { label: 'Cold',  emoji: '🧊',  description: 'Below 50°F (10°C)' },
] as const;


export const AI_MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude 4 Sonnet' },
  { id: 'claude-opus-4-20250514', label: 'Claude 4 Opus' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude 4.5 Haiku' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
] as const;
