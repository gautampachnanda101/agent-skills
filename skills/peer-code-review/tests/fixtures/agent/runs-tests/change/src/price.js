// Applies a percentage discount.
export function discounted(cents, percent) {
  return cents * (100 - percent) / 100;
}
