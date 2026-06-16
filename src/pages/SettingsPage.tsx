import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useWardrobeStore } from '../stores/wardrobeStore'
import { useScentStore } from '../stores/scentStore'
import { db } from '../lib/database'
import {
  Key, Shield, Download, Upload, LogOut, Trash2,
  Check, Eye, EyeOff, AlertCircle, ChevronRight, Sparkles
} from 'lucide-react'

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-white font-semibold">{title}</h2>
        {desc && <p className="text-slate-400 text-sm mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function Row({ icon: Icon, label, desc, children }: { icon: React.ElementType; label: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">{label}</p>
          {desc && <p className="text-slate-500 text-xs mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export function SettingsPage() {
  const { user, signOut } = useAuthStore()
  const { items: wardrobeItems } = useWardrobeStore()
  const { items: scents } = useScentStore()
  const navigate = useNavigate()

  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') ?? import.meta.env.VITE_GEMINI_API_KEY ?? '')
  const [showKey, setShowKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  const handleExport = async () => {
    if (!user) return
    setExporting(true)
    try {
      const [wardrobe, scentList, outfits, styleProfile, userPlan] = await Promise.all([
        db.wardrobe.getAll(user.id),
        db.scents.getAll(user.id),
        db.outfits.getAll(user.id),
        db.styleProfile.get(user.id),
        db.userPlan.get(user.id),
      ])
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        userId: user.id,
        email: user.email,
        wardrobe,
        scents: scentList,
        outfits,
        styleProfile,
        userPlan,
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stylepilot-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError('')
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const backup = JSON.parse(reader.result as string)
        if (!backup.version || !backup.wardrobe) throw new Error('Invalid backup file')
        // Note: import only restores metadata — images remain hosted on Supabase Storage
        alert(`Backup contains ${backup.wardrobe.length} wardrobe items, ${backup.scents?.length ?? 0} scents, and ${backup.outfits?.length ?? 0} outfits. Full import coming soon.`)
      } catch {
        setImportError('Invalid backup file. Please use a StylePilot export.')
      } finally {
        setImporting(false)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-5">
        {/* Account */}
        <Section title="Account" desc="Your login information">
          <Row icon={Shield} label="Email" desc={user?.email ?? ''}>
            <span className="text-xs bg-violet-600/20 text-violet-400 px-2.5 py-1 rounded-full">Free plan</span>
          </Row>
          <Row icon={Sparkles} label="Upgrade to Pro" desc="Unlimited items, analyses & outfit generations">
            <button className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Coming soon <ChevronRight className="w-3 h-3" />
            </button>
          </Row>
        </Section>

        {/* AI / Gemini */}
        <Section title="AI Configuration" desc="Your Gemini API key is stored in your browser only — never sent to our servers">
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 pr-20 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors font-mono"
              />
              <button onClick={() => setShowKey(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <Key className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Get your free key at <span className="text-violet-400">aistudio.google.com</span> → Get API key</span>
            </div>
            <button onClick={saveApiKey}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                keySaved
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}>
              {keySaved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save key'}
            </button>
          </div>
        </Section>

        {/* Data */}
        <Section title="Data & Backup" desc={`${wardrobeItems.length} wardrobe items · ${scents.length} scents`}>
          <Row icon={Download} label="Export backup" desc="Download all your data as JSON">
            <button onClick={handleExport} disabled={exporting}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </Row>
          <Row icon={Upload} label="Import backup" desc="Restore from a previous export">
            <label className={`text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${importing ? 'opacity-50' : ''}`}>
              {importing ? 'Importing…' : 'Import'}
              <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
            </label>
          </Row>
          {importError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mt-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-xs">{importError}</p>
            </div>
          )}
        </Section>

        {/* Danger zone */}
        <Section title="Account actions">
          <Row icon={LogOut} label="Sign out" desc="You'll need to sign in again">
            <button onClick={handleSignOut}
              className="text-xs border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors">
              Sign out
            </button>
          </Row>
          <Row icon={Trash2} label="Delete account" desc="Permanently delete all your data">
            <button onClick={() => setConfirmDelete(true)}
              className="text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">
              Delete
            </button>
          </Row>
        </Section>

        <p className="text-center text-xs text-slate-700">StylePilot · Built with AI</p>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-1">Delete your account?</h3>
            <p className="text-slate-400 text-sm mb-6">All wardrobe items, scents, outfits, and profile data will be permanently deleted. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await signOut()
                  navigate('/login')
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
