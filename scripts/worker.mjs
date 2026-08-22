import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractMyanmarPhones, hasPhoneChanged } from "../shared/phone.js";
import { getAdapter } from "./adapters/index.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_PATH = resolve(ROOT, "state/monitor-state.json");
const EVENT_LIMIT = 30;
const RUN_WINDOW_MS = Math.min(Math.max(Number(process.env.CHECK_WINDOW_SECONDS ?? "55") * 1000, 10_000), 55_000);
const CHECK_INTERVAL_MS = Math.min(Math.max(Number(process.env.CHECK_INTERVAL_SECONDS ?? "10") * 1000, 5_000), 25_000);

function getConfig() {
  return {
    enabled: process.env.MONITOR_ENABLED === "true",
    sourceUrl: process.env.SOURCE_URL ?? "",
    siteAdapter: process.env.SITE_ADAPTER ?? "direct-payment-page",
    sourceUsername: process.env.SOURCE_USERNAME ?? "",
    sourcePassword: process.env.SOURCE_PASSWORD ?? "",
    paymentAmount: process.env.PAYMENT_AMOUNT ?? "",
    paymentMethod: process.env.PAYMENT_METHOD ?? "",
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  };
}

async function loadState() {
  try { return JSON.parse(await readFile(STATE_PATH, "utf8")); }
  catch { return { lastPhoneNumber: null, lastCheckedAt: null, lastNotifiedAt: null, lastStatus: "idle", events: [] }; }
}

async function saveState(state) {
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function addEvent(state, status, detail) {
  state.events = [{ at: new Date().toISOString(), status, detail }, ...(Array.isArray(state.events) ? state.events : [])].slice(0, EVENT_LIMIT);
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

async function checkOnce(config, state) {
  try {
    const target = await getAdapter(config.siteAdapter).fetchTarget(config);
    state.lastCheckedAt = new Date().toISOString();
    if (target.expired) {
      state.lastStatus = "expired";
      addEvent(state, "expired", "The payment target reported an expired order. No slip confirmation was submitted.");
      await saveState(state);
      console.log("Payment target is expired.");
      return { stop: true, healthy: false };
    }

    const [phoneNumber] = extractMyanmarPhones(target.body);
    if (!phoneNumber) {
      state.lastStatus = "parse_failed";
      addEvent(state, "parse_failed", `No Myanmar phone number found (HTTP ${target.statusCode}).`);
      await saveState(state);
      console.log("No phone number found.");
      return { stop: false, healthy: false };
    }

    const previous = state.lastPhoneNumber;
    state.lastPhoneNumber = phoneNumber;
    state.lastStatus = "healthy";
    addEvent(state, hasPhoneChanged(previous, phoneNumber) ? "changed" : "unchanged", `Detected ${phoneNumber}.`);
    if (hasPhoneChanged(previous, phoneNumber)) {
      await sendTelegram(config, phoneNumber);
      state.lastNotifiedAt = new Date().toISOString();
      console.log(`Phone number changed: ${previous} -> ${phoneNumber}`);
    } else console.log(`Phone number unchanged: ${phoneNumber}`);
    await saveState(state);
    return { stop: false, healthy: true };
  } catch (error) {
    state.lastCheckedAt = new Date().toISOString();
    state.lastStatus = "error";
    addEvent(state, "error", error instanceof Error ? error.message : "Unknown worker error.");
    await saveState(state);
    console.error(error);
    return { stop: false, healthy: false, error };
  }
}

function sleep(milliseconds) {
  return new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds));
}

async function run() {
  const config = getConfig();
  const state = await loadState();
  if (!config.enabled) return console.log("Monitoring is disabled. Nothing to do.");
  if (!config.sourceUrl) throw new Error("SOURCE_URL is missing from GitHub Secrets.");

  const deadline = Date.now() + RUN_WINDOW_MS;
  let attempts = 0;
  let healthyCheckCompleted = false;
  let latestError = null;

  while (Date.now() < deadline) {
    const result = await checkOnce(config, state);
    attempts += 1;
    healthyCheckCompleted ||= result.healthy;
    latestError = result.error ?? latestError;
    if (result.stop) break;

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await sleep(Math.min(CHECK_INTERVAL_MS, remaining));
  }

  console.log(`Bounded run completed after ${attempts} read-only check(s).`);
  if (!healthyCheckCompleted && latestError) throw latestError;
}

run().catch(error => { console.error(error); process.exitCode = 1; });
