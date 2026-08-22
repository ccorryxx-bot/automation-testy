import { dispatchWorker, putActionSecret } from "./_github.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  try {
    const enabled = Boolean(req.body?.enabled);
    await putActionSecret("MONITOR_ENABLED", String(enabled));
    if (enabled) await dispatchWorker();
    return res.status(200).json({ ok: true, enabled });
  } catch (error) {
    console.error("Toggle request failed", error);
    return res.status(502).json({ error: "Unable to update monitor state." });
  }
}
