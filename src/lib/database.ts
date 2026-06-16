import { supabase } from './supabase'
import type { WardrobeItem, ScentItem, SavedOutfit, StyleProfile, UserPlan } from '../types'

function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    userId: 'user_id', imageUrl: 'image_url', thumbnailUrl: 'thumbnail_url',
    subCategory: 'sub_category', primaryColor: 'primary_color',
    secondaryColors: 'secondary_colors', styleTags: 'style_tags', bestFor: 'best_for',
    aiConfidence: 'ai_confidence', aiNotes: 'ai_notes', userNotes: 'user_notes',
    timesWorn: 'times_worn', lastWornDate: 'last_worn_date', isFavorite: 'is_favorite',
    purchasePrice: 'purchase_price', dateAdded: 'date_added',
    scentFamily: 'scent_family', aiTags: 'ai_tags',
    itemIds: 'item_ids', scentId: 'scent_id', aiExplanation: 'ai_explanation',
    scentExplanation: 'scent_explanation', dateCreated: 'date_created',
    preferredStyles: 'preferred_styles', preferredColors: 'preferred_colors',
    avoidColors: 'avoid_colors', preferredFit: 'preferred_fit',
    budgetMin: 'budget_min', budgetMax: 'budget_max',
    wardrobeItemsCount: 'wardrobe_items_count',
    aiAnalysesThisMonth: 'ai_analyses_this_month',
    outfitGenerationsThisMonth: 'outfit_generations_this_month',
  }
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [map[k] ?? k, v])
  )
}

function toCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    user_id: 'userId', image_url: 'imageUrl', thumbnail_url: 'thumbnailUrl',
    sub_category: 'subCategory', primary_color: 'primaryColor',
    secondary_colors: 'secondaryColors', style_tags: 'styleTags', best_for: 'bestFor',
    ai_confidence: 'aiConfidence', ai_notes: 'aiNotes', user_notes: 'userNotes',
    times_worn: 'timesWorn', last_worn_date: 'lastWornDate', is_favorite: 'isFavorite',
    purchase_price: 'purchasePrice', date_added: 'dateAdded',
    scent_family: 'scentFamily', ai_tags: 'aiTags',
    item_ids: 'itemIds', scent_id: 'scentId', ai_explanation: 'aiExplanation',
    scent_explanation: 'scentExplanation', date_created: 'dateCreated',
    preferred_styles: 'preferredStyles', preferred_colors: 'preferredColors',
    avoid_colors: 'avoidColors', preferred_fit: 'preferredFit',
    budget_min: 'budgetMin', budget_max: 'budgetMax',
    wardrobe_items_count: 'wardrobeItemsCount',
    ai_analyses_this_month: 'aiAnalysesThisMonth',
    outfit_generations_this_month: 'outfitGenerationsThisMonth',
  }
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [map[k] ?? k, v])
  )
}

export const db = {
  wardrobe: {
    async getAll(userId: string): Promise<WardrobeItem[]> {
      const { data, error } = await supabase.from('wardrobe_items').select('*').eq('user_id', userId).order('date_added', { ascending: false })
      if (error) throw error
      return (data ?? []).map(r => toCamel(r as Record<string, unknown>) as unknown as WardrobeItem)
    },
    async insert(item: Omit<WardrobeItem, 'id'>): Promise<WardrobeItem> {
      const { data, error } = await supabase.from('wardrobe_items').insert(toSnake(item as unknown as Record<string, unknown>)).select().single()
      if (error) throw error
      return toCamel(data as Record<string, unknown>) as unknown as WardrobeItem
    },
    async update(id: string, updates: Partial<WardrobeItem>): Promise<void> {
      const { error } = await supabase.from('wardrobe_items').update(toSnake(updates as Record<string, unknown>)).eq('id', id)
      if (error) throw error
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('wardrobe_items').delete().eq('id', id)
      if (error) throw error
    },
  },
  scents: {
    async getAll(userId: string): Promise<ScentItem[]> {
      const { data, error } = await supabase.from('scent_items').select('*').eq('user_id', userId).order('date_added', { ascending: false })
      if (error) throw error
      return (data ?? []).map(r => toCamel(r as Record<string, unknown>) as unknown as ScentItem)
    },
    async insert(item: Omit<ScentItem, 'id'>): Promise<ScentItem> {
      const { data, error } = await supabase.from('scent_items').insert(toSnake(item as unknown as Record<string, unknown>)).select().single()
      if (error) throw error
      return toCamel(data as Record<string, unknown>) as unknown as ScentItem
    },
    async update(id: string, updates: Partial<ScentItem>): Promise<void> {
      const { error } = await supabase.from('scent_items').update(toSnake(updates as Record<string, unknown>)).eq('id', id)
      if (error) throw error
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('scent_items').delete().eq('id', id)
      if (error) throw error
    },
  },
  outfits: {
    async getAll(userId: string): Promise<SavedOutfit[]> {
      const { data, error } = await supabase.from('saved_outfits').select('*').eq('user_id', userId).order('date_created', { ascending: false })
      if (error) throw error
      return (data ?? []).map(r => toCamel(r as Record<string, unknown>) as unknown as SavedOutfit)
    },
    async insert(outfit: Omit<SavedOutfit, 'id'>): Promise<SavedOutfit> {
      const { data, error } = await supabase.from('saved_outfits').insert(toSnake(outfit as unknown as Record<string, unknown>)).select().single()
      if (error) throw error
      return toCamel(data as Record<string, unknown>) as unknown as SavedOutfit
    },
    async update(id: string, updates: Partial<SavedOutfit>): Promise<void> {
      const { error } = await supabase.from('saved_outfits').update(toSnake(updates as Record<string, unknown>)).eq('id', id)
      if (error) throw error
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('saved_outfits').delete().eq('id', id)
      if (error) throw error
    },
  },
  styleProfile: {
    async get(userId: string): Promise<StyleProfile | null> {
      const { data } = await supabase.from('style_profiles').select('*').eq('user_id', userId).single()
      return data ? toCamel(data as Record<string, unknown>) as unknown as StyleProfile : null
    },
    async upsert(profile: StyleProfile): Promise<void> {
      const { error } = await supabase.from('style_profiles').upsert(toSnake(profile as unknown as Record<string, unknown>))
      if (error) throw error
    },
  },
  userPlan: {
    async get(userId: string): Promise<UserPlan | null> {
      const { data } = await supabase.from('user_plans').select('*').eq('user_id', userId).single()
      return data ? toCamel(data as Record<string, unknown>) as unknown as UserPlan : null
    },
    async create(userId: string): Promise<void> {
      const { error } = await supabase.from('user_plans').insert({ user_id: userId, plan: 'free', wardrobe_items_count: 0, ai_analyses_this_month: 0, outfit_generations_this_month: 0 })
      if (error && error.code !== '23505') throw error
    },
    async incrementAnalysis(userId: string): Promise<void> {
      await supabase.rpc('increment_ai_analyses', { uid: userId })
    },
  },
}
