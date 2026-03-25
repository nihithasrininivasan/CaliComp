/**
 * CaliComp — Shared Transaction Type Definitions.
 *
 * Used as a reference for both the React frontend and any future
 * TypeScript-based services.
 */

/** Direction of money flow. */
export type TransactionDirection = "inflow" | "outflow";

/** Normalized transaction object returned by the API. */
export interface Transaction {
    /** Deterministic SHA-256 hash ID (first 16 chars). */
    id: string;

    /** Transaction date in ISO 8601 format (YYYY-MM-DD). */
    date: string;

    /** Human-readable transaction description. */
    description: string;

    /** Absolute transaction amount in USD. */
    amount: number;

    /** Inferred category (payroll, rent, utilities, etc.). */
    category: string;

    /** Data source identifier (csv, pdf, ocr). */
    source: string;

    /** Money flow direction. */
    direction: TransactionDirection;
}

/** Result of the liquidity runway computation. */
export interface RunwayResult {
    days_to_zero: number;
    daily_burn_rate: number;
    daily_inflow: number;
    daily_outflow: number;
    net_daily_rate: number;
    current_balance: number;
    lookback_days: number;
    analysis_start: string;
    analysis_end: string;
    explanation: string;
    inflow_transactions: number;
    outflow_transactions: number;
}

/** A single prioritized payment item. */
export interface PrioritizedItem {
    transaction_id: string;
    description: string;
    amount: number;
    category: string;
    score: number;
    selected: boolean;
    reason: string;
}

/** Complete prioritization result. */
export interface PrioritizationResult {
    ranked_items: PrioritizedItem[];
    total_selected_amount: number;
    available_balance: number;
    remaining_balance: number;
    solver_status: string;
    explanation: string;
}

/** Upload response. */
export interface UploadResponse {
    transaction_count: number;
    transactions: Transaction[];
}
