import { assertDashboardAccess, dispatchWorkflow, requestBody, setRepositorySecret } from "./_github.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    assertDashboardAccess(req);
    const { enabled } = requestBody(req);
    await setRepositorySecret("MONITOR_ENABLED", enabled ? "true" : "false");
    if (enabled) await dispatchWorkflow();
    return res.status(200).json({ ok: true, enabled: Boolean(enabled) });
  } catch (error) { return res.status(error?.statusCode ?? 500).json({ error: error instanceof Error ? error.message : "Unable to update monitor status." }); }
}
