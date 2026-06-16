import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useWardrobeStore } from '../stores/wardrobeStore'
import { analyzeClothingImage } from '../lib/gemini'
import { compressImage, createThumbnail, blobToBase64 } from '../lib/imageUtils'
import { supabase } from '../lib/supabase'
import type { ClothingAnalysis } from '../types'
import { Upload, X, Sparkles, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react'

type Step = 'upload' | 'analyzing' | 'review' | 'saving'

const FORMALITY_OPTIONS = ['casual', 'smart casual', 'business casual', 'business formal', 'black tie']
const SEASON_OPTIONS = ['spring', 'summer', 'fall', 'winter', 'all-season']
const PATTERN_OPTIONS = ['solid', 'striped', 'plaid', 'floral', 'graphic', 'textured', 'other']
const CONDITION_OPTIONS = ['excellent', 'good', 'worn', 'needs-repair'] as const

function TagInput({ label, values, onChange, suggestions }: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  suggestions?: string[]
}) {
  const [input, setInput] = useState('')

  const add = (val: string) => {
    const trimmed = val.trim().toLowerCase()
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed])
    setInput('')
  }

  const remove = (val: string) => onChange(values.filter(v => v !== val))

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs px-2 py-1 rounded-full">
            {v}
            <button onClick={() => remove(v)} className="hover:text-white"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      {suggestions && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestions.filter(s => !values.includes(s)).map(s => (
            <button key={s} onClick={() => add(s)}
              className="text-xs px-2 py-1 rounded-full border border-slate-700 text-slate-400 hover:border-violet-500 hover:text-violet-300 transition-colors">
              + {s}
            </button>
          ))}
        </div>
      )}
      <input value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) } }}
        placeholder="Type and press Enter"
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
      />
    </div>
  )
}

