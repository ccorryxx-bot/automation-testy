import { getMonitorState } from "./_github.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });
  try { return res.status(200).json(await getMonitorState()); }
  catch { return res.status(200).json({ lastPhoneNumber: null, lastStatus: "idle", events: [] }); }
}

