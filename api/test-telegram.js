export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const { telegramBotToken, telegramChatId } = req.body ?? {};
  if (!telegramBotToken || !telegramChatId) return res.status(400).json({ error: "Telegram bot token and chat ID are required." });
  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ chat_id: telegramChatId, text: "Automation Testy connection test passed." }), signal: AbortSignal.timeout(25_000) });
    if (!response.ok) throw new Error(`Telegram returned HTTP ${response.status}.`);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram test failed", error);
    return res.status(502).json({ error: "Telegram test could not be delivered." });
  }
}
