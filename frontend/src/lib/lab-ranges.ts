// Reference ranges for the lab tests in the sample data. A value outside the
// range is "watch"; beyond the critical limit it is "critical" and raises an
// attention item. Illustrative thresholds for the demo, not clinical guidance.

export type LabFlag = "normal" | "watch" | "critical";

interface Range {
  low?: number;
  high?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

const RANGES: Record<string, Range> = {
  hba1c: { high: 6.5, criticalHigh: 9 },
  tsh: { low: 0.4, high: 4, criticalHigh: 10 },
  "free t4": { low: 0.8, high: 1.8 },
  "ldl cholesterol": { high: 130, criticalHigh: 190 },
  "troponin i": { high: 0.04, criticalHigh: 0.4 },
  bnp: { high: 100, criticalHigh: 500 },
  "wbc count": { low: 4, high: 11, criticalHigh: 20 },
  "fasting glucose": { low: 70, high: 126, criticalHigh: 250 },
  "total ige": { high: 100 },
  "serum creatinine": { high: 1.3, criticalHigh: 4 },
  "serum potassium": { low: 3.5, high: 5, criticalLow: 2.8, criticalHigh: 6 },
  "uric acid": { high: 7 },
};

export interface LabAssessment {
  flag: LabFlag;
  direction: "high" | "low" | null;
}

export function assessLab(testName: string, result: string | null): LabAssessment {
  const value = result === null ? NaN : Number(result);
  const range = RANGES[testName.trim().toLowerCase()];
  if (!range || Number.isNaN(value)) return { flag: "normal", direction: null };

  if (range.criticalHigh !== undefined && value >= range.criticalHigh) return { flag: "critical", direction: "high" };
  if (range.criticalLow !== undefined && value <= range.criticalLow) return { flag: "critical", direction: "low" };
  if (range.high !== undefined && value > range.high) return { flag: "watch", direction: "high" };
  if (range.low !== undefined && value < range.low) return { flag: "watch", direction: "low" };
  return { flag: "normal", direction: null };
}
