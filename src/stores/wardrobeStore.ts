import { create } from 'zustand'
import type { WardrobeItem } from '../types'
import { db } from '../lib/database'

interface WardrobeState {
  items: WardrobeItem[]
  loading: boolean
  error: string | null
  fetch: (userId: string) => Promise<void>
  add: (item: Omit<WardrobeItem, 'id'>) => Promise<WardrobeItem>
  update: (id: string, updates: Partial<WardrobeItem>) => Promise<void>
  remove: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  incrementWorn: (id: string) => Promise<void>
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetch: async (userId) => {
    set({ loading: true, error: null })
    try {
      const items = await db.wardrobe.getAll(userId)
      set({ items, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  add: async (item) => {
    const newItem = await db.wardrobe.insert(item)
    set(s => ({ items: [newItem, ...s.items] }))
    return newItem
  },

  update: async (id, updates) => {
    await db.wardrobe.update(id, updates)
    set(s => ({ items: s.items.map(i => i.id === id ? { ...i, ...updates } : i) }))
  },

  remove: async (id) => {
    await db.wardrobe.delete(id)
    set(s => ({ items: s.items.filter(i => i.id !== id) }))
  },

  toggleFavorite: async (id) => {
    const item = get().items.find(i => i.id === id)
    if (!item) return
    await db.wardrobe.update(id, { isFavorite: !item.isFavorite })
    set(s => ({ items: s.items.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i) }))
  },

  incrementWorn: async (id) => {
    const item = get().items.find(i => i.id === id)
    if (!item) return
    const updates = { timesWorn: item.timesWorn + 1, lastWornDate: new Date().toISOString() }
    await db.wardrobe.update(id, updates)
    set(s => ({ items: s.items.map(i => i.id === id ? { ...i, ...updates } : i) }))
  },
}))
