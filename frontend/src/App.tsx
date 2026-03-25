import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Eager imports (always-on pages) ──────────────────────────────────────────
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// ── Lazy imports (loaded on demand) ──────────────────────────────────────────
const Transactions  = lazy(() => import('./pages/Transactions'));
const Obligations   = lazy(() => import('./pages/Obligations'));
const Reconciliation = lazy(() => import('./pages/Reconciliation'));
const Simulation    = lazy(() => import('./pages/Simulation'));
const AIAssistant   = lazy(() => import('./pages/AIAssistant'));
const AIInsightsPage = lazy(() => import('./pages/AIInsights'));
const Upload        = lazy(() => import('./pages/Upload'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings      = lazy(() => import('./pages/Settings'));
const Profile       = lazy(() => import('./pages/Profile'));
const Upgrade       = lazy(() => import('./pages/Upgrade'));
const AddTransaction = lazy(() => import('./pages/AddTransaction'));
const MockBank      = lazy(() => import('./pages/MockBank'));
const GoalSetting   = lazy(() => import('./pages/GoalSetting'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#0B0F1A] text-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={<PageFallback />}>
                  <Routes location={location}>
                    <Route path="/"                index element={<Dashboard />} />
                    <Route path="/transactions"    element={<Transactions />} />
                    <Route path="/obligations"     element={<Obligations />} />
                    <Route path="/reconciliation"  element={<Reconciliation />} />
                    <Route path="/simulation"      element={<Simulation />} />
                    <Route path="/assistant"       element={<AIAssistant />} />
                    <Route path="/ai-insights"     element={<AIInsightsPage />} />
                    <Route path="/upload"          element={<Upload />} />
                    <Route path="/notifications"   element={<Notifications />} />
                    <Route path="/settings"        element={<Settings />} />
                    <Route path="/profile"         element={<Profile />} />
                    <Route path="/upgrade"         element={<Upgrade />} />
                    <Route path="/add-transaction" element={<AddTransaction />} />
                    <Route path="/mock-bank"       element={<MockBank />} />
                    <Route path="/goal-setting"    element={<GoalSetting />} />
                    <Route path="*"                element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Persistent financial disclaimer — shown on all authenticated pages */}
        <div className="px-8 py-2 bg-gray-950/80 border-t border-gray-800/60 text-center shrink-0">
          <p className="text-[9px] text-gray-600 leading-relaxed">
            CaliComp provides financial modelling tools for informational purposes only. Always consult a qualified financial advisor before making financial decisions. CaliComp does not provide regulated financial advice.
          </p>
        </div>

        <footer className="px-8 py-4 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-6">
            <span>© 2026 CaliComp Intelligence</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>Bank Feeds: Connected</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/settings')} className="hover:text-gray-300 transition-colors">Privacy Policy</button>
            <button onClick={() => navigate('/settings')} className="hover:text-gray-300 transition-colors">Terms of Service</button>
            <button onClick={() => navigate('/settings')} className="hover:text-gray-300 transition-colors">Support</button>
          </div>
        </footer>
      </div>

      {/* Floating AI button — hidden on assistant page */}
      {location.pathname !== '/assistant' && (
        <button
          onClick={() => navigate('/assistant')}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/50 hover:scale-110 active:scale-95 transition-all z-50 group"
        >
          <BrainCircuit className="text-white w-7 h-7" />
          <div className="absolute right-full mr-4 bg-[#111827] border border-gray-800 px-4 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-2xl">
            Ask AI Assistant
          </div>
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
