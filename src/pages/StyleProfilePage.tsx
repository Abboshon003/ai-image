import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { db } from '../lib/database'
import type { StyleProfile } from '../types'
import { Check, Loader2, User } from 'lucide-react'

const STYLE_OPTIONS = ['minimal', 'classic', 'streetwear', 'preppy', 'bohemian', 'athletic', 'formal', 'vintage', 'smart casual', 'business']
const COLOR_OPTIONS = ['black', 'white', 'navy', 'grey', 'beige', 'brown', 'olive', 'burgundy', 'camel', 'blue', 'green', 'red']
const FIT_OPTIONS = ['slim', 'regular', 'relaxed', 'oversized']

function MultiSelect({ label, options, values, onChange, color = 'violet' }: {
  label: string; options: string[]; values: string[]; onChange: (v: string[]) => void; color?: string
}) {
  const toggle = (opt: string) =>
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt])
  const activeClass = color === 'rose'
    ? 'bg-rose-600 border-rose-600 text-white'
    : 'bg-violet-600 border-violet-600 text-white'
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-3">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} onClick={() => toggle(opt)}
            className={`text-sm px-3 py-1.5 rounded-full border capitalize transition-colors ${
              values.includes(opt) ? activeClass : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
            }`}>{opt}</button>
        ))}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <h2 className="text-white font-semibold">{title}</h2>
      {children}
    </div>
  )
}

export function StyleProfilePage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [profile, setProfile] = useState<StyleProfile>({
    userId: user?.id ?? '',
    preferredStyles: [],
    preferredColors: [],
    avoidColors: [],
    preferredFit: 'regular',
    budgetMin: 0,
    budgetMax: 300,
    currency: 'USD',
    goals: '',
  })

  useEffect(() => {
    if (!user) return
    db.styleProfile.get(user.id).then(data => {
      if (data) setProfile(data)
      setLoading(false)
    })
  }, [user])

  const update = <K extends keyof StyleProfile>(key: K, value: StyleProfile[K]) =>
    setProfile(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSaved(false)
    try {
      await db.styleProfile.upsert({ ...profile, userId: user.id })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Style Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Tell AI your preferences for better outfit recommendations</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            saved
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              : 'bg-violet-600 hover:bg-violet-700 text-white'
          }`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save profile'}
        </button>
      </div>

      <div className="space-y-5">
        <Section title="Style preferences">
          <MultiSelect label="My style" options={STYLE_OPTIONS} values={profile.preferredStyles}
            onChange={v => update('preferredStyles', v)} />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Preferred fit</label>
            <div className="flex gap-3">
              {FIT_OPTIONS.map(f => (
                <button key={f} onClick={() => update('preferredFit', f)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm capitalize transition-colors ${
                    profile.preferredFit === f
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}>{f}</button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Color preferences">
          <MultiSelect label="Colors I love" options={COLOR_OPTIONS} values={profile.preferredColors}
            onChange={v => update('preferredColors', v)} />
          <MultiSelect label="Colors I avoid" options={COLOR_OPTIONS} values={profile.avoidColors}
            onChange={v => update('avoidColors', v)} color="rose" />
        </Section>

        <Section title="Budget">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300">Per-item budget range</label>
              <span className="text-violet-400 text-sm font-medium">${profile.budgetMin} – ${profile.budgetMax}</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 w-10">Min</span>
                <input type="range" min={0} max={profile.budgetMax} step={10}
                  value={profile.budgetMin}
                  onChange={e => update('budgetMin', parseInt(e.target.value))}
                  className="flex-1 accent-violet-600" />
                <span className="text-xs text-slate-400 w-12 text-right">${profile.budgetMin}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 w-10">Max</span>
                <input type="range" min={profile.budgetMin} max={2000} step={25}
                  value={profile.budgetMax}
                  onChange={e => update('budgetMax', parseInt(e.target.value))}
                  className="flex-1 accent-violet-600" />
                <span className="text-xs text-slate-400 w-12 text-right">${profile.budgetMax}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
            <select value={profile.currency} onChange={e => update('currency', e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors">
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </Section>

        <Section title="Style goals">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">What are you working towards?</label>
            <textarea value={profile.goals} onChange={e => update('goals', e.target.value)} rows={4}
              placeholder="e.g. I want to build a more professional wardrobe for my new job, with versatile pieces I can mix and match easily. I prefer clean, minimal looks over loud patterns."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none leading-relaxed" />
            <p className="text-slate-600 text-xs mt-1.5">This helps AI understand your overall direction when generating outfits and shopping advice.</p>
          </div>
        </Section>

        <div className="flex items-center gap-3 bg-violet-600/10 border border-violet-500/20 rounded-2xl px-5 py-4">
          <User className="w-5 h-5 text-violet-400 flex-shrink-0" />
          <p className="text-slate-300 text-sm">Your style profile is used by the Outfit Generator and Shopping Advisor to personalize every recommendation.</p>
        </div>

        <button onClick={handleSave} disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all ${
            saved
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              : 'bg-violet-600 hover:bg-violet-700 text-white'
          }`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save profile'}
        </button>
      </div>
    </div>
  )
}
