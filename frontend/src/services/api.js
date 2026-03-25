/**
 * CaliComp API client.
 *
 * Provides typed wrappers around the FastAPI backend endpoints.
 */

import axios from "axios";

const API_BASE =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const client = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
});

/**
 * Upload a CSV bank statement.
 * @param {File} file - The CSV file to upload.
 * @returns {Promise<{transaction_count: number, transactions: Array}>}
 */
export async function uploadTransactions(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await client.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
}

/**
 * Compute liquidity runway.
 * @param {Array} transactions - List of transaction objects.
 * @param {number} currentBalance - Current account balance.
 * @param {number} [lookbackDays=30] - Historical lookback window.
 * @returns {Promise<Object>} - RunwayResult
 */
export async function computeRunway(
    transactions,
    currentBalance,
    lookbackDays = 30
) {
    const response = await client.post("/runway", {
        transactions,
        current_balance: currentBalance,
        lookback_days: lookbackDays,
    });
    return response.data;
}

/**
 * Prioritize payments using LP solver.
 * @param {Array} transactions - List of transaction objects.
 * @param {number} availableBalance - Budget for payments.
 * @returns {Promise<Object>} - PrioritizationResult
 */
export async function prioritizePayments(transactions, availableBalance) {
    const response = await client.post("/prioritize", {
        transactions,
        available_balance: availableBalance,
    });
    return response.data;
}

/**
 * Health check.
 * @returns {Promise<{status: string, service: string, version: string}>}
 */
export async function healthCheck() {
    const response = await axios.get(
        API_BASE.replace("/api", "") + "/health"
    );
    return response.data;
}

export default { uploadTransactions, computeRunway, prioritizePayments, healthCheck };
