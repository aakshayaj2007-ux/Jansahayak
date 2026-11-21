import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import LanguagePage from './pages/LanguagePage'
import Home from './pages/Home'
import Placeholder from './pages/Placeholder'
import Schemes from './pages/Schemes'
import SchemeDetail from './pages/SchemeDetail'
import Ask from './pages/Ask'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import { AuthProvider } from './auth/AuthContext'
import { getSavedLanguage } from './i18n'

function LanguageGate() {
  return getSavedLanguage() ? <Layout /> : <Navigate to="/language" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/language" element={<LanguagePage />} />
          <Route element={<LanguageGate />}>
            <Route path="/" element={<Home />} />
            <Route path="/schemes" element={<Schemes />} />
            <Route path="/schemes/:slug" element={<SchemeDetail />} />
            <Route path="/how-it-works" element={<Placeholder titleKey="nav.how" />} />
            <Route path="/about" element={<Placeholder titleKey="nav.about" />} />
            <Route path="/contact" element={<Placeholder titleKey="nav.contact" />} />
            <Route path="/privacy" element={<Placeholder titleKey="footer.privacy" />} />
            <Route path="/terms" element={<Placeholder titleKey="footer.terms" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<RequireAuth />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/ask" element={<Ask />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}