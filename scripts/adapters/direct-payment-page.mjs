import { AdapterOutcome, adapterResult, assertReadOnlyRequest } from "./contracts.mjs";

export const directPaymentPageAdapter = {
  id: "generic-public-page",
  label: "Automatic public-page probe",
  isFallback: true,
  matchesSource() {
    return false;
  },
  async monitor(config) {
    const sourceUrl = assertReadOnlyRequest(config.sourceUrl);
    const response = await fetch(sourceUrl, {
      headers: {
        "user-agent": "AutomationTestyMonitor/2.0 (+https://github.com/ccorryxx-bot/automation-testy)",
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "cache-control": "no-cache",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(25_000),
    });

    const body = await response.text();
    if (!response.ok) {
      return adapterResult(AdapterOutcome.ERROR, {
        statusCode: response.status,
        finalUrl: response.url,
        detail: `The source returned HTTP ${response.status}.`,
      });
    }

    if (/order\s+has\s+expired|order\s+expired|expired\s+order/i.test(body)) {
      return adapterResult(AdapterOutcome.EXPIRED, {
        statusCode: response.status,
        finalUrl: response.url,
        detail: "The payment target reported an expired order.",
      });
    }

    return adapterResult(AdapterOutcome.FOUND, {
      statusCode: response.status,
      finalUrl: response.url,
      body,
      detail: "Automatic public-page source check completed.",
    });
  },
};