function MultiSelect({ label, options, values, onChange }: {
  label: string
  options: string[]
  values: string[]
  onChange: (v: string[]) => void
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
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export function UploadPage() {
  const { user } = useAuthStore()
  const { add } = useWardrobeStore()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<ClothingAnalysis | null>(null)
  const [edited, setEdited] = useState<ClothingAnalysis | null>(null)
  const [userNotes, setUserNotes] = useState('')
  const [brand, setBrand] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [condition, setCondition] = useState<'excellent' | 'good' | 'worn' | 'needs-repair'>('excellent')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setError('Please upload an image file'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const runAnalysis = async () => {
    if (!file) return
    setStep('analyzing')
    setError('')
    try {
      const compressed = await compressImage(file)
      const base64 = await blobToBase64(compressed)
      const result = await analyzeClothingImage(base64)
      setAnalysis(result)
      setEdited({ ...result })
      setStep('review')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Check your API key.')
      setStep('upload')
    }
  }

  const handleSave = async () => {
    if (!edited || !file || !user) return
    setStep('saving')
    try {
      const [fullBlob, thumbBlob] = await Promise.all([compressImage(file), createThumbnail(file)])

      const timestamp = Date.now()
      const ext = 'jpg'
      const fullPath = `${user.id}/${timestamp}.${ext}`
      const thumbPath = `${user.id}/${timestamp}_thumb.${ext}`

      const [fullUpload, thumbUpload] = await Promise.all([
        supabase.storage.from('wardrobe').upload(fullPath, fullBlob, { contentType: 'image/jpeg', upsert: true }),
        supabase.storage.from('wardrobe').upload(thumbPath, thumbBlob, { contentType: 'image/jpeg', upsert: true }),
      ])

      if (fullUpload.error) throw fullUpload.error
      if (thumbUpload.error) throw thumbUpload.error

      const { data: { publicUrl: imageUrl } } = supabase.storage.from('wardrobe').getPublicUrl(fullPath)
      const { data: { publicUrl: thumbnailUrl } } = supabase.storage.from('wardrobe').getPublicUrl(thumbPath)

      await add({
        userId: user.id,
        imageUrl,
        thumbnailUrl,
        ...edited,
        brand,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        condition,
        userNotes,
        timesWorn: 0,
        lastWornDate: null,
        isFavorite: false,
        dateAdded: new Date().toISOString(),
      })

      navigate('/wardrobe')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save item')
      setStep('review')
    }
  }

  const update = (key: keyof ClothingAnalysis, value: unknown) => {
    setEdited(prev => prev ? { ...prev, [key]: value } : prev)
  }

  if (step === 'upload') return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Add clothing item</h1>
        <p className="text-slate-400 text-sm">Upload a photo and AI will analyze it automatically</p>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer group ${
          dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-slate-700 hover:border-slate-600'
        } ${preview ? 'border-solid border-slate-700' : ''}`}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full max-h-80 object-contain rounded-2xl" />
            <button
              onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }}
              className="absolute top-3 right-3 w-8 h-8 bg-slate-900/80 hover:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
              <span className="text-white text-sm font-medium">Click to change photo</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-white font-medium mb-1">Drop your photo here</p>
            <p className="text-slate-500 text-sm">or click to browse — JPG, PNG, WEBP</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={runAnalysis} disabled={!file}
        className="mt-6 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl text-sm transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Analyze with AI
      </button>
    </div>
  )

  if (step === 'analyzing') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="relative mb-6">
        {preview && <img src={preview} alt="" className="w-48 h-48 object-cover rounded-2xl opacity-40" />}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <h2 className="text-white font-semibold text-lg mb-1">Analyzing your item</h2>
      <p className="text-slate-400 text-sm">AI is identifying category, colors, fit, and more…</p>
    </div>
  )

  if (step === 'saving') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
      <h2 className="text-white font-semibold">Saving to your wardrobe…</h2>
    </div>
  )

  if (step === 'review' && edited) return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          <span>Upload</span>
          <ChevronRight className="w-3 h-3" />
          <span>AI Analysis</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-violet-400 font-medium">Review & Save</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Review AI results</h1>
        <p className="text-slate-400 text-sm mt-1">Check and edit anything before saving</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image + confidence */}
        <div className="space-y-4">
          {preview && (
            <div className="relative">
              <img src={preview} alt="Item" className="w-full rounded-2xl object-cover max-h-72" />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-full px-3 py-1.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span className="text-xs text-white font-medium">{Math.round((analysis?.aiConfidence ?? 0) * 100)}% confident</span>
              </div>
            </div>
          )}

          {analysis?.aiNotes && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300 text-xs">{analysis.aiNotes}</p>
            </div>
          )}

          {/* User fields */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-white text-sm font-medium">Your details</h3>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Brand</label>
              <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Zara, H&M, Uniqlo"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Purchase price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0.00" type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Condition</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITION_OPTIONS.map(c => (
                  <button key={c} onClick={() => setCondition(c)}
                    className={`text-xs py-2 px-3 rounded-lg border transition-colors capitalize ${
                      condition === c ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>
                    {c.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Personal notes</label>
              <textarea value={userNotes} onChange={e => setUserNotes(e.target.value)} rows={3} placeholder="Anything you want to remember about this item…"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
            </div>
          </div>
        </div>

        {/* AI fields — editable */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <h3 className="text-white text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" /> AI Analysis
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Category</label>
              <input value={edited.category} onChange={e => update('category', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors capitalize" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Sub-category</label>
              <input value={edited.subCategory} onChange={e => update('subCategory', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Primary color</label>
              <input value={edited.primaryColor} onChange={e => update('primaryColor', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Fit</label>
              <input value={edited.fit} onChange={e => update('fit', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Pattern</label>
            <div className="flex flex-wrap gap-1.5">
              {PATTERN_OPTIONS.map(p => (
                <button key={p} onClick={() => update('pattern', p)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                    edited.pattern === p ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>{p}</button>
              ))}
            </div>
          </div>

          <MultiSelect label="Formality" options={FORMALITY_OPTIONS} values={edited.formality}
            onChange={v => update('formality', v)} />

          <MultiSelect label="Season" options={SEASON_OPTIONS} values={edited.season}
            onChange={v => update('season', v)} />

          <TagInput label="Style tags" values={edited.styleTags}
            onChange={v => update('styleTags', v)}
            suggestions={['clean', 'classic', 'minimal', 'bold', 'streetwear', 'preppy', 'relaxed', 'tailored']} />

          <TagInput label="Best for" values={edited.bestFor}
            onChange={v => update('bestFor', v)}
            suggestions={['office', 'weekend', 'date night', 'gym', 'travel', 'formal event']} />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button onClick={() => { setStep('upload'); setAnalysis(null); setEdited(null) }}
          className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium transition-colors">
          Start over
        </button>
        <button onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl text-sm transition-colors">
          <Check className="w-4 h-4" /> Save to wardrobe
        </button>
      </div>
    </div>
  )

  return null
}
