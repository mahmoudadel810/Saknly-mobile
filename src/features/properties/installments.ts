/**
 * The monthly payment of an amortised loan, as on the web's calculator; with a 0% rate it is the
 * remainder split evenly. Returns null when there is no period to spread it over.
 */
export const monthlyPayment = (
  principal: number,
  annualRatePercent: number,
  years: number,
): number | null => {
  const months = Math.round(years * 12);
  if (!(months > 0) || !(principal >= 0)) return null;
  if (!(annualRatePercent > 0)) return principal / months;
  const r = annualRatePercent / 100 / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
};
