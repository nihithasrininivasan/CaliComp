import React from 'react';
import { Shield, BrainCircuit, Building2, Archive, Lock } from 'lucide-react';

interface Section { icon: React.ElementType; title: string; body: string }

const SECTIONS: Section[] = [
  {
    icon: Shield,
    title: 'Data Protection',
    body: "CaliComp processes financial data in compliance with India's Information Technology Act (2000) and the Digital Personal Data Protection Act (2023). All financial documents are processed on our servers. Personal identifiers are stripped before any data is sent to third-party AI services.",
  },
  {
    icon: BrainCircuit,
    title: 'AI Usage Disclosure',
    body: "CaliComp uses OpenAI's GPT-4o model for document extraction and email drafting. Financial calculations (runway, prioritisation, LP solver) are performed using deterministic Python logic — GPT-4o does not make financial decisions.",
  },
  {
    icon: Building2,
    title: 'Bank Data',
    body: "Bank connections use India's RBI-regulated Account Aggregator framework. CaliComp is an FIU (Financial Information User). We receive read-only transaction data. We never access your banking credentials.",
  },
  {
    icon: Archive,
    title: 'Data Retention',
    body: 'Uploaded documents are stored with encrypted, opaque filenames. You may request deletion of all your data at any time by contacting support@calicomp.in.',
  },
  {
    icon: Lock,
    title: 'Security',
    body: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). API endpoints are protected with JWT authentication.',
  },
];

export function LegalTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-black text-white mb-1">Regulatory Compliance & Data Practices</h3>
        <p className="text-xs text-gray-500">How CaliComp handles your data in accordance with Indian law.</p>
      </div>

      <div className="space-y-5">
        {SECTIONS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4 p-5 bg-gray-900/40 border border-gray-800 rounded-xl">
            <div className="w-9 h-9 rounded-xl bg-blue-900/20 border border-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1.5">{title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-600 pt-2">
        For queries, contact{' '}
        <a href="mailto:support@calicomp.in" className="text-blue-500 hover:underline">support@calicomp.in</a>
        {' '}· Last updated March 2026
      </p>
    </div>
  );
}
