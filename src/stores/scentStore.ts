import { create } from 'zustand'
import type { ScentItem } from '../types'
import { db } from '../lib/database'

interface ScentState {
  items: ScentItem[]
  loading: boolean
  fetch: (userId: string) => Promise<void>
  add: (item: Omit<ScentItem, 'id'>) => Promise<ScentItem>
  update: (id: string, updates: Partial<ScentItem>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useScentStore = create<ScentState>((set) => ({
  items: [],
  loading: false,

  fetch: async (userId) => {
    set({ loading: true })
    const items = await db.scents.getAll(userId)
    set({ items, loading: false })
  },

  add: async (item) => {
    const newItem = await db.scents.insert(item)
    set(s => ({ items: [newItem, ...s.items] }))
    return newItem
  },

  update: async (id, updates) => {
    await db.scents.update(id, updates)
    set(s => ({ items: s.items.map(i => i.id === id ? { ...i, ...updates } : i) }))
  },

  remove: async (id) => {
    await db.scents.delete(id)
    set(s => ({ items: s.items.filter(i => i.id !== id) }))
  },
}))
