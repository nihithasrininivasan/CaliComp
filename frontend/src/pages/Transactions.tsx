import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { Card, Button } from '../components/ui/Common';
import { Plus } from 'lucide-react';

export default function Transactions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rangeParam = searchParams.get('range');
  const defaultRange = rangeParam === '90' ? 90 : rangeParam === '60' ? 60 : 30;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Transactions</h2>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">Multi-source unified ledger</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate('/add-transaction?tab=manual')}>
            <Plus className="w-4 h-4" />
            Manual Entry
          </Button>
          <Button variant="primary" className="flex items-center gap-2" onClick={() => navigate('/add-transaction')}>
            <Plus className="w-4 h-4" />
            Import Data
          </Button>
        </div>
      </div>
      <Card className="p-0 overflow-hidden">
        <TransactionTable defaultDays={defaultRange as 30 | 60 | 90} />
      </Card>
    </div>
  );
}
