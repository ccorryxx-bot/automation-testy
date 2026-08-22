import { describe, expect, it, vi } from "vitest";
import { extractMyanmarPhones, hasPhoneChanged, normalizeMyanmarDigits, normalizeMyanmarPhone } from "../shared/phone.js";
import { AdapterOutcome, adapterResult, assertReadOnlyRequest } from "../scripts/adapters/contracts.mjs";
import { resolveAdapter } from "../scripts/adapters/index.mjs";
import { mmk1053Adapter } from "../scripts/adapters/mmk1053.mjs";
import { checkOnce, classifyAdapterResult, extractResultPhones } from "../scripts/worker.mjs";

describe("payment-number monitoring helpers", () => {
  it("normalizes Myanmar digits and international Myanmar mobile numbers", () => {
    expect(normalizeMyanmarDigits("၀၉၇၅၈၁၅၅၃၇၂")).toBe("09758155372");
    expect(normalizeMyanmarPhone("+959758155372")).toBe("09758155372");
  });

  it("de-duplicates a number written with Myanmar and ASCII digits", () => {
    expect(extractMyanmarPhones("၀၉၇၅၈၁၅၅၃၇၂ / 09758155372")).toEqual(["09758155372"]);
  });

  it("notifies only after an actual change", () => {
    expect(hasPhoneChanged("09758155372", "09758155372")).toBe(false);
    expect(hasPhoneChanged("09758155372", "09876543210")).toBe(true);
    expect(hasPhoneChanged(null, "09876543210")).toBe(false);
  });
});

describe("automatic source adapters", () => {
  it("recognizes MMK1053 from a URL without asking a user to choose an adapter", () => {
    expect(resolveAdapter("https://www.mmk1053.com/?r=mbt5717").id).toBe("mmk1053");
    expect(resolveAdapter("https://example.com/payment").id).toBe("generic-public-page");
  });

  it("rejects transfer and slip-confirmation endpoint paths", () => {
    expect(assertReadOnlyRequest("https://example.com/counter/kbzpay.html").hostname).toBe("example.com");
    expect(() => assertReadOnlyRequest("https://example.com/wps/relay/manualTransferConfirm")).toThrow(/safety guard/i);
  });

  it("normalizes adapter-provided phone values and page body extraction", () => {
    expect(extractResultPhones(adapterResult(AdapterOutcome.FOUND, {
      phoneNumbers: ["09758155372"],
      body: "၀၉၇၅၈၁၅၅၃၇၂",
    }))).toEqual(["09758155372"]);
  });

  it("maps a source challenge into a user-visible blocked state", () => {
    expect(classifyAdapterResult(adapterResult(AdapterOutcome.BLOCKED, { detail: "CAPTCHA required." }))).toMatchObject({
      stateStatus: "blocked",
      eventStatus: "blocked",
    });
  });

  it("keeps MMK1053 in a safe blocked state when the verified login flow requires CAPTCHA", async () => {
    const result = await mmk1053Adapter.monitor({
      sourceUrl: "https://www.mmk1053.com/?r=mbt5717",
      sourceUsername: "configured-user",
      sourcePassword: "configured-password",
    });

    expect(result.outcome).toBe(AdapterOutcome.BLOCKED);
    expect(result.detail).toMatch(/Geetest CAPTCHA/i);
    expect(result.detail).toMatch(/No deposit, transfer, or slip confirmation/i);
  });

  it("keeps a future unknown source out of technical-field prompts", () => {
    expect(classifyAdapterResult(adapterResult(AdapterOutcome.UNSUPPORTED))).toMatchObject({
      stateStatus: "unsupported",
      eventStatus: "unsupported",
    });
  });
});

describe("generic worker behavior", () => {
  const config = {
    sourceUrl: "https://example.com/payment",
    sourceUsername: "",
    sourcePassword: "",
    telegramBotToken: "token",
    telegramChatId: "chat",
  };

  it("sets a first seen number as baseline without Telegram", async () => {
    const state = { lastPhoneNumber: null, lastStatus: "idle", events: [] as Array<Record<string, string>> };
    const notify = vi.fn();
    const save = vi.fn();
    const result = await checkOnce(config, state, {
      resolveAdapter: () => ({ id: "fixture", label: "Fixture", monitor: async () => adapterResult(AdapterOutcome.FOUND, { body: "09758155372" }) }),
      saveState: save,
      sendTelegram: notify,
    });

    expect(result).toMatchObject({ healthy: true, changed: false });
    expect(state.lastPhoneNumber).toBe("09758155372");
    expect(state.lastStatus).toBe("healthy");
    expect(notify).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledOnce();
  });

  it("notifies only when a later source result changes the number", async () => {
    const state = { lastPhoneNumber: "09758155372", lastStatus: "healthy", events: [] as Array<Record<string, string>> };
    const notify = vi.fn();
    const result = await checkOnce(config, state, {
      resolveAdapter: () => ({ id: "fixture", label: "Fixture", monitor: async () => adapterResult(AdapterOutcome.FOUND, { body: "09876543210" }) }),
      saveState: vi.fn(),
      sendTelegram: notify,
    });

    expect(result).toMatchObject({ healthy: true, changed: true });
    expect(state.lastPhoneNumber).toBe("09876543210");
    expect(notify).toHaveBeenCalledWith(config, "09876543210");
  });

  it("marks an unknown source with no recipient number as discovery pending, not a parsing error", async () => {
    const state = { lastPhoneNumber: null, lastStatus: "idle", events: [] as Array<Record<string, string>> };
    const result = await checkOnce(config, state, {
      resolveAdapter: () => ({ id: "generic-public-page", label: "Automatic public-page probe", isFallback: true, monitor: async () => adapterResult(AdapterOutcome.FOUND, { body: "No payment recipient on this page." }) }),
      saveState: vi.fn(),
      sendTelegram: vi.fn(),
    });

    expect(result.outcome).toBe(AdapterOutcome.UNSUPPORTED);
    expect(state.lastStatus).toBe("unsupported");
    expect(state.events[0]?.detail).toMatch(/no technical information is required/i);
  });
});
