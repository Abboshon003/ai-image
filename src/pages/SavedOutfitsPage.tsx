import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useWardrobeStore } from '../stores/wardrobeStore'
import { useScentStore } from '../stores/scentStore'
import { db } from '../lib/database'
import type { SavedOutfit, WardrobeItem, ScentItem } from '../types'
import { Sparkles, Wind, Star, Trash2, Check, Heart } from 'lucide-react'

function StarRating({ rating, onChange }: { rating: number | null; onChange: (r: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => onChange(s)}
          className="transition-colors">
          <Star className={`w-4 h-4 ${s <= (hover || rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
        </button>
      ))}
    </div>
  )
}

function OutfitCard({ outfit, wardrobeItems, scents, onDelete, onRate, onToggleFavorite, onMarkWorn }: {
  outfit: SavedOutfit
  wardrobeItems: WardrobeItem[]
  scents: ScentItem[]
  onDelete: (id: string) => void
  onRate: (id: string, r: number) => void
  onToggleFavorite: (id: string) => void
  onMarkWorn: (id: string) => void
}) {
  const [wornDone, setWornDone] = useState(false)
  const items = outfit.itemIds.map(id => wardrobeItems.find(i => i.id === id)).filter(Boolean)
  const scent = outfit.scentId ? scents.find(s => s.id === outfit.scentId) : null

  const handleWorn = () => {
    onMarkWorn(outfit.id)
    setWornDone(true)
    setTimeout(() => setWornDone(false), 2000)
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group">
      {/* Item thumbnails */}
      <div className="flex gap-1 p-3 pb-0">
        {items.slice(0, 4).map(item => item && (
          <div key={item.id} className="flex-1 aspect-square rounded-lg overflow-hidden bg-slate-800">
            {item.thumbnailUrl
              ? <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">?</div>}
          </div>
        ))}
        {items.length === 0 && (
          <div className="w-full h-24 flex items-center justify-center text-slate-600 text-xs">No items</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{outfit.name}</p>
            <p className="text-slate-500 text-xs capitalize">{outfit.occasion}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button onClick={() => onToggleFavorite(outfit.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors">
              <Heart className={`w-3.5 h-3.5 ${outfit.isFavorite ? 'text-rose-400 fill-rose-400' : 'text-slate-600'}`} />
            </button>
            <button onClick={() => onDelete(outfit.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {scent && (
          <div className="flex items-center gap-1.5 mb-2">
            <Wind className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-blue-400">{scent.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <StarRating rating={outfit.rating} onChange={r => onRate(outfit.id, r)} />
          <span className="text-xs text-slate-600">{outfit.timesWorn}x worn</span>
        </div>

        {outfit.aiExplanation && (
          <p className="text-slate-500 text-xs line-clamp-2 mb-3 leading-relaxed">{outfit.aiExplanation}</p>
        )}

        <button onClick={handleWorn}
          className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
            wornDone
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
          }`}>
          {wornDone ? <><Check className="w-3.5 h-3.5" /> Marked worn!</> : 'Mark as worn'}
        </button>
      </div>
    </div>
  )
}

export function SavedOutfitsPage() {
  const { user } = useAuthStore()
  const { items: wardrobeItems } = useWardrobeStore()
  const { items: scents } = useScentStore()
  const [outfits, setOutfits] = useState<SavedOutfit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    db.outfits.getAll(user.id).then(data => { setOutfits(data); setLoading(false) })
  }, [user])

  const handleDelete = async (id: string) => {
    await db.outfits.delete(id)
    setOutfits(prev => prev.filter(o => o.id !== id))
  }

  const handleRate = async (id: string, rating: number) => {
    await db.outfits.update(id, { rating })
    setOutfits(prev => prev.map(o => o.id === id ? { ...o, rating } : o))
  }

  const handleToggleFavorite = async (id: string) => {
    const outfit = outfits.find(o => o.id === id)
    if (!outfit) return
    await db.outfits.update(id, { isFavorite: !outfit.isFavorite })
    setOutfits(prev => prev.map(o => o.id === id ? { ...o, isFavorite: !o.isFavorite } : o))
  }

  const handleMarkWorn = async (id: string) => {
    const outfit = outfits.find(o => o.id === id)
    if (!outfit) return
    const updates = { timesWorn: outfit.timesWorn + 1, lastWornDate: new Date().toISOString() }
    await db.outfits.update(id, updates)
    setOutfits(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Outfits</h1>
          <p className="text-slate-400 text-sm mt-0.5">{outfits.length} outfit{outfits.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/outfit-generator"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Sparkles className="w-4 h-4" /> Generate new
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : outfits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-white font-medium mb-1">No saved outfits yet</p>
          <p className="text-slate-500 text-sm mb-5">Generate an AI outfit and save it here</p>
          <Link to="/outfit-generator"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            <Sparkles className="w-4 h-4" /> Generate first outfit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {outfits.map(outfit => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              wardrobeItems={wardrobeItems}
              scents={scents}
              onDelete={handleDelete}
              onRate={handleRate}
              onToggleFavorite={handleToggleFavorite}
              onMarkWorn={handleMarkWorn}
            />
          ))}
        </div>
      )}
    </div>
  )
}
