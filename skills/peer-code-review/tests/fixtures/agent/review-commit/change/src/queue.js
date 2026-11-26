// Delivers each message, retrying until it succeeds.
export async function deliver(send, message) {
  while (true) {
    try {
      return await send(message);
    } catch (error) {
      // ignore and try again
    }
  }
}
