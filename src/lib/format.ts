const gradeFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const coefFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});

/** Note au format français avec virgule, suffixée /20. */
export function formatGrade(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }
  return `${gradeFormatter.format(value)}/20`;
}

/** Valeur numérique brute au format français, sans suffixe. */
export function formatNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }
  return gradeFormatter.format(value);
}

/** Coefficient : « 1,5 » plutôt que « 1.5 ». */
export function formatCoefficient(value: number): string {
  return coefFormatter.format(value);
}
