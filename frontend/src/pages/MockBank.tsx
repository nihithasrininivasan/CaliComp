// @BACKEND-PROMPT:
// Read CLAUDE.md. This page simulates the HDFC NetBanking portal for demo purposes.
// In production, the real data flow uses Account Aggregator (AA) framework:
//   1. User initiates consent: POST /api/v1/aa/consent/initiate — body: { fip_id: 'HDFC', date_range, data_types: ['TRANSACTIONS','BALANCE'] }
//   2. AA redirects user to FIP consent screen (bank's website/app)
//   3. On approval, FIP sends consent artefact to AA
//   4. Backend fetches data: POST /api/v1/aa/data/fetch — body: { consent_id, date_range }
//   5. AA returns encrypted FI data; backend decrypts and stores as Transactions + updates balance
//   6. GET /api/v1/bank/statement — returns last N transactions from the bank feed
//   7. GET /api/v1/bank/accounts  — returns linked account summary
//   8. Webhook: POST /api/v1/aa/webhook — receives push notifications when new transactions arrive

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import {
  Shield, Share2, CheckCircle, ChevronRight, ArrowDownLeft,
  ArrowUpRight, Info, X, Lock, RefreshCw,
} from 'lucide-react';
import { useTransactionStore } from '../store/transactionStore';
import { useToast } from '../context/ToastContext';

// ── Mock bank statement data ──────────────────────────────────────────────────
const TODAY = new Date('2026-03-25');

interface BankTx {
  id:        string;
  date:      string;
  narration: string;
  ref:       string;
  debit:     number | null;
  credit:    number | null;
  balance:   number;
}

const BANK_TRANSACTIONS: BankTx[] = [
  { id: 'b1',  date: format(subDays(TODAY, 0),  'dd MMM yyyy'), narration: 'NEFT/MEHTA-EXPORTS-CLIENT-PMT',       ref: 'NEFT250325001', debit: null,    credit: 225000, balance: 1245230 },
  { id: 'b2',  date: format(subDays(TODAY, 1),  'dd MMM yyyy'), narration: 'UPI/SHARMA-PROPERTIES-RENT-APR',      ref: 'UPI250324001', debit: 45000,   credit: null,   balance: 1020230 },
  { id: 'b3',  date: format(subDays(TODAY, 3),  'dd MMM yyyy'), narration: 'NEFT/EMPLOYEE-SALARIES-MAR',          ref: 'NEFT250322001', debit: 320000,  credit: null,   balance: 975230  },
  { id: 'b4',  date: format(subDays(TODAY, 4),  'dd MMM yyyy'), narration: 'IMPS/VERMA-TEXTILES-CLIENT-PMT',      ref: 'IMPS250321001', debit: null,    credit: 180000, balance: 1295230 },
  { id: 'b5',  date: format(subDays(TODAY, 6),  'dd MMM yyyy'), narration: 'ACH/AWS-CLOUD-SERVICES-INFRA',        ref: 'ACH250319001',  debit: 12500,   credit: null,   balance: 1115230 },
  { id: 'b6',  date: format(subDays(TODAY, 7),  'dd MMM yyyy'), narration: 'NACH/HDFC-BUSINESS-LOAN-EMI',         ref: 'NACH250318001', debit: 85000,   credit: null,   balance: 1127730 },
  { id: 'b7',  date: format(subDays(TODAY, 8),  'dd MMM yyyy'), narration: 'NEFT/SHARMA-TEXTILES-VENDOR-INV',     ref: 'NEFT250317001', debit: 55000,   credit: null,   balance: 1212730 },
  { id: 'b8',  date: format(subDays(TODAY, 10), 'dd MMM yyyy'), narration: 'NEFT/SINGH-INDUSTRIES-CONSULTING',    ref: 'NEFT250315001', debit: null,    credit: 95000,  balance: 1267730 },
  { id: 'b9',  date: format(subDays(TODAY, 11), 'dd MMM yyyy'), narration: 'OLTAS/TDS-PAYMENT-FEB-CHALLAN',       ref: 'OLTAS250314001', debit: 12000,  credit: null,   balance: 1172730 },
  { id: 'b10', date: format(subDays(TODAY, 13), 'dd MMM yyyy'), narration: 'UPI/MSEDCL-ELECTRICITY-BILL-MAR',     ref: 'UPI250312001',  debit: 8500,    credit: null,   balance: 1184730 },
  { id: 'b11', date: format(subDays(TODAY, 14), 'dd MMM yyyy'), narration: 'NEFT/RAJAN-FABRICS-CLIENT-PMT',       ref: 'NEFT250311001', debit: null,    credit: 150000, balance: 1193230 },
  { id: 'b12', date: format(subDays(TODAY, 15), 'dd MMM yyyy'), narration: 'NEFT/KAPOOR-PACKAGING-VENDOR-INV',    ref: 'NEFT250310001', debit: 32000,   credit: null,   balance: 1043230 },
  { id: 'b13', date: format(subDays(TODAY, 16), 'dd MMM yyyy'), narration: 'IMPS/INTERNET-TELECOM-INFRA',         ref: 'IMPS250309001', debit: 3200,    credit: null,   balance: 1075230 },
  { id: 'b14', date: format(subDays(TODAY, 20), 'dd MMM yyyy'), narration: 'NEFT/GUPTA-AND-SONS-CLIENT-PMT',      ref: 'NEFT250305001', debit: null,    credit: 72000,  balance: 1078430 },
  { id: 'b15', date: format(subDays(TODAY, 22), 'dd MMM yyyy'), narration: 'NACH/HDFC-BUSINESS-LOAN-EMI-FEB',     ref: 'NACH250303001', debit: 85000,   credit: null,   balance: 1006430 },
];

