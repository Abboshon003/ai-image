import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { WardrobePage } from './pages/WardrobePage'
import { UploadPage } from './pages/UploadPage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { ScentsPage } from './pages/ScentsPage'
import { AddScentPage } from './pages/AddScentPage'
import { OutfitGeneratorPage } from './pages/OutfitGeneratorPage'
import { SavedOutfitsPage } from './pages/SavedOutfitsPage'
import { StyleProfilePage } from './pages/StyleProfilePage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  const { init } = useAuthStore()
  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter basename="/ai-image">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/wardrobe" element={<WardrobePage />} />
                <Route path="/wardrobe/upload" element={<UploadPage />} />
                <Route path="/wardrobe/:id" element={<ItemDetailPage />} />
                <Route path="/scents" element={<ScentsPage />} />
                <Route path="/scents/add" element={<AddScentPage />} />
                <Route path="/outfit-generator" element={<OutfitGeneratorPage />} />
                <Route path="/outfits" element={<SavedOutfitsPage />} />
                <Route path="/profile" element={<StyleProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
