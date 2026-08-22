export const directPaymentPageAdapter = {
  id: "direct-payment-page",
  label: "Direct payment page",
  async fetchTarget(config) {
    const response = await fetch(config.sourceUrl, {
      headers: {
        "user-agent": "AutomationTestyMonitor/1.0 (+https://github.com/)",
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "cache-control": "no-cache",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(25_000),
    });

    const body = await response.text();
    return { statusCode: response.status, finalUrl: response.url, body, expired: /order\s+has\s+expired|order\s+expired|expired\s+order/i.test(body) };
  },
};