const STANDING_INSTRUCTIONS = [
  { id: 'si1', payee: 'HDFC Business Loan EMI',  amount: 85000, frequency: 'Monthly',  nextDate: format(subDays(TODAY, -8),  'dd MMM'), type: 'NACH' },
  { id: 'si2', payee: 'AWS Cloud Services',       amount: 12500, frequency: 'Monthly',  nextDate: format(subDays(TODAY, -4),  'dd MMM'), type: 'ACH'  },
  { id: 'si3', payee: 'MSEDCL Electricity',       amount: 8500,  frequency: 'Monthly',  nextDate: format(subDays(TODAY, -20), 'dd MMM'), type: 'NACH' },
  { id: 'si4', payee: 'Internet & Telecom',        amount: 3200,  frequency: 'Monthly',  nextDate: format(subDays(TODAY, -13), 'dd MMM'), type: 'SI'   },
];

// ── Consent modal ─────────────────────────────────────────────────────────────
type ConsentStep = 'select' | 'review' | 'loading' | 'done';

interface ConsentModalProps {
  onClose:   () => void;
  onSuccess: () => void;
}

function ConsentModal({ onClose, onSuccess }: ConsentModalProps) {
  const [step,      setStep]      = useState<ConsentStep>('select');
  const [dateRange, setDateRange] = useState<90 | 180 | 365>(90);
  const [agreed,    setAgreed]    = useState(false);

  async function handleAllow() {
    setStep('loading');
    await new Promise(r => setTimeout(r, 2000));
    setStep('done');
    setTimeout(onSuccess, 800);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={step === 'select' || step === 'review' ? onClose : undefined} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-[#0D1220] border border-blue-900/40 rounded-2xl shadow-2xl overflow-hidden">

          {/* Modal header — AA branding */}
          <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/20 px-6 py-4 border-b border-blue-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-black text-white">Account Aggregator Consent</p>
                <p className="text-[10px] text-blue-400 font-bold">RBI-regulated AA Framework · Sahamati</p>
              </div>
            </div>
            {(step === 'select' || step === 'review') && (
              <button onClick={onClose} className="text-gray-500 hover:text-gray-300 p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Step: select range */}
          {step === 'select' && (
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-300 mb-1">Share data from <span className="text-white">HDFC Business Account</span></p>
                <p className="text-[10px] text-gray-500">CaliComp is requesting access to your transaction history to power reconciliation and insights.</p>
              </div>

              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Data to be shared</p>
                {[
                  'Transaction history (debits & credits)',
                  'Account balance',
                  'Account holder name',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 py-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="text-xs text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">History duration</p>
                <div className="flex gap-2">
                  {([90, 180, 365] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDateRange(d)}
                      className={clsx(
                        'flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                        dateRange === d
                          ? 'bg-blue-900/30 border-blue-700 text-blue-300'
                          : 'border-gray-700 text-gray-500 hover:text-gray-300'
                      )}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('review')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step: review & consent */}
          {step === 'review' && (
            <div className="px-6 py-5 space-y-5">
              <div className="p-4 bg-amber-900/10 border border-amber-900/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs font-bold text-amber-300">Consent Summary</p>
                </div>
                <div className="space-y-1 text-[10px] text-gray-400">
                  <p>Financial Information Provider: <span className="text-white font-bold">HDFC Bank</span></p>
                  <p>Financial Information User: <span className="text-white font-bold">CaliComp Intelligence Pvt. Ltd.</span></p>
                  <p>Data shared: <span className="text-white font-bold">Transactions + Balance ({dateRange} days)</span></p>
                  <p>Consent valid: <span className="text-white font-bold">1 year · Revocable anytime</span></p>
                  <p>Purpose: <span className="text-white font-bold">Cash flow analysis & reconciliation</span></p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-blue-500 w-4 h-4"
                />
                <span className="text-[10px] text-gray-400 leading-relaxed">
                  I authorise CaliComp to fetch my financial data via the Account Aggregator framework as described above. I understand I can revoke this consent at any time from Settings → Bank Connections.
                </span>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 py-2.5 border border-gray-700 text-gray-400 text-xs font-bold rounded-xl hover:text-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  disabled={!agreed}
                  onClick={handleAllow}
                  className={clsx(
                    'flex-1 py-2.5 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all',
                    agreed ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 cursor-not-allowed opacity-50'
                  )}
                >
                  <Shield className="w-3.5 h-3.5" /> Allow Access
                </button>
              </div>
            </div>
          )}

          {/* Step: loading */}
          {step === 'loading' && (
            <div className="px-6 py-14 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-blue-600/30 border-t-blue-500 animate-spin" />
              <p className="text-sm font-black text-white">Fetching data from HDFC…</p>
              <p className="text-xs text-gray-500">Decrypting FI data via AA gateway</p>
            </div>
          )}

          {/* Step: done */}
          {step === 'done' && (
            <div className="px-6 py-14 flex flex-col items-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <p className="text-sm font-black text-white">Data shared successfully!</p>
              <p className="text-[10px] text-gray-500">CaliComp can now reconcile your transactions</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MockBank() {
  const navigate                     = useNavigate();
  const { bankConnected, setBankConnected } = useTransactionStore();
  const { showToast }                = useToast();
  const [showConsent, setShowConsent] = useState(false);

  const totalCredit = BANK_TRANSACTIONS.reduce((s, t) => s + (t.credit ?? 0), 0);
  const totalDebit  = BANK_TRANSACTIONS.reduce((s, t) => s + (t.debit  ?? 0), 0);
  const latestBal   = BANK_TRANSACTIONS[0].balance;

  function handleConsentSuccess() {
    setBankConnected(true);
    setShowConsent(false);
    showToast('Bank feed connected — transactions syncing to CaliComp.');
  }

  return (
    <>
      {showConsent && (
        <ConsentModal onClose={() => setShowConsent(false)} onSuccess={handleConsentSuccess} />
      )}

      {/* ── Bank portal wrapper ─────────────────────────────────────────────── */}
      <div className="space-y-0 rounded-2xl overflow-hidden border border-blue-900/40 shadow-2xl shadow-blue-900/10">

        {/* Bank header bar */}
        <div className="bg-gradient-to-r from-[#003580] to-[#004db3] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-white font-black text-sm">HD</span>
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-wide">HDFC NetBanking</p>
              <p className="text-blue-200 text-[10px] font-bold">Secure Session · 128-bit SSL</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-blue-200 font-bold">
              <Lock className="w-3 h-3" />
              Mehta Fabrics Pvt. Ltd.
            </div>
            <span className="text-[10px] text-blue-300 font-bold px-2 py-1 rounded-lg bg-white/10">
              Last login: Today, 09:41 AM
            </span>
          </div>
        </div>

        {/* Account summary bar */}
        <div className="bg-[#00256b] px-6 py-4 border-b border-blue-900/60">
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: 'Account Number', value: 'XXXX XXXX 4821',     sub: 'Current Account' },
              { label: 'Available Balance', value: `₹${latestBal.toLocaleString('en-IN')}`, sub: 'As of today', bold: true },
              { label: 'Total Credits (30d)', value: `+₹${totalCredit.toLocaleString('en-IN')}`, sub: 'Last 30 days', green: true },
              { label: 'Total Debits (30d)',  value: `-₹${totalDebit.toLocaleString('en-IN')}`,  sub: 'Last 30 days', red: true   },
            ].map(({ label, value, sub, bold, green, red }) => (
              <div key={label}>
                <p className="text-[9px] text-blue-300 font-bold uppercase tracking-widest">{label}</p>
                <p className={clsx(
                  'text-base font-black mt-0.5',
                  green ? 'text-green-300' : red ? 'text-red-300' : bold ? 'text-white' : 'text-blue-100'
                )}>
                  {value}
                </p>
                <p className="text-[9px] text-blue-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="bg-[#0B0F1A] p-6 space-y-6">

          {/* Share CTA or connected badge */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-black text-white">Account Statement</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Last 15 transactions · Demo data only</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-xs font-bold text-gray-400 hover:text-gray-200 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              {bankConnected ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-900/20 border border-green-900/40">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-black text-green-300">Connected to CaliComp</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowConsent(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share with CaliComp
                </button>
              )}
            </div>
          </div>

          {/* Transaction table */}
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-900/60 border-b border-gray-800">
                  {['Date', 'Narration', 'Ref. Number', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BANK_TRANSACTIONS.map(tx => (
                  <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-medium whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        {tx.credit
                          ? <ArrowDownLeft className="w-3 h-3 text-green-400 shrink-0" />
                          : <ArrowUpRight  className="w-3 h-3 text-red-400   shrink-0" />
                        }
                        <span className="text-gray-300 font-medium truncate text-[10px]">{tx.narration}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-[9px] whitespace-nowrap">{tx.ref}</td>
                    <td className="px-4 py-3 text-red-400   font-black tabular-nums">
                      {tx.debit  ? tx.debit.toLocaleString('en-IN')  : '—'}
                    </td>
                    <td className="px-4 py-3 text-green-400 font-black tabular-nums">
                      {tx.credit ? tx.credit.toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-200 font-black tabular-nums">
                      {tx.balance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Standing instructions */}
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Standing Instructions / Mandates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STANDING_INSTRUCTIONS.map(si => (
                <div key={si.id} className="flex items-center justify-between p-4 bg-[#111827] border border-gray-800 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-gray-200">{si.payee}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-black text-gray-600 uppercase">{si.type}</span>
                      <span className="text-[9px] text-gray-600">{si.frequency}</span>
                      <span className="text-[9px] text-gray-500">Next: {si.nextDate}</span>
                    </div>
                  </div>
                  <p className="text-sm font-black text-red-400 shrink-0 ml-3">
                    ₹{si.amount.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer disclaimer */}
          <div className="flex items-start gap-2 p-4 bg-blue-900/10 border border-blue-900/20 rounded-xl">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-blue-300">Demo Environment</p>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                This is a simulated HDFC NetBanking interface for the CaliComp demo. No real bank data is shown.
                In production, clicking "Share with CaliComp" initiates an RBI-compliant Account Aggregator consent flow.
                {' '}<button onClick={() => navigate('/settings?tab=bank')} className="text-blue-400 hover:text-blue-300 underline">
                  Manage bank connections in Settings
                </button>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
