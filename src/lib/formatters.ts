export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("en-US").format(num);
};

export const formatStat = (value: number | string | null | undefined): string => {
  return formatNumber(value);
};

export const formatCurrency = (value: number | string | null | undefined): string => {
  return formatNumber(value);
};
