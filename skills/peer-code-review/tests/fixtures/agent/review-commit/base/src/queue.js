// Delivers each message, retrying up to three times before giving up.
export async function deliver(send, message) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await send(message);
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
}
