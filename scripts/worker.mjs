import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractMyanmarPhones, hasPhoneChanged } from "../shared/phone.js";
import { AdapterOutcome } from "./adapters/contracts.mjs";
import { resolveAdapter } from "./adapters/index.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_PATH = resolve(ROOT, "state/monitor-state.json");
const CONFIG_PATH = resolve(ROOT, "config/monitor-config.json");
const EVENT_LIMIT = 30;

export async function getConfig() {
  let publicConfig = {};
  try { publicConfig = JSON.parse(await readFile(CONFIG_PATH, "utf8")); } catch { /* Setup is not complete yet. */ }
  return {
    enabled: process.env.MONITOR_ENABLED === "true",
    sourceUrl: publicConfig.sourceUrl ?? "",
    sourceUsername: process.env.SOURCE_USERNAME ?? "",
    sourcePassword: process.env.SOURCE_PASSWORD ?? "",
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  };
}

async function loadState() {
  try { return JSON.parse(await readFile(STATE_PATH, "utf8")); }
  catch { return { lastPhoneNumber: null, lastCheckedAt: null, lastNotifiedAt: null, lastStatus: "idle", source: null, events: [] }; }
}

async function saveState(state) {
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function addEvent(state, status, detail) {
  state.events = [{ at: new Date().toISOString(), status, detail }, ...(Array.isArray(state.events) ? state.events : [])].slice(0, EVENT_LIMIT);
}

export function extractResultPhones(result) {
  return [...new Set([...(result.phoneNumbers ?? []), ...extractMyanmarPhones(result.body ?? "")])];
}

export function classifyAdapterResult(result) {
  switch (result.outcome) {
    case AdapterOutcome.BLOCKED:
      return { stateStatus: "blocked", eventStatus: "blocked", detail: result.detail || "The source needs a human verification step." };
    case AdapterOutcome.UNSUPPORTED:
      return { stateStatus: "unsupported", eventStatus: "unsupported", detail: result.detail || "This source is awaiting automatic discovery support." };
    case AdapterOutcome.EXPIRED:
      return { stateStatus: "expired", eventStatus: "expired", detail: result.detail || "The source target has expired." };
    case AdapterOutcome.ERROR:
      return { stateStatus: "error", eventStatus: "error", detail: result.detail || "The source request failed." };
    default:
      return null;
  }
}

async function sendTelegram(config, phoneNumber) {
  if (!config.telegramBotToken || !config.telegramChatId) throw new Error("Telegram credentials are missing from GitHub Secrets.");
  const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ chat_id: config.telegramChatId, text: `number ပြောင်းသွားပါပြီ!\nnumber - ${phoneNumber}` }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`Telegram request failed with HTTP ${response.status}.`);
}

export async function checkOnce(config, state, dependencies = {}) {
  const adapter = dependencies.resolveAdapter?.(config.sourceUrl) ?? resolveAdapter(config.sourceUrl);
  const save = dependencies.saveState ?? saveState;
  const notify = dependencies.sendTelegram ?? sendTelegram;
  try {
    const result = await adapter.monitor(config);
    state.lastCheckedAt = new Date().toISOString();
    state.source = { id: adapter.id, label: adapter.label, sourceUrl: config.sourceUrl };

    const classification = classifyAdapterResult(result);
    if (classification) {
      state.lastStatus = classification.stateStatus;
      addEvent(state, classification.eventStatus, classification.detail);
      await save(state);
      console.log(classification.detail);
      return { healthy: false, blocked: classification.stateStatus === "blocked", outcome: result.outcome };
    }

    const [phoneNumber] = extractResultPhones(result);
    if (!phoneNumber) {
      const isDiscoveryPending = adapter.isFallback === true;
      state.lastStatus = isDiscoveryPending ? "unsupported" : "parse_failed";
      addEvent(state, isDiscoveryPending ? "unsupported" : "parse_failed", isDiscoveryPending ? "Automatic source discovery did not find a usable recipient number yet. This source will need a background adapter; no technical information is required from you." : "Automatic source check completed, but no Myanmar phone number was found.");
      await save(state);
      console.log(isDiscoveryPending ? "Automatic source discovery is pending." : "No Myanmar phone number found.");
      return { healthy: false, outcome: isDiscoveryPending ? AdapterOutcome.UNSUPPORTED : "parse_failed" };
    }

    const previous = state.lastPhoneNumber;
    const changed = hasPhoneChanged(previous, phoneNumber);
    state.lastPhoneNumber = phoneNumber;
    state.lastStatus = "healthy";
    addEvent(state, changed ? "changed" : previous ? "unchanged" : "baseline", changed ? `Detected changed number ${phoneNumber}.` : previous ? `Number remains ${phoneNumber}.` : `Baseline number detected: ${phoneNumber}.`);
    if (changed) {
      await notify(config, phoneNumber);
      state.lastNotifiedAt = new Date().toISOString();
      console.log(`Phone number changed: ${previous} -> ${phoneNumber}`);
    } else console.log(`Phone number unchanged or baseline: ${phoneNumber}`);
    await save(state);
    return { healthy: true, changed, outcome: AdapterOutcome.FOUND };
  } catch (error) {
    state.lastCheckedAt = new Date().toISOString();
    state.lastStatus = "error";
    addEvent(state, "error", "The background source check could not complete. It will retry on the next scheduled cycle.");
    await save(state);
    console.error(error);
    return { healthy: false, outcome: AdapterOutcome.ERROR, error };
  }
}

export async function run() {
  const config = await getConfig();
  const state = await loadState();
  if (!config.enabled) return console.log("Monitoring is disabled. Nothing to do.");
  if (!config.sourceUrl) throw new Error("Public source configuration is missing. Save the setup form first.");
  const result = await checkOnce(config, state);
  console.log(`Scheduled source-aware check completed (${result.outcome}).`);
  if (result.error) throw result.error;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch(error => { console.error(error); process.exitCode = 1; });
}
