import { assertDashboardAccess, requestBody } from "./_github.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    assertDashboardAccess(req);
    const { telegramBotToken, telegramChatId } = requestBody(req);
    if (!telegramBotToken || !telegramChatId) return res.status(400).json({ error: "Telegram token and chat ID are required." });
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ chat_id: telegramChatId, text: "Automation Testy: Telegram connection is ready." }), signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) throw new Error(`Telegram returned HTTP ${response.status}.`);
    return res.status(200).json({ ok: true });
  } catch (error) { return res.status(error?.statusCode ?? 500).json({ error: error instanceof Error ? error.message : "Unable to send Telegram test." }); }
}
