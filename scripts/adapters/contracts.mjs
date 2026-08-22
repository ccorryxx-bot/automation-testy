const UNSAFE_OPERATION_PATTERN = /(submit|confirm|confirmation|slip|reference|proof|upload|transfer|wallettransfer|manualtransfer)/i;

export const AdapterOutcome = Object.freeze({
  FOUND: "found",
  BLOCKED: "blocked",
  UNSUPPORTED: "unsupported",
  EXPIRED: "expired",
  ERROR: "error",
});

export function assertReadOnlyRequest(url) {
  const parsed = new URL(url);
  if (UNSAFE_OPERATION_PATTERN.test(`${parsed.pathname}${parsed.search}`)) {
    throw new Error("Read-only safety guard rejected a payment-confirmation or transfer endpoint.");
  }
  return parsed;
}

export function adapterResult(outcome, fields = {}) {
  return {
    outcome,
    statusCode: fields.statusCode ?? null,
    body: fields.body ?? "",
    phoneNumbers: Array.isArray(fields.phoneNumbers) ? fields.phoneNumbers : [],
    finalUrl: fields.finalUrl ?? null,
    detail: fields.detail ?? "",
  };
}
