import { dispatchWorker, putActionSecret, putPublicMonitorConfig } from "./_github.js";

const secretNames = { sourceUsername: "SOURCE_USERNAME", sourcePassword: "SOURCE_PASSWORD", telegramBotToken: "TELEGRAM_BOT_TOKEN", telegramChatId: "TELEGRAM_CHAT_ID" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  try {
    const body = req.body ?? {};
    if (!body.sourceUrl || !body.telegramBotToken || !body.telegramChatId) return res.status(400).json({ error: "Source URL, Telegram bot token, and chat ID are required." });
    await Promise.all([
      putPublicMonitorConfig({ sourceUrl: body.sourceUrl, siteAdapter: body.siteAdapter ?? "direct-payment-page", paymentAmount: body.paymentAmount ?? "", paymentMethod: body.paymentMethod ?? "", updatedAt: new Date().toISOString() }),
      putActionSecret("MONITOR_ENABLED", "true"),
      ...Object.entries(secretNames).map(([field, name]) => putActionSecret(name, body[field] ?? "")),
    ]);
    await dispatchWorker();
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Configuration request failed", error);
    return res.status(502).json({ error: "Unable to save the test configuration. Check Vercel GitHub settings." });
  }
}
