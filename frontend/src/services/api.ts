/**
 * CaliComp API client.
 *
 * Provides typed wrappers around the FastAPI backend endpoints.
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

/* ─── Types ─────────────────────────────────────────────────────────────────── */

export interface Transaction {
  id?: string;
  date: string;
  description: string;
  amount: number;
  direction: 'inflow' | 'outflow';
  category: string;
}

export interface RunwayResult {
  days_to_zero: number;
  daily_burn_rate: number;
  daily_inflow: number;
  daily_outflow: number;
  explanation: string;
}

export interface RankedItem {
  transaction_id?: string;
  description: string;
  amount: number;
  score: number;
  selected: boolean;
}

export interface PrioritizationResult {
  total_selected_amount: number;
  remaining_balance: number;
  ranked_items: RankedItem[];
}

export interface HealthCheckResult {
  status: string;
  service: string;
  version: string;
}

/* ─── API Payload Types ──────────────────────────────────────────────────────── */

interface TransactionPayload {
  date: string;
  description: string;
  amount: number;
  type: string;
}

/* ─── API Functions ──────────────────────────────────────────────────────────── */

/**
 * Upload a CSV bank statement.
 */
export async function uploadTransactions(
  file: File
): Promise<{ transaction_count: number; transactions: Transaction[] }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await client.post<{ transaction_count: number; transactions: Transaction[] }>(
    '/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

/**
 * Compute liquidity runway.
 */
export async function computeRunway(
  transactions: TransactionPayload[],
  currentBalance: number,
  lookbackDays = 30
): Promise<RunwayResult> {
  const response = await client.post<RunwayResult>('/runway', {
    transactions,
    current_balance: currentBalance,
    lookback_days: lookbackDays,
  });
  return response.data;
}

/**
 * Prioritize payments using LP solver.
 */
export async function prioritizePayments(
  transactions: TransactionPayload[],
  availableBalance: number
): Promise<PrioritizationResult> {
  const response = await client.post<PrioritizationResult>('/prioritize', {
    transactions,
    available_balance: availableBalance,
  });
  return response.data;
}

/**
 * Health check.
 */
export async function healthCheck(): Promise<HealthCheckResult> {
  const response = await axios.get<HealthCheckResult>(
    API_BASE.replace('/api', '') + '/health'
  );
  return response.data;
}

export default { uploadTransactions, computeRunway, prioritizePayments, healthCheck };
