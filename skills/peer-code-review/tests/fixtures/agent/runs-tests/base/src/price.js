// Applies a percentage discount and rounds to whole cents.
export function discounted(cents, percent) {
  return Math.round(cents * (100 - percent) / 100);
}
