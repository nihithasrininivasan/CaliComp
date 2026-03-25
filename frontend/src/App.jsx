import React, { useState, useCallback } from "react";
import {
    uploadTransactions,
    computeRunway,
    prioritizePayments,
} from "./services/api";

/* ─── Styles ────────────────────────────────────────────────────────────────── */

const styles = {
    app: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#e2e8f0",
        padding: "0",
        margin: "0",
    },
    header: {
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
        padding: "1.25rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
    },
    logo: {
        fontSize: "1.5rem",
        fontWeight: 800,
        background: "linear-gradient(135deg, #818cf8, #6366f1, #a78bfa)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "-0.025em",
    },
    badge: {
        background: "rgba(99, 102, 241, 0.15)",
        color: "#a5b4fc",
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        border: "1px solid rgba(99, 102, 241, 0.3)",
    },
    main: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem",
    },
    hero: {
        textAlign: "center",
        marginBottom: "3rem",
    },
    heroTitle: {
        fontSize: "2.5rem",
        fontWeight: 800,
        lineHeight: 1.1,
        marginBottom: "0.75rem",
        background: "linear-gradient(to right, #e2e8f0, #94a3b8)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    heroSub: {
        fontSize: "1.1rem",
        color: "#94a3b8",
        maxWidth: "600px",
        margin: "0 auto",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem",
    },
    card: {
        background: "rgba(30, 41, 59, 0.6)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(99, 102, 241, 0.15)",
        borderRadius: "16px",
        padding: "1.75rem",
        transition: "all 0.3s ease",
    },
    cardTitle: {
        fontSize: "1.1rem",
        fontWeight: 700,
        color: "#c7d2fe",
        marginBottom: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
    },
    uploadArea: {
        border: "2px dashed rgba(99, 102, 241, 0.3)",
        borderRadius: "12px",
        padding: "2rem",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.3s ease",
        background: "rgba(99, 102, 241, 0.05)",
    },
    input: {
        width: "100%",
        padding: "0.75rem 1rem",
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        border: "1px solid rgba(99, 102, 241, 0.3)",
        borderRadius: "10px",
        color: "#e2e8f0",
        fontSize: "0.95rem",
        outline: "none",
        fontFamily: "'Inter', sans-serif",
        boxSizing: "border-box",
        marginBottom: "0.75rem",
    },
    button: {
        width: "100%",
        padding: "0.75rem",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        border: "none",
        borderRadius: "10px",
        color: "white",
        fontSize: "0.95rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontFamily: "'Inter', sans-serif",
    },
    buttonDisabled: {
        opacity: 0.5,
        cursor: "not-allowed",
    },
    resultBox: {
        marginTop: "1.25rem",
        background: "rgba(15, 23, 42, 0.6)",
        borderRadius: "12px",
        padding: "1.25rem",
        border: "1px solid rgba(99, 102, 241, 0.1)",
        fontSize: "0.875rem",
        lineHeight: 1.7,
        whiteSpace: "pre-wrap",
        maxHeight: "400px",
        overflowY: "auto",
    },
    metric: {
        display: "flex",
        justifyContent: "space-between",
        padding: "0.5rem 0",
        borderBottom: "1px solid rgba(99, 102, 241, 0.08)",
    },
    metricLabel: {
        color: "#94a3b8",
        fontSize: "0.85rem",
    },
    metricValue: {
        color: "#e2e8f0",
        fontWeight: 600,
        fontSize: "0.95rem",
    },
    error: {
        marginTop: "0.75rem",
        padding: "0.75rem 1rem",
        background: "rgba(239, 68, 68, 0.15)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "10px",
        color: "#fca5a5",
        fontSize: "0.85rem",
    },
    tag: {
        display: "inline-block",
        padding: "0.2rem 0.6rem",
        borderRadius: "6px",
        fontSize: "0.75rem",
        fontWeight: 600,
        marginRight: "0.4rem",
    },
    tagSelected: {
        background: "rgba(34, 197, 94, 0.2)",
        color: "#86efac",
        border: "1px solid rgba(34, 197, 94, 0.3)",
    },
    tagDeferred: {
        background: "rgba(234, 179, 8, 0.2)",
        color: "#fde047",
        border: "1px solid rgba(234, 179, 8, 0.3)",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "1rem",
        fontSize: "0.85rem",
    },
    th: {
        textAlign: "left",
        padding: "0.6rem 0.75rem",
        borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
        color: "#a5b4fc",
        fontWeight: 600,
        fontSize: "0.8rem",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    td: {
        padding: "0.6rem 0.75rem",
        borderBottom: "1px solid rgba(99, 102, 241, 0.06)",
        color: "#cbd5e1",
    },
};

/* ─── App Component ─────────────────────────────────────────────────────────── */

