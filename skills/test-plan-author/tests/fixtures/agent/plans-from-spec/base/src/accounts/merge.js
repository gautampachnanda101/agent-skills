// Merges the newer account into the older one.
export function merge(store, olderId, newerId, actor) {
  if (!actor.roles.includes('support-lead')) {
    const error = new Error('forbidden');
    error.status = 403;
    throw error;
  }
  const older = store.get(olderId);
  const newer = store.get(newerId);
  older.orders.push(...newer.orders);
  newer.orders = [];
  newer.closed = true;
  newer.mergedInto = olderId;
  return older;
}
