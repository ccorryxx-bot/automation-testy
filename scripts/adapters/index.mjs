import { directPaymentPageAdapter } from "./direct-payment-page.mjs";
import { mmk1053Adapter } from "./mmk1053.mjs";

const adapters = new Map([
  [directPaymentPageAdapter.id, directPaymentPageAdapter],
  [mmk1053Adapter.id, mmk1053Adapter],
]);

export function getAdapter(adapterId) {
  const adapter = adapters.get(adapterId);
  if (!adapter) throw new Error(`Unsupported site adapter: ${adapterId}`);
  return adapter;
}

export function listAdapters() {
  return [...adapters.values()].map(({ id, label }) => ({ id, label }));
}