export default function App() {
    const [transactions, setTransactions] = useState(null);
    const [runway, setRunway] = useState(null);
    const [priority, setPriority] = useState(null);
    const [balance, setBalance] = useState("50000");
    const [loading, setLoading] = useState({});
    const [errors, setErrors] = useState({});

    const setLoadingKey = (key, val) =>
        setLoading((prev) => ({ ...prev, [key]: val }));
    const setErrorKey = (key, val) =>
        setErrors((prev) => ({ ...prev, [key]: val }));

    /* ── Upload Handler ──────────────────────────────────── */
    const handleUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoadingKey("upload", true);
        setErrorKey("upload", null);

        try {
            const result = await uploadTransactions(file);
            setTransactions(result.transactions);
        } catch (err) {
            setErrorKey(
                "upload",
                err.response?.data?.detail || "Failed to upload file."
            );
        } finally {
            setLoadingKey("upload", false);
        }
    }, []);

    /* ── Runway Handler ──────────────────────────────────── */
    const handleRunway = useCallback(async () => {
        if (!transactions) return;
        setLoadingKey("runway", true);
        setErrorKey("runway", null);

        try {
            const apiTxns = transactions.map((t) => ({
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.direction,
            }));
            const result = await computeRunway(apiTxns, parseFloat(balance));
            setRunway(result);
        } catch (err) {
            setErrorKey(
                "runway",
                err.response?.data?.detail || "Failed to compute runway."
            );
        } finally {
            setLoadingKey("runway", false);
        }
    }, [transactions, balance]);

    /* ── Prioritize Handler ──────────────────────────────── */
    const handlePrioritize = useCallback(async () => {
        if (!transactions) return;
        setLoadingKey("prioritize", true);
        setErrorKey("prioritize", null);

        try {
            const apiTxns = transactions.map((t) => ({
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.direction,
            }));
            const result = await prioritizePayments(apiTxns, parseFloat(balance));
            setPriority(result);
        } catch (err) {
            setErrorKey(
                "prioritize",
                err.response?.data?.detail || "Failed to prioritize."
            );
        } finally {
            setLoadingKey("prioritize", false);
        }
    }, [transactions, balance]);

    return (
        <div style={styles.app}>
            {/* ── Header ── */}
            <header style={styles.header}>
                <div style={styles.logo}>💰 CaliComp</div>
                <span style={styles.badge}>v0.1.0 — Cash Flow Intelligence</span>
            </header>

            <main style={styles.main}>
                {/* ── Hero ── */}
                <section style={styles.hero}>
                    <h1 style={styles.heroTitle}>Cash Flow Intelligence Dashboard</h1>
                    <p style={styles.heroSub}>
                        Upload bank statements, compute your liquidity runway, and
                        intelligently prioritize payments — all with full explainability.
                    </p>
                </section>

                {/* ── Cards Grid ── */}
                <div style={styles.grid}>
                    {/* Upload Card */}
                    <div style={styles.card}>
                        <div style={styles.cardTitle}>📄 Upload Transactions</div>
                        <label style={styles.uploadArea}>
                            <input
                                id="csv-upload"
                                type="file"
                                accept=".csv"
                                onChange={handleUpload}
                                style={{ display: "none" }}
                            />
                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⬆️</div>
                            <div style={{ color: "#94a3b8" }}>
                                {loading.upload
                                    ? "Processing..."
                                    : "Click to upload a CSV bank statement"}
                            </div>
                        </label>

                        {errors.upload && <div style={styles.error}>❌ {errors.upload}</div>}

                        {transactions && (
                            <div style={styles.resultBox}>
                                <div style={styles.metric}>
                                    <span style={styles.metricLabel}>Transactions loaded</span>
                                    <span style={styles.metricValue}>{transactions.length}</span>
                                </div>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Date</th>
                                            <th style={styles.th}>Description</th>
                                            <th style={styles.th}>Amount</th>
                                            <th style={styles.th}>Direction</th>
                                            <th style={styles.th}>Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.slice(0, 10).map((t, i) => (
                                            <tr key={t.id || i}>
                                                <td style={styles.td}>{t.date}</td>
                                                <td style={styles.td}>{t.description}</td>
                                                <td style={styles.td}>${t.amount.toLocaleString()}</td>
                                                <td style={styles.td}>
                                                    <span
                                                        style={{
                                                            ...styles.tag,
                                                            ...(t.direction === "inflow"
                                                                ? styles.tagSelected
                                                                : styles.tagDeferred),
                                                        }}
                                                    >
                                                        {t.direction}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>{t.category}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {transactions.length > 10 && (
                                    <div
                                        style={{ color: "#94a3b8", textAlign: "center", marginTop: "0.75rem", fontSize: "0.8rem" }}
                                    >
                                        Showing 10 of {transactions.length} transactions
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Runway Card */}
                    <div style={styles.card}>
                        <div style={styles.cardTitle}>📉 Liquidity Runway</div>
                        <input
                            id="balance-input"
                            style={styles.input}
                            type="number"
                            placeholder="Current balance ($)"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                        />
                        <button
                            id="compute-runway-btn"
                            style={{
                                ...styles.button,
                                ...(!transactions || loading.runway
                                    ? styles.buttonDisabled
                                    : {}),
                            }}
                            onClick={handleRunway}
                            disabled={!transactions || loading.runway}
                        >
                            {loading.runway ? "Computing..." : "Compute Runway"}
                        </button>

                        {errors.runway && <div style={styles.error}>❌ {errors.runway}</div>}

                        {runway && (
                            <div style={styles.resultBox}>
                                <div style={styles.metric}>
                                    <span style={styles.metricLabel}>Days to Zero</span>
                                    <span
                                        style={{
                                            ...styles.metricValue,
                                            color:
                                                runway.days_to_zero === Infinity
                                                    ? "#86efac"
                                                    : runway.days_to_zero <= 7
                                                        ? "#fca5a5"
                                                        : runway.days_to_zero <= 30
                                                            ? "#fde047"
                                                            : "#86efac",
                                            fontSize: "1.25rem",
                                        }}
                                    >
                                        {runway.days_to_zero === Infinity
                                            ? "∞ (Sustainable)"
                                            : `${runway.days_to_zero} days`}
                                    </span>
                                </div>
                                <div style={styles.metric}>
                                    <span style={styles.metricLabel}>Daily Burn Rate</span>
                                    <span style={styles.metricValue}>
                                        ${runway.daily_burn_rate?.toLocaleString()}
                                    </span>
                                </div>
                                <div style={styles.metric}>
                                    <span style={styles.metricLabel}>Daily Inflow</span>
                                    <span style={{ ...styles.metricValue, color: "#86efac" }}>
                                        +${runway.daily_inflow?.toLocaleString()}
                                    </span>
                                </div>
                                <div style={styles.metric}>
                                    <span style={styles.metricLabel}>Daily Outflow</span>
                                    <span style={{ ...styles.metricValue, color: "#fca5a5" }}>
                                        -${runway.daily_outflow?.toLocaleString()}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        marginTop: "1rem",
                                        padding: "0.75rem",
                                        background: "rgba(99, 102, 241, 0.08)",
                                        borderRadius: "8px",
                                        fontSize: "0.8rem",
                                        color: "#94a3b8",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {runway.explanation}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Prioritize Card */}
                    <div style={styles.card}>
                        <div style={styles.cardTitle}>🧮 Payment Prioritizer</div>
                        <button
                            id="prioritize-btn"
                            style={{
                                ...styles.button,
                                ...(!transactions || loading.prioritize
                                    ? styles.buttonDisabled
                                    : {}),
                            }}
                            onClick={handlePrioritize}
                            disabled={!transactions || loading.prioritize}
                        >
                            {loading.prioritize ? "Solving..." : "Prioritize Payments"}
                        </button>

                        {errors.prioritize && (
                            <div style={styles.error}>❌ {errors.prioritize}</div>
                        )}

                        {priority && (
                            <div style={styles.resultBox}>
                                <div style={styles.metric}>
                                    <span style={styles.metricLabel}>Selected Total</span>
                                    <span style={styles.metricValue}>
                                        ${priority.total_selected_amount?.toLocaleString()}
                                    </span>
                                </div>
                                <div style={styles.metric}>
                                    <span style={styles.metricLabel}>Remaining Budget</span>
                                    <span style={styles.metricValue}>
                                        ${priority.remaining_balance?.toLocaleString()}
                                    </span>
                                </div>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Status</th>
                                            <th style={styles.th}>Description</th>
                                            <th style={styles.th}>Amount</th>
                                            <th style={styles.th}>Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {priority.ranked_items?.map((item, i) => (
                                            <tr key={item.transaction_id || i}>
                                                <td style={styles.td}>
                                                    <span
                                                        style={{
                                                            ...styles.tag,
                                                            ...(item.selected
                                                                ? styles.tagSelected
                                                                : styles.tagDeferred),
                                                        }}
                                                    >
                                                        {item.selected ? "PAY" : "DEFER"}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>{item.description}</td>
                                                <td style={styles.td}>
                                                    ${item.amount?.toLocaleString()}
                                                </td>
                                                <td style={styles.td}>{item.score}/10</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Footer ── */}
                <footer
                    style={{
                        textAlign: "center",
                        padding: "2rem 0 1rem",
                        color: "#475569",
                        fontSize: "0.8rem",
                    }}
                >
                    CaliComp v0.1.0 — Built with ❤️ for the fintech community
                </footer>
            </main>
        </div>
    );
}
