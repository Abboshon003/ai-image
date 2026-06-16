import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useScentStore } from '../stores/scentStore'
import type { ScentItem } from '../types'
import { Plus, Wind, Heart, Trash2 } from 'lucide-react'

const FAMILY_COLOR: Record<string, string> = {
  floral: 'bg-pink-500/20 text-pink-400',
  woody: 'bg-amber-600/20 text-amber-500',
  fresh: 'bg-emerald-500/20 text-emerald-400',
  oriental: 'bg-orange-500/20 text-orange-400',
  citrus: 'bg-yellow-500/20 text-yellow-400',
  aquatic: 'bg-blue-500/20 text-blue-400',
  gourmand: 'bg-rose-500/20 text-rose-400',
  spicy: 'bg-red-500/20 text-red-400',
  earthy: 'bg-stone-500/20 text-stone-400',
}

const INTENSITY_DOTS: Record<string, number> = { light: 1, moderate: 2, strong: 3, intense: 4 }

function ScentCard({ item, onDelete }: { item: ScentItem; onDelete: (id: string) => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group">
      <div className="relative h-40 bg-slate-800">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Wind className="w-10 h-10 text-slate-600" />
            </div>
          )
        }
        {item.isFavorite && (
          <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-slate-900/70 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          </div>
        )}
        <div className={`absolute top-2.5 left-2.5 text-xs px-2.5 py-1 rounded-full capitalize ${FAMILY_COLOR[item.scentFamily] ?? 'bg-slate-700 text-slate-400'}`}>
          {item.scentFamily}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-white font-medium text-sm">{item.name}</p>
            <p className="text-slate-500 text-xs">by {item.brand}</p>
          </div>
          <button onClick={() => onDelete(item.id)}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-2 mb-3">
          <span className="text-xs text-slate-500 capitalize">{item.intensity}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4].map(d => (
              <div key={d} className={`w-1.5 h-1.5 rounded-full ${d <= (INTENSITY_DOTS[item.intensity] ?? 0) ? 'bg-violet-500' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {item.notes.slice(0, 3).map(n => (
            <span key={n} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full capitalize">{n}</span>
          ))}
          {item.notes.length > 3 && <span className="text-xs text-slate-600">+{item.notes.length - 3}</span>}
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {item.occasion.slice(0, 2).map(o => (
            <span key={o} className="text-xs bg-violet-600/15 text-violet-400 px-2 py-0.5 rounded-full capitalize">{o}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ScentsPage() {
  const { user } = useAuthStore()
  const { items, loading, fetch, remove } = useScentStore()

  useEffect(() => {
    if (user) fetch(user.id)
  }, [user, fetch])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Scents</h1>
          <p className="text-slate-400 text-sm mt-0.5">{items.length} fragrance{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/scents/add"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add scent
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <Wind className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-white font-medium mb-1">No scents yet</p>
          <p className="text-slate-500 text-sm mb-5">Add your colognes and perfumes to get outfit scent pairings</p>
          <Link to="/scents/add"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add first scent
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map(item => <ScentCard key={item.id} item={item} onDelete={remove} />)}
        </div>
      )}
    </div>
  )
}
