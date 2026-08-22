import { directPaymentPageAdapter } from "./direct-payment-page.mjs";
import { mmk1053Adapter } from "./mmk1053.mjs";

const knownAdapters = [mmk1053Adapter];
const adapters = new Map([...knownAdapters, directPaymentPageAdapter].map(adapter => [adapter.id, adapter]));

export function resolveAdapter(sourceUrl) {
  return knownAdapters.find(adapter => adapter.matchesSource(sourceUrl)) ?? directPaymentPageAdapter;
}

export function getAdapter(adapterId) {
  const adapter = adapters.get(adapterId);
  if (!adapter) throw new Error(`Unsupported site adapter: ${adapterId}`);
  return adapter;
}

export function describeSource(sourceUrl) {
  const adapter = resolveAdapter(sourceUrl);
  return { id: adapter.id, label: adapter.label, automatic: true };
}
