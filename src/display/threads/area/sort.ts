export const sortMonthBin = (a: string, b: string) => {
  const c = a.split("-");
  const aMonth = Number.parseInt(c[1]);
  const aYear = Number.parseInt(c[0]);
  const d = b.split("-");
  const bMonth = Number.parseInt(d[1]);
  const bYear = Number.parseInt(d[0]);
  if (aYear != bYear) return aYear - bYear;
  return aMonth - bMonth;
};
