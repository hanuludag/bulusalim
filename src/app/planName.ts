// "Aynı grupla yeni plan" için varsayılan oda adı.
/** "Cumartesi ekibi" → "Cumartesi ekibi 2", "… 2" → "… 3" */
export function nextPlanName(name: string): string {
  const m = name.trim().match(/^(.*\S)\s+(\d+)$/);
  if (m) return `${m[1]} ${Number(m[2]) + 1}`;
  return `${name.trim()} 2`;
}
