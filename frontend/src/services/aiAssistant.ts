// @BACKEND-PROMPT:
// Read CLAUDE.md. Build POST /api/v1/ai/chat in backend/app/routers/ai_chat.py
// Input: {message: str, history: [{role: user|assistant, content: str}], business_id: from JWT}
// 1. Fetch financial context from DB: {cash_balance, runway_days, daily_burn, top 3 obligations by priority, top 3 pending receivables, last 5 transactions, overdue_count, financial_health_score}
// 2. Build OpenAI messages array:
//    - System message: "You are CaliComp's financial assistant for Indian SMBs. You have the user's real financial data injected below. Answer questions about their finances specifically — always cite actual numbers. Keep responses under 80 words unless asked for detail. When asked to draft an email, output a complete ready-to-send email with subject line. Never give generic advice."
//    - Context injection as first user message: f"FINANCIAL CONTEXT: {json.dumps(context)}"
//    - Then: the full history array
//    - Then: the new user message
// 3. Call GPT-4o with temperature=0.3
// 4. Detect intent in response: if response contains a full email draft (has "Subject:" line), set response_type: EMAIL_DRAFT in the return object so frontend can show the copy button.
// 5. Store conversation to a chat_sessions table: {id, business_id, messages_json, created_at, last_active_at}
// 6. Rate limit: max 20 messages per hour per business_id to control OpenAI costs. Return 429 with message if exceeded.

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isEmailDraft?: boolean;
}

const MOCK_RESPONSES: Record<string, { content: string; isEmailDraft?: boolean }> = {
  runway: {
    content:
      'Your current cash runway is **42 days** based on a balance of ₹8,45,000 and daily burn of ~₹20,119. With your ₹2,04,000 in pending obligations due this week, this could drop to **32 days** if not managed. Consider deferring TechSupplies (₹45,000, 70% flexibility) to extend runway by ~4 days.',
  },
  gst: {
    content:
      'Your **GST Monthly Deposit of ₹62,000** is currently **2 days overdue**. The penalty rate is 18% p.a. (₹30/day). You should pay this immediately to stop further accrual. The TDS payment of ₹12,000 is due in 2 days — that one is on track.',
  },
  defer: {
    content:
      '**TechSupplies Co.** is the best deferral candidate: ₹45,000 due in 10 days, 70% flexibility score, and only a 2% penalty rate. Deferring by 7 days adds ~4 days of runway. **Sharma Textiles** (₹55,000, 50% flexibility) is a secondary option. I would not defer HDFC EMI (0% flexibility, 24% penalty) or any tax obligations.',
  },
  email: {
    content: `Here is a draft email to TechSupplies Co.:

---
**Subject: Payment Deferral Request – Invoice #TC-2026-03**

Dear TechSupplies Team,

I hope this message finds you well. We value our ongoing relationship and would like to request a short deferral of 7 days on our current invoice of ₹45,000 (due March 30, 2026) to April 6, 2026.

We are currently managing a period of tighter cash flow and want to ensure we honour all commitments in full. There will be no reduction in amount, and we can commit to the revised date with certainty.

Please let us know if this arrangement works for your team.

Warm regards,
Demo Company
---`,
    isEmailDraft: true,
  },
  default: {
    content:
      'Your financial health score is **68/100**. Key concerns: GST payment is overdue (₹62,000), and your 42-day runway needs attention. Your top priority should be clearing the GST deposit today, then scheduling a follow-up with Mehta Exports for the ₹2,25,000 receivable due this week. Would you like me to draft an email or analyse a specific obligation?',
  },
};

function detectKeyword(message: string): keyof typeof MOCK_RESPONSES {
  const m = message.toLowerCase();
  if (m.includes('runway') || m.includes('cash') || m.includes('burn')) return 'runway';
  if (m.includes('gst') || m.includes('tds') || m.includes('tax') || m.includes('compliance')) return 'gst';
  if (m.includes('defer') || m.includes('vendor') || m.includes('which')) return 'defer';
  if (m.includes('email') || m.includes('draft') || m.includes('techsupplies') || m.includes('reminder')) return 'email';
  return 'default';
}

export async function sendMessage(
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _history: ChatMessage[]
): Promise<{ content: string; isEmailDraft?: boolean }> {
  // TODO: replace with POST /api/v1/ai/chat
  return new Promise((resolve) => {
    setTimeout(() => {
      const key = detectKeyword(message);
      resolve(MOCK_RESPONSES[key]);
    }, 1000 + Math.random() * 500);
  });
}
