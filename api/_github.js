import sodium from "libsodium-wrappers";

const GITHUB_API = "https://api.github.com";

export function assertDashboardAccess(req) {
  const expected = process.env.DASHBOARD_ACCESS_KEY;
  if (!expected) throw new Error("DASHBOARD_ACCESS_KEY is not configured on Vercel.");
  if (req.headers["x-dashboard-key"] !== expected) {
    const error = new Error("Unauthorized dashboard request.");
    error.statusCode = 401;
    throw error;
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured on Vercel.`);
  return value;
}

function repoPath() { return `/repos/${requiredEnv("GITHUB_OWNER")}/${requiredEnv("GITHUB_REPO")}`; }

async function github(path, options = {}) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: { accept: "application/vnd.github+json", authorization: `Bearer ${requiredEnv("GITHUB_TOKEN")}`, "x-github-api-version": "2022-11-28", ...options.headers },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${(await response.text()).slice(0, 240)}`);
  return response.status === 204 ? null : response.json();
}

async function encryptSecret(value, key) {
  await sodium.ready;
  const encrypted = sodium.crypto_box_seal(sodium.from_string(value), sodium.from_base64(key, sodium.base64_variants.ORIGINAL));
  return sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL);
}

export async function setRepositorySecret(name, value) {
  const publicKey = await github(`${repoPath()}/actions/secrets/public-key`);
  await github(`${repoPath()}/actions/secrets/${name}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ encrypted_value: await encryptSecret(String(value), publicKey.key), key_id: publicKey.key_id }),
  });
}

export async function dispatchWorkflow(ref = "main") {
  await github(`${repoPath()}/actions/workflows/payment-number-monitor.yml/dispatches`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ref }),
  });
}

export function requestBody(req) { return typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {}); }
