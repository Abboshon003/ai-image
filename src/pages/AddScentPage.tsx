import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useScentStore } from '../stores/scentStore'
import { analyzeScentItem } from '../lib/gemini'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/imageUtils'
import type { ScentAnalysis } from '../types'
import { Upload, Sparkles, Check, X, AlertCircle, Loader2, Wind } from 'lucide-react'

const INTENSITY_OPTIONS = ['light', 'moderate', 'strong', 'intense'] as const
const SEASON_OPTIONS = ['spring', 'summer', 'fall', 'winter', 'all-season']
const OCCASION_OPTIONS = ['casual', 'office', 'evening', 'date', 'sport', 'formal']
const SCENT_FAMILIES = ['floral', 'woody', 'fresh', 'oriental', 'citrus', 'aquatic', 'gourmand', 'spicy', 'earthy']

type Step = 'form' | 'analyzing' | 'review' | 'saving'

function MultiSelect({ label, options, values, onChange }: {
  label: string; options: string[]; values: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) =>
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt])
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button key={opt} onClick={() => toggle(opt)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
              values.includes(opt)
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'border-slate-700 text-slate-400 hover:border-violet-500 hover:text-violet-300'
            }`}>{opt}</button>
        ))}
      </div>
    </div>
  )
}

export function AddScentPage() {
  const { user } = useAuthStore()
  const { add } = useScentStore()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [description, setDescription] = useState('')
  const [userNotes, setUserNotes] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [edited, setEdited] = useState<ScentAnalysis | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }, [])

  const runAnalysis = async () => {
    if (!name.trim() || !brand.trim()) { setError('Name and brand are required'); return }
    setError('')
    setStep('analyzing')
    try {
      const result = await analyzeScentItem(name, brand, description)
      setEdited({ ...result })
      setStep('review')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
      setStep('form')
    }
  }

  const handleSave = async () => {
    if (!edited || !user) return
    setStep('saving')
    try {
      let imageUrl: string | null = null
      if (imageFile) {
        const compressed = await compressImage(imageFile)
        const path = `${user.id}/scents/${Date.now()}.jpg`
        const { error: uploadErr } = await supabase.storage.from('wardrobe').upload(path, compressed, { contentType: 'image/jpeg', upsert: true })
        if (uploadErr) throw uploadErr
        imageUrl = supabase.storage.from('wardrobe').getPublicUrl(path).data.publicUrl
      }
      await add({
        userId: user.id,
        name: name.trim(),
        brand: brand.trim(),
        imageUrl,
        ...edited,
        userNotes,
        isFavorite: false,
        dateAdded: new Date().toISOString(),
      })
      navigate('/scents')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
      setStep('review')
    }
  }

  const update = (key: keyof ScentAnalysis, value: unknown) =>
    setEdited(prev => prev ? { ...prev, [key]: value } : prev)

  if (step === 'analyzing') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-6">
        <Wind className="w-8 h-8 text-blue-400 animate-pulse" />
      </div>
      <h2 className="text-white font-semibold text-lg mb-1">Analyzing scent profile</h2>
      <p className="text-slate-400 text-sm">AI is identifying notes, family, and occasion…</p>
    </div>
  )

  if (step === 'saving') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
      <h2 className="text-white font-semibold">Saving to your collection…</h2>
    </div>
  )

  if (step === 'review' && edited) return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Review scent analysis</h1>
        <p className="text-slate-400 text-sm mt-1">Edit anything before saving</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: image + user info */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {imagePreview
              ? <img src={imagePreview} alt={name} className="w-full object-cover max-h-56" />
              : (
                <div className="h-40 flex flex-col items-center justify-center gap-2 text-slate-600 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-6 h-6" />
                  <span className="text-xs">Add bottle photo (optional)</span>
                </div>
              )
            }
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Wind className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-white font-medium text-sm">{name}</p>
                <p className="text-slate-400 text-xs">by {brand}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Personal notes</label>
              <textarea value={userNotes} onChange={e => setUserNotes(e.target.value)} rows={3}
                placeholder="When you wear it, how it feels…"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
            </div>
          </div>
        </div>

        {/* Right: AI fields */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <h3 className="text-white text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" /> AI Scent Profile
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Scent family</label>
            <div className="flex flex-wrap gap-1.5">
              {SCENT_FAMILIES.map(f => (
                <button key={f} onClick={() => update('scentFamily', f)}
                  className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
                    edited.scentFamily === f
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-300'
                  }`}>{f}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Intensity</label>
            <div className="flex gap-2">
              {INTENSITY_OPTIONS.map(i => (
                <button key={i} onClick={() => update('intensity', i)}
                  className={`flex-1 text-xs py-2 rounded-lg border capitalize transition-colors ${
                    edited.intensity === i
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>{i}</button>
              ))}
            </div>
          </div>

          <MultiSelect label="Season" options={SEASON_OPTIONS} values={edited.season}
            onChange={v => update('season', v)} />

          <MultiSelect label="Best occasions" options={OCCASION_OPTIONS} values={edited.occasion}
            onChange={v => update('occasion', v)} />

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Scent notes</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {edited.notes.map(n => (
                <span key={n} className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs px-2 py-1 rounded-full">
                  {n} <button onClick={() => update('notes', edited.notes.filter(x => x !== n))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <input
              placeholder="Add note (e.g. bergamot) + Enter"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim().toLowerCase()
                  if (val && !edited.notes.includes(val)) update('notes', [...edited.notes, val]);
                  (e.target as HTMLInputElement).value = ''
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">AI tags</label>
            <div className="flex flex-wrap gap-1.5">
              {edited.aiTags.map(t => (
                <span key={t} className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full capitalize">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button onClick={() => setStep('form')}
          className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors">
          Back
        </button>
        <button onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl text-sm transition-colors">
          <Check className="w-4 h-4" /> Save scent
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Add a scent</h1>
        <p className="text-slate-400 text-sm">AI will analyze the fragrance profile and suggest outfit pairings</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        {/* Bottle photo */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-slate-700 hover:border-slate-600'
          }`}
        >
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Bottle" className="w-full h-40 object-contain rounded-xl" />
              <button onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                className="absolute top-2 right-2 w-7 h-7 bg-slate-900/80 rounded-full flex items-center justify-center text-slate-300 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Upload className="w-5 h-5 text-slate-500" />
              <p className="text-slate-500 text-sm">Add bottle photo <span className="text-slate-600">(optional)</span></p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Fragrance name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sauvage"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Brand *</label>
            <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Dior"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Description <span className="text-slate-600">(helps AI)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            placeholder="E.g. Fresh and spicy with bergamot opening, lavender heart, warm amber base…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button onClick={runAnalysis} disabled={!name.trim() || !brand.trim()}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl text-sm transition-colors">
          <Sparkles className="w-4 h-4" /> Analyze with AI
        </button>
      </div>
    </div>
  )
}
