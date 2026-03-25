import React, { useState } from 'react';
import { ObligationList } from '../components/obligations/ObligationList';
import { UnresolvedItems } from '../components/obligations/UnresolvedItems';
import { PaymentCalendarModal } from '../components/obligations/PaymentCalendarModal';
import { Card, Button, Badge } from '../components/ui/Common';
import { PaymentPriorityCard } from '../components/obligations/PaymentPriorityCard';
import { Calendar, Plus } from 'lucide-react';

export default function Obligations() {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className="space-y-8">
      {calendarOpen && <PaymentCalendarModal onClose={() => setCalendarOpen(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Obligations</h2>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">Payables & Compliance Tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            GST Calendar
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setCalendarOpen(true)}>
            📅 Payment Calendar
          </Button>
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Obligation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ObligationList />
        </div>
        <div className="space-y-8">
          <Card title="Compliance Status" subtitle="GST & TDS Summary">
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-100">GST Monthly Deposit</span>
                  <Badge variant="danger">OVERDUE</Badge>
                </div>
                <p className="text-2xl font-black text-white">₹62,000</p>
                <p className="text-[10px] text-gray-500 mt-2">Was due: Mar 23, 2026 · +18% p.a. penalty</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-100">TDS Payment – March</span>
                  <Badge variant="warning">PENDING</Badge>
                </div>
                <p className="text-2xl font-black text-white">₹12,000</p>
                <p className="text-[10px] text-gray-500 mt-2">Due Date: Mar 27, 2026</p>
              </div>
              <Button variant="outline" className="w-full text-xs py-3">View Audit Trail</Button>
            </div>
          </Card>
          <PaymentPriorityCard />
        </div>
      </div>

      {/* ── Unresolved Items ─────────────────────────────────────────────── */}
      <UnresolvedItems />
    </div>
  );
}
