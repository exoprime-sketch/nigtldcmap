export function medianV146(values: number[]): number | null {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return sorted.length ? (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2 : null;
}

/** A shared zero: carbon sinks must not look like positive emissions. Zero has no bar. */
export function signedBarV146(value: number, values: number[]) {
  const min = Math.min(0, ...values.filter(Number.isFinite));
  const max = Math.max(0, ...values.filter(Number.isFinite));
  const span = Math.max(max - min, 1e-9);
  const zero = -min / span * 100;
  return { zero, left: (Math.min(0, value) - min) / span * 100, width: Math.abs(value) / span * 100, signed: min < 0 };
}
