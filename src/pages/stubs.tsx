import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      {description && <p className="text-slate-400 text-sm max-w-sm">{description}</p>}
      <div className="mt-6 text-xs text-slate-600">Coming next build</div>
    </div>
  )
}

export function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Wardrobe Items', value: '—' },
          { label: 'Saved Outfits', value: '—' },
          { label: 'Scents', value: '—' },
          { label: 'Wardrobe Score', value: '—' },
        ].map(card => (
          <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">{card.label}</p>
            <p className="text-white text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center gap-4">
        <p className="text-slate-400 text-sm text-center">Start by adding your first clothing item</p>
        <Link to="/wardrobe/upload" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add clothing item
        </Link>
      </div>
    </div>
  )
}

export function WardrobePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Wardrobe</h1>
        <Link to="/wardrobe/upload" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add item
        </Link>
      </div>
      <ComingSoon title="" description="Your clothing items will appear here. Add your first item to get started." />
    </div>
  )
}

export function UploadPage() {
  return <ComingSoon title="Upload Clothing" description="AI-powered clothing analysis — photo upload and review flow coming next." />
}

export function ItemDetailPage() {
  return <ComingSoon title="Item Detail" description="Full item details, wear tracking, and outfit building." />
}

export function ScentsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Scents</h1>
        <Link to="/scents/add" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add scent
        </Link>
      </div>
      <ComingSoon title="" description="Your colognes and perfumes will appear here." />
    </div>
  )
}

export function AddScentPage() {
  return <ComingSoon title="Add Scent" description="Add a cologne or perfume — AI will analyze and tag it for outfit pairing." />
}

export function OutfitGeneratorPage() {
  return <ComingSoon title="Outfit Generator" description="Choose an occasion and AI will build outfits from your wardrobe and suggest a matching scent." />
}

export function SavedOutfitsPage() {
  return <ComingSoon title="Saved Outfits" description="Rate, wear, and manage your AI-generated outfits." />
}

export function StyleProfilePage() {
  return <ComingSoon title="Style Profile" description="Set your style goals, preferred colors, budget, and fit preferences." />
}

export function SettingsPage() {
  return <ComingSoon title="Settings" description="Manage your account, plan, and preferences." />
}
