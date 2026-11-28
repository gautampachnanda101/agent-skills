// Polls the payment provider every 30 seconds for each open order (decision 0002).
export const INTERVAL_MS = 30_000;
export async function pollOnce(provider, orders) {
  for (const order of await orders.open()) await orders.update(order.id, await provider.status(order.paymentId));
}
