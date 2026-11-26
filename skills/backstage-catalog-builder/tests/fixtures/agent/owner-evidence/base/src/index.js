// Reads ledger entries from the queue and writes them to the warehouse.
export async function sync(queue, warehouse) {
  for await (const entry of queue) await warehouse.write(entry);
}
