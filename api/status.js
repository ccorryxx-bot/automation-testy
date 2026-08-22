import { assertDashboardAccess } from "./_github.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    assertDashboardAccess(req);
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    if (!owner || !repo) throw new Error("GITHUB_OWNER and GITHUB_REPO are not configured on Vercel.");
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/state/monitor-state.json`, {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ""}`,
        "x-github-api-version": "2022-11-28",
      },
    });
    if (!response.ok) throw new Error(`Unable to read monitor state (HTTP ${response.status}).`);
    const payload = await response.json();
    return res.status(200).json(JSON.parse(Buffer.from(payload.content, "base64").toString("utf8")));
  } catch (error) {
    return res.status(error?.statusCode ?? 500).json({ error: error instanceof Error ? error.message : "Unable to read monitor status." });
  }
}
