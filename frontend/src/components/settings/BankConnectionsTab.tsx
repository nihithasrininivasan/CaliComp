// @BACKEND-PROMPT:
// The Account Aggregator connection flow described in the Settings UI maps to these backend endpoints:
// POST /api/v1/banks/initiate-consent — body: {bank_name: HDFC|SBI|ICICI|AXIS|KOTAK}. In production this would redirect to the bank's AA portal. In demo: returns {consent_id: uuid, redirect_url: "/mock-bank"} immediately.
// POST /api/v1/banks/confirm-consent — body: {consent_id}. Marks consent as granted, triggers first data sync.
// GET /api/v1/banks/connections — returns all connected banks with {bank_name, connected_at, last_synced_at, status: ACTIVE|DISCONNECTED, account_count}
// DELETE /api/v1/banks/connections/{bank_name} — disconnects the bank, marks transactions from that source as source: DISCONNECTED_FEED

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Plus, Trash2, ExternalLink, Building2, Loader } from 'lucide-react';
import { Button, Badge } from '../ui/Common';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

interface ConnectedBank {
  name: string;
  connectedOn: string;
  lastSync: string;
}

const BANKS = ['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Kotak Bank'] as const;
type BankName = typeof BANKS[number];

type AAStep = 'select' | 'consent' | 'loading' | 'success';

export function BankConnectionsTab() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [connected, setConnected] = useState<ConnectedBank[]>([
    { name: 'HDFC Bank', connectedOn: 'Mar 15, 2026', lastSync: 'Mar 25, 2026' },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<AAStep>('select');
  const [selectedBank, setSelectedBank] = useState<BankName>('SBI');

  function handleProceed() {
    setStep('loading');
    setTimeout(() => setStep('success'), 2000);
  }

  function handleClose() {
    if (step === 'success') {
      const already = connected.find((b) => b.name === selectedBank);
      if (!already) {
        setConnected((prev) => [
          ...prev,
          { name: selectedBank, connectedOn: 'Mar 25, 2026', lastSync: 'Mar 25, 2026' },
        ]);
        showToast(`${selectedBank} connected successfully.`);
      }
    }
    setModalOpen(false);
    setStep('select');
  }

  function handleDisconnect(bankName: string) {
    setConnected((prev) => prev.filter((b) => b.name !== bankName));
    showToast(`${bankName} disconnected.`, 'info');
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-black text-white mb-1">Bank Connections</h3>
        <p className="text-xs text-gray-500">
          Connect banks via RBI's Account Aggregator framework — read-only, no credentials shared.
        </p>
      </div>

      {/* Connected banks */}
      <div className="space-y-3">
        {connected.map((bank) => (
          <div key={bank.name} className="flex items-center gap-4 p-4 bg-gray-900/40 border border-gray-800 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-green-900/20 border border-green-900/40 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-white">{bank.name}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <Badge variant="success">Connected</Badge>
                </div>
              </div>
              <p className="text-[10px] text-gray-500">Connected on {bank.connectedOn} · Last sync {bank.lastSync}</p>
            </div>
            <button
              onClick={() => handleDisconnect(bank.name)}
              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              title="Disconnect"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" className="flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Connect New Bank
        </Button>
        <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate('/mock-bank')}>
          <ExternalLink className="w-4 h-4" /> Try Demo: Open Mock Bank →
        </Button>
      </div>

      {/* AA Consent Modal */}
      <Modal open={modalOpen} onClose={handleClose} title="Connect Bank via Account Aggregator" size="sm">
        {step === 'select' && (
          <div className="space-y-5">
            <p className="text-xs text-gray-400">
              Select your bank. You'll be shown a consent screen before any data is shared.
            </p>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Select Bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value as BankName)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              >
                {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" className="flex-1" onClick={() => setStep('consent')}>Next</Button>
              <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
            </div>
          </div>
        )}

        {step === 'consent' && (
          <div className="space-y-5">
            <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl text-xs text-gray-300 leading-relaxed space-y-2">
              <p className="font-bold text-blue-300">{selectedBank} — Data Consent Request</p>
              <p>You will be redirected to <strong>{selectedBank}</strong> to grant data access. CaliComp will receive:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 ml-1">
                <li>Account balance</li>
                <li>Transaction history (last 90 days)</li>
                <li>Standing instructions</li>
              </ul>
              <div className="pt-2 border-t border-blue-900/30 text-gray-500 space-y-1">
                <p>Access period: <strong className="text-gray-300">90 days</strong></p>
                <p>Access type: <strong className="text-gray-300">Read-only</strong></p>
                <p>You can revoke access at any time from this page.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" className="flex-1" onClick={handleProceed}>Allow Access</Button>
              <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-sm font-bold text-gray-300">Connecting to {selectedBank}…</p>
            <p className="text-xs text-gray-500">Establishing secure AA session</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 rounded-2xl bg-green-900/20 border border-green-900/40 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <p className="text-sm font-bold text-white">Successfully connected!</p>
            <p className="text-xs text-gray-400 text-center">
              {selectedBank} is now linked. Transaction history is being imported.
            </p>
            <Button variant="primary" className="mt-2" onClick={handleClose}>Done</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
