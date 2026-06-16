import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useWardrobeStore } from '../stores/wardrobeStore'
import type { WardrobeItem } from '../types'
import {
  Heart, Trash2, Edit3, ChevronLeft, Sparkles, Calendar,
  Tag, Star, Check, X, AlertCircle
} from 'lucide-react'

const FORMALITY_COLOR: Record<string, string> = {
  'casual': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'smart casual': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'business casual': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'business formal': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'black tie': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800/60 rounded-xl px-4 py-3 text-center">
      <p className="text-white font-bold text-xl">{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  )
}

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, update, remove, toggleFavorite, incrementWorn } = useWardrobeStore()
  const [item, setItem] = useState<WardrobeItem | null>(null)
  const [editing, setEditing] = useState(false)
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [wornDone, setWornDone] = useState(false)

  useEffect(() => {
    const found = items.find(i => i.id === id) ?? null
    setItem(found)
    setEditNotes(found?.userNotes ?? '')
  }, [id, items])

  if (!item) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-slate-400 mb-4">Item not found</p>
      <Link to="/wardrobe" className="text-violet-400 hover:text-violet-300 text-sm">← Back to wardrobe</Link>
    </div>
  )

  const handleMarkWorn = async () => {
    await incrementWorn(item.id)
    setWornDone(true)
    setTimeout(() => setWornDone(false), 2000)
  }

  const handleSaveNotes = async () => {
    setSaving(true)
    await update(item.id, { userNotes: editNotes })
    setEditing(false)
    setSaving(false)
  }

  const handleDelete = async () => {
    await remove(item.id)
    navigate('/wardrobe')
  }

  const lastWorn = item.lastWornDate
    ? new Date(item.lastWornDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Never'

  const dateAdded = new Date(item.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const costPerWear = item.purchasePrice && item.timesWorn > 0
    ? `$${(item.purchasePrice / item.timesWorn).toFixed(2)}`
    : item.purchasePrice ? `$${item.purchasePrice}` : '—'

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/wardrobe" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Wardrobe
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => toggleFavorite(item.id)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
              item.isFavorite ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'border-slate-800 text-slate-500 hover:text-rose-400'
            }`}>
            <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-rose-400' : ''}`} />
          </button>
          <button onClick={() => setConfirmDelete(true)}
            className="w-9 h-9 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 hover:text-red-400 hover:border-red-500/40 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
            {item.imageUrl
              ? <img src={item.imageUrl} alt={item.subCategory} className="w-full object-cover max-h-96" />
              : <div className="h-64 flex items-center justify-center text-slate-600">No image</div>}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-full px-2.5 py-1">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="text-xs text-white">{Math.round(item.aiConfidence * 100)}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Times worn" value={item.timesWorn} />
            <StatCard label="Last worn" value={lastWorn} />
            <StatCard label="Cost/wear" value={costPerWear} />
          </div>

          <button onClick={handleMarkWorn}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              wornDone ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
            }`}>
            {wornDone ? <><Check className="w-4 h-4" /> Marked as worn!</> : <>Mark as worn today</>}
          </button>

          <Link to="/outfit-generator"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 text-sm font-medium transition-colors">
            <Sparkles className="w-4 h-4" /> Build outfits around this item
          </Link>
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{item.subCategory || item.category}</h1>
            <div className="flex items-center gap-2 mt-1">
              {item.brand && <span className="text-slate-400 text-sm">{item.brand}</span>}
              {item.brand && <span className="text-slate-700">·</span>}
              <span className="text-slate-400 text-sm capitalize">{item.condition.replace('-', ' ')}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Category</p>
              <p className="text-white text-sm capitalize">{item.category} › {item.subCategory}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Color & Pattern</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full capitalize">{item.primaryColor}</span>
                {item.secondaryColors.map(c => (
                  <span key={c} className="text-xs bg-slate-800/60 text-slate-400 px-2.5 py-1 rounded-full capitalize">{c}</span>
                ))}
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full capitalize">{item.pattern}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Formality</p>
              <div className="flex flex-wrap gap-1.5">
                {item.formality.map(f => (
                  <span key={f} className={`text-xs px-2.5 py-1 rounded-full border capitalize ${FORMALITY_COLOR[f] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>{f}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Season & Fit</p>
              <div className="flex flex-wrap gap-1.5">
                {item.season.map(s => (
                  <span key={s} className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full capitalize">{s}</span>
                ))}
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full capitalize">{item.fit}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Style tags</p>
              <div className="flex flex-wrap gap-1.5">
                {item.styleTags.map(t => (
                  <span key={t} className="text-xs bg-violet-600/15 border border-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full capitalize">{t}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Best for</p>
              <div className="flex flex-wrap gap-1.5">
                {item.bestFor.map(b => (
                  <span key={b} className="flex items-center gap-1 text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full capitalize">
                    <Tag className="w-2.5 h-2.5" />{b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI notes */}
          {item.aiNotes && (
            <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-400 mb-0.5">AI note</p>
                <p className="text-amber-300/80 text-xs">{item.aiNotes}</p>
              </div>
            </div>
          )}

          {/* User notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Personal notes</p>
              {!editing && (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400 transition-colors">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>
            {editing ? (
              <div className="space-y-2">
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                  <button onClick={handleSaveNotes} disabled={saving}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors">
                    <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">{item.userNotes || 'No notes yet'}</p>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Added {dateAdded}</span>
            {item.purchasePrice && <span className="flex items-center gap-1"><Star className="w-3 h-3" /> ${item.purchasePrice}</span>}
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-2">Delete this item?</h3>
            <p className="text-slate-400 text-sm mb-6">This will permanently remove the item from your wardrobe. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
