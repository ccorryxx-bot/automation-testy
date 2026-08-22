import { assertDashboardAccess, dispatchWorkflow, requestBody, setRepositorySecret } from "./_github.js";

const SECRET_FIELDS = {
  sourceUrl: "SOURCE_URL", siteAdapter: "SITE_ADAPTER", sourceUsername: "SOURCE_USERNAME", sourcePassword: "SOURCE_PASSWORD",
  paymentAmount: "PAYMENT_AMOUNT", paymentMethod: "PAYMENT_METHOD", telegramBotToken: "TELEGRAM_BOT_TOKEN", telegramChatId: "TELEGRAM_CHAT_ID",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    assertDashboardAccess(req);
    const body = requestBody(req);
    if (!/^https?:\/\//i.test(body.sourceUrl ?? "")) return res.status(400).json({ error: "A valid source URL is required." });
    if (!body.telegramBotToken || !body.telegramChatId) return res.status(400).json({ error: "Telegram token and chat ID are required." });
    await Promise.all(Object.entries(SECRET_FIELDS).map(([field, secretName]) => setRepositorySecret(secretName, body[field] ?? "")));
    await setRepositorySecret("MONITOR_ENABLED", "true");
    await dispatchWorkflow();
    return res.status(200).json({ ok: true, message: "Secure configuration saved and monitor triggered." });
  } catch (error) { return res.status(error?.statusCode ?? 500).json({ error: error instanceof Error ? error.message : "Unable to configure monitor." }); }
}
