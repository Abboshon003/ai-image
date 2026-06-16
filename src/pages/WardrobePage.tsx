import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useWardrobeStore } from '../stores/wardrobeStore'
import type { WardrobeItem } from '../types'
import { Plus, Search, Heart, SlidersHorizontal, Grid3X3, List, X } from 'lucide-react'

const CATEGORIES = ['all', 'tops', 'bottoms', 'outerwear', 'shoes', 'accessories', 'dresses', 'activewear']
const FORMALITY = ['casual', 'smart casual', 'business casual', 'business formal', 'black tie']
const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all-season']

function WardrobeCard({ item, view }: { item: WardrobeItem; view: 'grid' | 'list' }) {
  const formalityColor: Record<string, string> = {
    'casual': 'bg-emerald-500/20 text-emerald-400',
    'smart casual': 'bg-blue-500/20 text-blue-400',
    'business casual': 'bg-amber-500/20 text-amber-400',
    'business formal': 'bg-purple-500/20 text-purple-400',
    'black tie': 'bg-rose-500/20 text-rose-400',
  }

  if (view === 'list') return (
    <Link to={`/wardrobe/${item.id}`}
      className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all group">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
        {item.thumbnailUrl
          ? <img src={item.thumbnailUrl} alt={item.subCategory} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No img</div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-white font-medium text-sm capitalize truncate">{item.subCategory || item.category}</p>
          {item.isFavorite && <Heart className="w-3 h-3 text-rose-400 fill-rose-400 flex-shrink-0" />}
        </div>
        <p className="text-slate-500 text-xs capitalize mb-1">{item.primaryColor} · {item.pattern}</p>
        <div className="flex flex-wrap gap-1">
          {item.formality.slice(0, 2).map(f => (
            <span key={f} className={`text-xs px-2 py-0.5 rounded-full capitalize ${formalityColor[f] ?? 'bg-slate-700 text-slate-400'}`}>{f}</span>
          ))}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-slate-500 text-xs">{item.timesWorn}x worn</p>
        {item.brand && <p className="text-slate-600 text-xs mt-0.5">{item.brand}</p>}
      </div>
    </Link>
  )

  return (
    <Link to={`/wardrobe/${item.id}`}
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-black/20 transition-all group">
      <div className="relative aspect-[3/4] bg-slate-800">
        {item.thumbnailUrl
          ? <img src={item.thumbnailUrl} alt={item.subCategory} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">No image</div>}
        {item.isFavorite && (
          <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-slate-900/70 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-wrap gap-1">
            {item.styleTags.slice(0, 3).map(t => (
              <span key={t} className="text-xs bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full capitalize">{t}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="text-white text-sm font-medium capitalize leading-tight">{item.subCategory || item.category}</p>
        </div>
        <p className="text-slate-500 text-xs capitalize mb-2">{item.primaryColor} · {item.fit}</p>
        <div className="flex flex-wrap gap-1">
          {item.formality.slice(0, 1).map(f => (
            <span key={f} className={`text-xs px-2 py-0.5 rounded-full capitalize ${formalityColor[f] ?? 'bg-slate-700 text-slate-400'}`}>{f}</span>
          ))}
          {item.season.slice(0, 1).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 capitalize">{s}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export function WardrobePage() {
  const { user } = useAuthStore()
  const { items, loading, fetch } = useWardrobeStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [formality, setFormality] = useState<string[]>([])
  const [season, setSeason] = useState<string[]>([])
  const [favOnly, setFavOnly] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (user) fetch(user.id)
  }, [user, fetch])

  const filtered = items.filter(item => {
    if (search && !`${item.subCategory} ${item.category} ${item.primaryColor} ${item.brand}`.toLowerCase().includes(search.toLowerCase())) return false
    if (category !== 'all' && item.category !== category) return false
    if (formality.length && !formality.some(f => item.formality.includes(f))) return false
    if (season.length && !season.some(s => item.season.includes(s))) return false
    if (favOnly && !item.isFavorite) return false
    return true
  })

  const activeFilters = [
    category !== 'all' && category,
    ...formality,
    ...season,
    favOnly && 'favorites',
  ].filter(Boolean) as string[]

  const clearFilter = (f: string) => {
    if (f === 'favorites') { setFavOnly(false); return }
    if (CATEGORIES.includes(f)) { setCategory('all'); return }
    if (FORMALITY.includes(f)) { setFormality(prev => prev.filter(x => x !== f)); return }
    if (SEASONS.includes(f)) { setSeason(prev => prev.filter(x => x !== f)); return }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Wardrobe</h1>
          <p className="text-slate-400 text-sm mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/wardrobe/upload"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add item
        </Link>
      </div>

      {/* Search + controls */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, color, brand…"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors" />
        </div>
        <button onClick={() => setShowFilters(s => !s)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-800 text-slate-400 hover:text-white'}`}>
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilters.length > 0 && <span className="w-5 h-5 bg-violet-500 text-white text-xs rounded-full flex items-center justify-center">{activeFilters.length}</span>}
        </button>
        <div className="flex rounded-xl border border-slate-800 overflow-hidden">
          <button onClick={() => setView('grid')}
            className={`px-3 py-2.5 transition-colors ${view === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')}
            className={`px-3 py-2.5 transition-colors ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4 space-y-5">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
                    category === c ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Formality</p>
            <div className="flex flex-wrap gap-2">
              {FORMALITY.map(f => (
                <button key={f} onClick={() => setFormality(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                  className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
                    formality.includes(f) ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>{f}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Season</p>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map(s => (
                <button key={s} onClick={() => setSeason(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
                    season.includes(s) ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setFavOnly(s => !s)}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                favOnly ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}>
              <Heart className={`w-3 h-3 ${favOnly ? 'fill-rose-400' : ''}`} /> Favorites only
            </button>
            {activeFilters.length > 0 && (
              <button onClick={() => { setCategory('all'); setFormality([]); setSeason([]); setFavOnly(false) }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Clear all</button>
            )}
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters.length > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(f => (
            <span key={f} className="flex items-center gap-1.5 text-xs bg-violet-600/20 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-full capitalize">
              {f} <button onClick={() => clearFilter(f)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <Plus className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-white font-medium mb-1">{items.length === 0 ? 'Your wardrobe is empty' : 'No items match'}</p>
          <p className="text-slate-500 text-sm mb-4">{items.length === 0 ? 'Add your first item to get started' : 'Try adjusting your filters'}</p>
          {items.length === 0 && (
            <Link to="/wardrobe/upload" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Add clothing item
            </Link>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(item => <WardrobeCard key={item.id} item={item} view="grid" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => <WardrobeCard key={item.id} item={item} view="list" />)}
        </div>
      )}
    </div>
  )
}
