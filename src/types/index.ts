export interface WardrobeItem {
  id: string
  userId: string
  imageUrl: string
  thumbnailUrl: string
  category: string
  subCategory: string
  primaryColor: string
  secondaryColors: string[]
  pattern: string
  formality: string[]
  season: string[]
  fit: string
  styleTags: string[]
  bestFor: string[]
  aiConfidence: number
  aiNotes: string
  userNotes: string
  timesWorn: number
  lastWornDate: string | null
  isFavorite: boolean
  brand: string
  purchasePrice: number | null
  condition: 'excellent' | 'good' | 'worn' | 'needs-repair'
  dateAdded: string
}

export interface ScentItem {
  id: string
  userId: string
  name: string
  brand: string
  imageUrl: string | null
  scentFamily: string
  notes: string[]
  season: string[]
  occasion: string[]
  intensity: 'light' | 'moderate' | 'strong' | 'intense'
  aiTags: string[]
  userNotes: string
  isFavorite: boolean
  dateAdded: string
}

export interface SavedOutfit {
  id: string
  userId: string
  name: string
  itemIds: string[]
  scentId: string | null
  occasion: string
  aiExplanation: string
  scentExplanation: string | null
  rating: number | null
  timesWorn: number
  lastWornDate: string | null
  isFavorite: boolean
  dateCreated: string
  season: string[]
}

export interface StyleProfile {
  userId: string
  preferredStyles: string[]
  preferredColors: string[]
  avoidColors: string[]
  preferredFit: string
  budgetMin: number
  budgetMax: number
  currency: string
  goals: string
}

export interface UserPlan {
  userId: string
  plan: 'free' | 'paid'
  wardrobeItemsCount: number
  aiAnalysesThisMonth: number
  outfitGenerationsThisMonth: number
}

export type ClothingAnalysis = {
  category: string
  subCategory: string
  primaryColor: string
  secondaryColors: string[]
  pattern: string
  formality: string[]
  season: string[]
  fit: string
  styleTags: string[]
  bestFor: string[]
  aiConfidence: number
  aiNotes: string
}

export interface ScentAnalysis {
  scentFamily: string
  notes: string[]
  season: string[]
  occasion: string[]
  intensity: 'light' | 'moderate' | 'strong' | 'intense'
  aiTags: string[]
}

export interface OutfitSuggestion {
  outfitName: string
  itemIds: string[]
  scentId: string | null
  explanation: string
  scentExplanation: string | null
  whyItWorks: string[]
}
