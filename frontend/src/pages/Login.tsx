import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Common';

const DEMO_EMAIL = 'demo@calicomp.in';
const DEMO_PASSWORD = 'demo123';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/');
      } else {
        setError('Invalid credentials. Use demo@calicomp.in / demo123');
      }
      setLoading(false);
    }, 800);
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-black text-white tracking-tight">CaliComp</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Intelligence</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-black text-white mb-1">Sign in</h1>
          <p className="text-xs text-gray-500 mb-8">
            Demo credentials: demo@calicomp.in / demo123
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@calicomp.in"
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/20 border border-red-900/40 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-sm"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-600 mt-6">
          © 2026 CaliComp Intelligence · For demo purposes only
        </p>
      </div>
    </div>
  );
}
