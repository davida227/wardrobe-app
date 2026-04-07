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
  notes: string;
  image_url: string;
  thumbnail_url: string;
  needs_own_photo: boolean;
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
  updated_at: string;
}

export const CATEGORIES = [
  'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Dresses', 'Activewear', 'Formal'
] as const;

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter', 'All Season'] as const;
export const FORMALITY = ['Casual', 'Smart Casual', 'Business Casual', 'Business Formal', 'Formal'] as const;
export const OCCASIONS = ['Everyday', 'Work', 'Date Night', 'Weekend', 'Workout', 'Formal', 'Travel'] as const;

export const AI_MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Sonnet 4' },
  { id: 'claude-opus-4-20250514', label: 'Opus 4' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
] as const;
