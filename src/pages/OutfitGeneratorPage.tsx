import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useWardrobeStore } from '../stores/wardrobeStore'
import { useScentStore } from '../stores/scentStore'
import { generateOutfit } from '../lib/gemini'
import { db } from '../lib/database'
import type { OutfitSuggestion } from '../types'
import { Sparkles, Wind, Check, Save, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react'

const OCCASIONS = [
  { label: 'Casual', emoji: '👕', value: 'casual' },
  { label: 'Smart Casual', emoji: '🧥', value: 'smart casual' },
  { label: 'Business Casual', emoji: '👔', value: 'business casual' },
  { label: 'Formal', emoji: '🤵', value: 'formal' },
  { label: 'Date Night', emoji: '🌙', value: 'date night' },
  { label: 'Gym', emoji: '🏋️', value: 'gym' },
  { label: 'Summer Day', emoji: '☀️', value: 'summer day' },
  { label: 'Job Interview', emoji: '💼', value: 'job interview' },
  { label: 'Wedding/Event', emoji: '💍', value: 'wedding or formal event' },
]

type GenStep = 'pick' | 'generating' | 'result'

export function OutfitGeneratorPage() {
  const { user } = useAuthStore()
  const { items, fetch: fetchWardrobe } = useWardrobeStore()
  const { items: scents, fetch: fetchScents } = useScentStore()

  const [step, setStep] = useState<GenStep>('pick')
  const [occasion, setOccasion] = useState('')
  const [customOccasion, setCustomOccasion] = useState('')
  const [result, setResult] = useState<OutfitSuggestion | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) { fetchWardrobe(user.id); fetchScents(user.id) }
  }, [user, fetchWardrobe, fetchScents])

  const finalOccasion = occasion === 'custom' ? customOccasion : occasion

  const outfitItems = result
    ? result.itemIds.map(id => items.find(i => i.id === id)).filter(Boolean)
    : []
  const outfitScent = result?.scentId ? scents.find(s => s.id === result.scentId) : null

  const generate = async () => {
    if (!finalOccasion.trim() || items.length === 0) return
    setStep('generating')
    setError('')
    setSaved(false)
    try {
      const styleProfile = user ? await db.styleProfile.get(user.id) : null
      const suggestion = await generateOutfit(
        items.map(i => ({ id: i.id, category: i.category, subCategory: i.subCategory, primaryColor: i.primaryColor, formality: i.formality, season: i.season, styleTags: i.styleTags })),
        finalOccasion,
        styleProfile,
        scents.map(s => ({ id: s.id, name: s.name, brand: s.brand, scentFamily: s.scentFamily, occasion: s.occasion, season: s.season }))
      )
      setResult(suggestion)
      setStep('result')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed. Check your API key.')
      setStep('pick')
    }
  }

  const saveOutfit = async () => {
    if (!result || !user) return
    setSaving(true)
    try {
      await db.outfits.insert({
        userId: user.id,
        name: result.outfitName,
        itemIds: result.itemIds,
        scentId: result.scentId,
        occasion: finalOccasion,
        aiExplanation: result.explanation,
        scentExplanation: result.scentExplanation,
        rating: null,
        timesWorn: 0,
        lastWornDate: null,
        isFavorite: false,
        dateCreated: new Date().toISOString(),
        season: [],
      })
      setSaved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (step === 'generating') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-violet-600/20 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-violet-400 animate-pulse" />
        </div>
      </div>
      <h2 className="text-white font-semibold text-lg mb-1">Building your outfit</h2>
      <p className="text-slate-400 text-sm text-center max-w-xs">AI is selecting the best pieces from your wardrobe for <span className="text-violet-300 capitalize">{finalOccasion}</span>…</p>
    </div>
  )

  if (step === 'result' && result) return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-slate-400 text-sm capitalize mb-0.5">{finalOccasion}</p>
          <h1 className="text-2xl font-bold text-white">{result.outfitName}</h1>
        </div>
        <button onClick={() => { setStep('pick'); setResult(null) }}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-800 px-3 py-2 rounded-xl transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
        </button>
      </div>

      {/* Outfit items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {outfitItems.map(item => item && (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="aspect-square bg-slate-800">
              {item.thumbnailUrl
                ? <img src={item.thumbnailUrl} alt={item.subCategory} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No img</div>}
            </div>
            <div className="p-2.5">
              <p className="text-white text-xs font-medium capitalize truncate">{item.subCategory || item.category}</p>
              <p className="text-slate-500 text-xs capitalize">{item.primaryColor}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Scent recommendation */}
      {outfitScent && (
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Scent pairing</span>
          </div>
          <p className="text-white font-medium text-sm mb-0.5">{outfitScent.name} <span className="text-slate-400 font-normal">by {outfitScent.brand}</span></p>
          {result.scentExplanation && <p className="text-slate-400 text-xs mt-1">{result.scentExplanation}</p>}
        </div>
      )}

      {/* Explanation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5">
        <h3 className="text-white text-sm font-medium flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-400" /> Why this works
        </h3>
        <p className="text-slate-300 text-sm mb-4 leading-relaxed">{result.explanation}</p>
        <ul className="space-y-2">
          {result.whyItWorks.map((reason, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
              <div className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</div>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button onClick={saveOutfit} disabled={saved || saving}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
          saved
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
            : 'bg-violet-600 hover:bg-violet-700 text-white'
        }`}>
        {saved ? <><Check className="w-4 h-4" /> Saved to outfits</> : saving ? 'Saving…' : <><Save className="w-4 h-4" /> Save outfit</>}
      </button>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Outfit Generator</h1>
        <p className="text-slate-400 text-sm">Choose an occasion and AI will build the perfect outfit from your wardrobe</p>
      </div>

      {items.length === 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-amber-300 text-sm">Add some clothing items to your wardrobe first before generating outfits.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        {OCCASIONS.map(o => (
          <button key={o.value} onClick={() => setOccasion(o.value)}
            className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border text-center transition-all ${
              occasion === o.value
                ? 'bg-violet-600/20 border-violet-500 text-white'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}>
            <span className="text-2xl">{o.emoji}</span>
            <span className="text-xs font-medium leading-tight">{o.label}</span>
          </button>
        ))}
        <button onClick={() => setOccasion('custom')}
          className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border text-center transition-all ${
            occasion === 'custom'
              ? 'bg-violet-600/20 border-violet-500 text-white'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white'
          }`}>
          <span className="text-2xl">✏️</span>
          <span className="text-xs font-medium">Custom</span>
        </button>
      </div>

      {occasion === 'custom' && (
        <div className="mb-6">
          <input value={customOccasion} onChange={e => setCustomOccasion(e.target.value)}
            placeholder="Describe the occasion (e.g. rooftop party, beach wedding…)"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={generate}
        disabled={!finalOccasion.trim() || items.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl text-sm transition-colors">
        <Sparkles className="w-4 h-4" />
        Generate outfit
        <ChevronRight className="w-4 h-4" />
      </button>

      <p className="text-center text-xs text-slate-600 mt-3">
        {items.length} item{items.length !== 1 ? 's' : ''} · {scents.length} scent{scents.length !== 1 ? 's' : ''} available
      </p>
    </div>
  )
}
