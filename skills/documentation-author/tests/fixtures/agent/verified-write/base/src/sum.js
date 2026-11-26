export function sum(...values) {
  for (const value of values) {
    if (typeof value !== 'number' || Number.isNaN(value)) throw new TypeError(`not a number: ${value}`);
  }
  return values.reduce((total, value) => total + value, 0);
}
