import { AdapterOutcome, adapterResult } from "./contracts.mjs";

/**
 * MMK1053 is recognized automatically from the source URL. The verified
 * encrypted login path currently returns a Geetest CAPTCHA requirement, so
 * this adapter reports that constraint rather than attempting to bypass it.
 * It never submits a payment order, transfer, proof, reference, or slip ID.
 */
export const mmk1053Adapter = {
  id: "mmk1053",
  label: "MMK1053 main source",
  matchesSource(sourceUrl) {
    try {
      return /(^|\.)mmk1053\.com$/i.test(new URL(sourceUrl).hostname);
    } catch {
      return false;
    }
  },
  async monitor(config) {
    if (!config.sourceUsername || !config.sourcePassword) {
      return adapterResult(AdapterOutcome.BLOCKED, {
        detail: "MMK1053 source is recognized. Add the source account username and password to create an authenticated session.",
      });
    }

    return adapterResult(AdapterOutcome.BLOCKED, {
      detail: "MMK1053 source is recognized, but its verified encrypted login currently requires a Geetest CAPTCHA before a session can be created. No deposit, transfer, or slip confirmation was attempted.",
    });
  },
};
