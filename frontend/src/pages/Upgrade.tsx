// @BACKEND-PROMPT:
// Read CLAUDE.md. Build POST /api/v1/payments/upgrade in backend/app/routers/payments.py
// Accepts: { plan: 'pro', payment_method: 'demo' }
// Step 1: Validate request. For demo mode, skip real payment gateway.
// Step 2: Update user plan in DB: users.plan = 'pro', users.upgraded_at = now()
// Step 3: Return: { success: true, plan: 'pro', upgraded_at: ISO timestamp }
// Future: integrate Razorpay for real payments. Store order_id, payment_id, signature.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, Shield, Brain, TrendingUp, Sparkles, X } from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Common';

// ── Confetti ──────────────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; rotation: number; rotSpeed: number; opacity: number;
}

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4'];
    particles.current = Array.from({ length: 120 }, () => ({
      x:        Math.random() * canvas.width,
      y:        Math.random() * canvas.height - canvas.height,
      vx:       (Math.random() - 0.5) * 3,
      vy:       Math.random() * 4 + 2,
      color:    COLORS[Math.floor(Math.random() * COLORS.length)],
      size:     Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      opacity:  1,
    }));

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles.current) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height * 0.8) p.opacity -= 0.02;
        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }
      }
      if (alive) rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
    />
  );
}

// ── Payment modal ─────────────────────────────────────────────────────────────
interface PaymentModalProps {
  onClose:   () => void;
  onSuccess: () => void;
}

function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'done'>('form');

  async function handlePay() {
    setStep('processing');
    // TODO: replace with POST /api/v1/payments/upgrade
    await new Promise(r => setTimeout(r, 1800));
    setStep('done');
    setTimeout(onSuccess, 800);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={step === 'form' ? onClose : undefined} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-[#0D1220] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">

          {step === 'form' && (
            <>
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
                <div>
                  <h3 className="text-base font-black text-white">Upgrade to Pro</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Demo mode — no real payment</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Price */}
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-white">₹2,499</span>
                  <span className="text-sm text-gray-500 mb-1 font-bold">/month</span>
                </div>

                {/* Features included */}
                <div className="space-y-2.5">
                  {[
                    'Unlimited AI Insights (GPT-4o)',
                    'Smart Reconciliation & Auto-Match',
                    'Cash Flow Scenario Simulation',
                    'Priority obligation deferral engine',
                    'Dedicated support + SLA',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      <span className="text-sm text-gray-300">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Demo card */}
                <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl space-y-3">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Demo Payment Details</p>
                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400 font-mono">4242 4242 4242 4242</div>
                      <div className="w-20 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400 font-mono">12/28</div>
                      <div className="w-16 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400 font-mono">123</div>
                    </div>
                    <p className="text-[10px] text-gray-600">Pre-filled demo card · Click Pay to simulate upgrade</p>
                  </div>
                </div>

                <Button variant="primary" className="w-full py-3 text-sm font-black" onClick={handlePay}>
                  Pay ₹2,499 — Upgrade Now
                </Button>

                <p className="text-[10px] text-gray-600 text-center">
                  Secured by Razorpay · Cancel anytime · 7-day refund policy
                </p>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="px-6 py-14 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-blue-600/30 border-t-blue-500 animate-spin" />
              <p className="text-sm font-black text-white">Processing payment…</p>
              <p className="text-xs text-gray-500">Contacting Razorpay gateway</p>
            </div>
          )}

          {step === 'done' && (
            <div className="px-6 py-14 flex flex-col items-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <p className="text-sm font-black text-white">Payment successful!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Feature comparison row ─────────────────────────────────────────────────────
function Row({ label, free, pro }: { label: string; free: boolean; pro: boolean }) {
  return (
    <div className="grid grid-cols-3 py-3 border-b border-gray-800/60 last:border-0 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-center">{free  ? <CheckCircle className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-gray-700 mx-auto" />}</span>
      <span className="text-center">{pro   ? <CheckCircle className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-gray-700 mx-auto" />}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
const PRO_FEATURES = [
  { icon: Brain,      label: 'AI Insights',           desc: 'GPT-4o financial recommendations, anomaly detection, weekly digest' },
  { icon: TrendingUp, label: 'Scenario Simulation',   desc: 'Interactive cash runway simulator with deferral sliders' },
  { icon: Sparkles,   label: 'Smart Reconciliation',  desc: 'Auto-match transactions to obligations with confidence scoring' },
  { icon: Shield,     label: 'Compliance Alerts',     desc: 'Automated GST, TDS, and statutory deadline reminders' },
  { icon: Zap,        label: 'Priority Engine',       desc: 'LP-solver based payment prioritisation optimised for penalties' },
];

export default function Upgrade() {
  const navigate         = useNavigate();
  const { isPro, upgradeToPro } = usePlan();
  const { showToast }    = useToast();
  const [modal,     setModal]     = useState(false);
  const [confetti,  setConfetti]  = useState(false);

  // Already Pro — show a "you're all set" state
  function handleSuccess() {
    upgradeToPro();
    setModal(false);
    setConfetti(true);
    showToast('Welcome to CaliComp Pro! 🎉');
    setTimeout(() => {
      setConfetti(false);
      navigate('/dashboard');
    }, 3000);
  }

  return (
    <>
      {confetti && <ConfettiCanvas />}
      {modal    && <PaymentModal onClose={() => setModal(false)} onSuccess={handleSuccess} />}

      <div className="max-w-3xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/20 border border-blue-900/30">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">CaliComp Pro</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Unlock the full platform</h2>
          <p className="text-sm text-gray-500 font-medium max-w-md mx-auto">
            Built for Indian SMBs managing tight cash flow. Get AI-powered insights, smart reconciliation, and scenario planning.
          </p>
        </div>

        {/* Pro feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRO_FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="p-5 bg-[#111827] border border-gray-800 rounded-2xl flex gap-4 hover:border-blue-900/60 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-900/20 border border-blue-900/30 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 px-5 py-3 border-b border-gray-800 bg-gray-900/40">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Feature</span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Free</span>
            <span className="text-[10px] font-black text-blue-400  uppercase tracking-widest text-center">Pro</span>
          </div>
          <div className="px-5">
            <Row label="Dashboard & Transactions"  free pro />
            <Row label="Manual Entry & OCR"        free pro />
            <Row label="Obligations Manager"       free pro />
            <Row label="Bank Connection (AA)"      free pro />
            <Row label="AI Insights"               free={false} pro />
            <Row label="Scenario Simulation"       free={false} pro />
            <Row label="Smart Reconciliation"      free={false} pro />
            <Row label="Compliance Alerts"         free={false} pro />
            <Row label="Priority Payment Engine"   free={false} pro />
            <Row label="Priority Support"          free={false} pro />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          {isPro ? (
            <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-green-900/20 border border-green-900/40">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm font-black text-green-300">You're on Pro — all features unlocked</span>
            </div>
          ) : (
            <>
              <Button variant="primary" className="px-10 py-3.5 text-base font-black" onClick={() => setModal(true)}>
                Upgrade to Pro — ₹2,499/mo
              </Button>
              <p className="text-xs text-gray-600">No contract · Cancel anytime · 7-day refund</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
