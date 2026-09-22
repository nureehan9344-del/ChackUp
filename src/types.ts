export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type BMIGroup = 'ลูกค้ารายย่อย' | 'ลูกค้าทั่วไป' | 'ลูกค้ารายใหญ่';

export interface BodyCompositionRecord {
  person_id: string;
  quarter: Quarter;
  height: number | null; // cm
  weight: number | null; // kg
  muscle_mass: number | null; // kg
  bmi: number | null;
  body_fat_percentage: number | null; // %
  fat_mass: number | null; // kg
  visceral_fat: number | null; // Level (1-30)
  department?: string;
  gender?: 'M' | 'F';
  age?: number;
}

export interface PersonSummary {
  person_id: string;
  height: number;
  gender?: 'M' | 'F';
  age?: number;
  quarters: {
    Q1?: BodyCompositionRecord;
    Q2?: BodyCompositionRecord;
    Q3?: BodyCompositionRecord;
    Q4?: BodyCompositionRecord;
  };
  latestQuarter: Quarter;
  completeness: 'complete' | 'partial'; // complete if Q1, Q2, Q3, Q4 present
  // Trends (Latest vs Baseline)
  fatPercentageChange: number | null; // percentage points difference (e.g. -2.5%)
  fatPercentageChangePct: number | null; // relative % change (e.g. -8.2%)
  muscleMassChange: number | null; // kg difference (e.g. +1.2 kg)
  muscleMassChangePct: number | null; // % change in muscle mass (e.g. +4.5%)
  visceralFatChange: number | null; // level difference (e.g. -2 Lv)
  visceralFatChangePct: number | null; // % change in visceral fat (e.g. -25.0%)
  bmiChange: number | null;
  bmiChangePct: number | null;
  weightChange: number | null;
  weightChangePct: number | null;
  bmiGroup: BMIGroup;
}

export interface MetricSummary {
  metricKey: 'muscle_mass' | 'bmi' | 'body_fat_percentage' | 'fat_mass' | 'visceral_fat' | 'weight';
  labelTh: string;
  labelEn: string;
  unit: string;
  q1Avg: number | null;
  q2Avg: number | null;
  q3Avg: number | null;
  q4Avg: number | null;
  currentAvg: number;
  changeQ2ToQ3: number; // percentage change %
  changeQ1ToQ3: number; // percentage change %
  changeQ3ToQ4?: number; // percentage change %
  changeQ1ToQ4?: number; // percentage change % (Overall baseline to Q4)
  diffQ1ToQ3Val: number; // absolute difference
  diffQ2ToQ3Val: number; // absolute difference
  diffQ3ToQ4Val?: number; // absolute difference
  diffQ1ToQ4Val?: number; // absolute difference
  isPositiveImprovement: boolean; // whether the change is beneficial to health
  idealRange: string;
}

export interface FilterState {
  viewMode: 'organization' | 'individual';
  selectedQuarter: Quarter;
  selectedPersonId: string | null;
  searchQuery: string;
  bmiGroupFilter: 'all' | BMIGroup;
  completenessFilter: 'all' | 'complete' | 'partial';
  riskFilter: 'all' | 'high_visceral' | 'high_fat' | 'healthy';
}

