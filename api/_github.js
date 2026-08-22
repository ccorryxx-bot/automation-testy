import sodium from "libsodium-wrappers";

function settings() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) throw new Error("GitHub server configuration is incomplete.");
  return { owner, repo, token };
}

async function github(path, options = {}) {
  const { owner, repo, token } = settings();
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...options,
    headers: { accept: "application/vnd.github+json", authorization: `Bearer ${token}`, "x-github-api-version": "2022-11-28", ...(options.headers ?? {}) },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}.`);
  return response.status === 204 ? null : response.json();
}

export async function putActionSecret(name, value) {
  await sodium.ready;
  const key = await github("/actions/secrets/public-key");
  const encrypted = sodium.to_base64(sodium.crypto_box_seal(sodium.from_string(String(value)), sodium.from_base64(key.key, sodium.base64_variants.ORIGINAL)), sodium.base64_variants.ORIGINAL);
  await github(`/actions/secrets/${name}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ encrypted_value: encrypted, key_id: key.key_id }) });
}

export async function dispatchWorker() {
  await github("/actions/workflows/payment-number-monitor.yml/dispatches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ref: "main" }) });
}

export async function putPublicMonitorConfig(config) {
  let sha;
  try { sha = (await github("/contents/config/monitor-config.json")).sha; } catch { sha = undefined; }
  const content = Buffer.from(`${JSON.stringify(config, null, 2)}\n`, "utf8").toString("base64");
  await github("/contents/config/monitor-config.json", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "chore: update test monitor config", content, ...(sha ? { sha } : {}) }),
  });
}

export async function getMonitorState() {
  const state = await github("/contents/state/monitor-state.json");
  return JSON.parse(Buffer.from(state.content, "base64").toString("utf8"));
}
