export const toPercent = (decimal, fixed = 0) =>
  `${(decimal * 100).toFixed(fixed)}%`;
export const getPercent = (value, total) => {
  const ratio = total > 0 ? value / total : 0;

  return toPercent(ratio, 1);
};
