import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useWardrobeStore } from '../stores/wardrobeStore'
import { useScentStore } from '../stores/scentStore'
import { Plus, Shirt, Wind, Sparkles, Heart, ArrowRight, TrendingUp } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, to }: {
  label: string; value: number | string; icon: React.ElementType; color: string; to?: string
}) {
  const inner = (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {to && <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-slate-400 text-sm">{label}</p>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : <div>{inner}</div>
}

export function DashboardPage() {
  const { user } = useAuthStore()
  const { items, fetch: fetchWardrobe } = useWardrobeStore()
  const { items: scents, fetch: fetchScents } = useScentStore()

  useEffect(() => {
    if (user) { fetchWardrobe(user.id); fetchScents(user.id) }
  }, [user, fetchWardrobe, fetchScents])

  const favorites = items.filter(i => i.isFavorite).length
  const recentItems = [...items].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()).slice(0, 4)

  const categories = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1
    return acc
  }, {})

  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]

  const scoreFactors = [
    items.length >= 10,
    scents.length >= 1,
    items.some(i => i.formality.includes('business casual') || i.formality.includes('business formal')),
    items.some(i => i.formality.includes('casual')),
    items.some(i => i.season.includes('all-season') || i.season.includes('winter')),
  ]
  const score = Math.round((scoreFactors.filter(Boolean).length / scoreFactors.length) * 100)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's your wardrobe at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Clothing items" value={items.length} icon={Shirt} color="bg-violet-600/20 text-violet-400" to="/wardrobe" />
        <StatCard label="Scents" value={scents.length} icon={Wind} color="bg-blue-600/20 text-blue-400" to="/scents" />
        <StatCard label="Favorites" value={favorites} icon={Heart} color="bg-rose-600/20 text-rose-400" to="/wardrobe" />
        <StatCard label="Wardrobe score" value={`${score}%`} icon={TrendingUp} color="bg-emerald-600/20 text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Quick actions</h2>
          <div className="space-y-2">
            {[
              { to: '/wardrobe/upload', icon: Plus, label: 'Add clothing item', desc: 'Upload & AI-analyze' },
              { to: '/scents/add', icon: Wind, label: 'Add a scent', desc: 'Cologne or perfume' },
              { to: '/outfit-generator', icon: Sparkles, label: 'Generate outfit', desc: 'AI-powered styling' },
            ].map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Wardrobe health */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Wardrobe health</h2>
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Overall score</span>
              <span className="text-white font-bold">{score}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
                style={{ width: `${score}%` }} />
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { label: '10+ items', done: items.length >= 10 },
              { label: 'Has a scent', done: scents.length >= 1 },
              { label: 'Has smart/formal wear', done: items.some(i => i.formality.includes('business casual') || i.formality.includes('business formal')) },
              { label: 'Has casual wear', done: items.some(i => i.formality.includes('casual')) },
              { label: 'Has all-season pieces', done: items.some(i => i.season.includes('all-season') || i.season.includes('winter')) },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                  {done ? '✓' : '○'}
                </div>
                <span className={`text-sm ${done ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent additions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent additions</h2>
            {items.length > 0 && <Link to="/wardrobe" className="text-xs text-violet-400 hover:text-violet-300">See all</Link>}
          </div>
          {recentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-slate-500 text-sm mb-3">No items yet</p>
              <Link to="/wardrobe/upload" className="flex items-center gap-1.5 text-xs bg-violet-600/20 border border-violet-500/30 text-violet-400 px-3 py-2 rounded-lg hover:bg-violet-600/30 transition-colors">
                <Plus className="w-3 h-3" /> Add first item
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentItems.map(item => (
                <Link key={item.id} to={`/wardrobe/${item.id}`}
                  className="flex items-center gap-3 hover:bg-slate-800 p-2 -mx-2 rounded-xl transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                    {item.thumbnailUrl
                      ? <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">?</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm capitalize truncate">{item.subCategory || item.category}</p>
                    <p className="text-slate-500 text-xs capitalize">{item.primaryColor} · {item.formality[0]}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {topCategory && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">Most items: <span className="text-slate-300 capitalize">{topCategory[0]}</span> ({topCategory[1]})</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
