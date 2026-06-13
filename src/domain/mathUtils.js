export const round3 = (v) => parseFloat(v.toFixed(3));

export const clamp = (v, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const n = Number(v) || 0;
  if (n < min) return min;
  if (n > max) return max;
  return n;
};
