import { BodyCompositionRecord, BMIGroup, PersonSummary, Quarter } from '../types';

export const DEPARTMENTS = [
  'สำนักบริหารทั่วไป',
  'กองทรัพยากรบุคคล',
  'ฝ่ายเทคโนโลยีสารสนเทศ',
  'ฝ่ายการเงินและบัญชี',
  'กองแผนงานและวิชาการ',
  'ฝ่ายบริการสุขภาพและสุขภาวะ',
  'ศูนย์ส่งเสริมสุขอนามัย',
  'ฝ่ายปฏิบัติการสาธารณสุข'
];

/**
 * Categorize BMI according to user specification:
 * - < 18.5: ลูกค้ารายย่อย (Underweight segment)
 * - 18.5 - 22.9: ลูกค้าทั่วไป (Standard Normal segment)
 * - > 23: ลูกค้ารายใหญ่ (Overweight / High Priority segment)
 */
export function getBMIGroup(bmi: number | null): BMIGroup {
  if (bmi === null || isNaN(bmi) || bmi <= 0) return 'ลูกค้าทั่วไป';
  if (bmi < 18.5) return 'ลูกค้ารายย่อย';
  if (bmi <= 22.9) return 'ลูกค้าทั่วไป';
  return 'ลูกค้ารายใหญ่';
}

export function getBMIGroupColor(group: BMIGroup): string {
  switch (group) {
    case 'ลูกค้ารายย่อย':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'ลูกค้าทั่วไป':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'ลูกค้ารายใหญ่':
      return 'bg-rose-100 text-rose-800 border-rose-300';
  }
}

/**
 * Initial fast fallback dataset. Full 2,721 personnel dataset loads asynchronously from /dataset.json
 */
export const INITIAL_DATA: {
  records: BodyCompositionRecord[];
  persons: PersonSummary[];
} = {
  records: [
    { person_id: '43666', quarter: 'Q1', height: 160, weight: 58.8, muscle_mass: 22.5, bmi: 22.97, body_fat_percentage: 29.1, fat_mass: 17.1, visceral_fat: 5 },
    { person_id: '43666', quarter: 'Q2', height: 160, weight: 60.3, muscle_mass: 22.2, bmi: 23.55, body_fat_percentage: 31.8, fat_mass: 19.2, visceral_fat: 7 },
    { person_id: '43666', quarter: 'Q3', height: 160, weight: 56.6, muscle_mass: 21.7, bmi: 22.11, body_fat_percentage: 29.1, fat_mass: 16.5, visceral_fat: 6 },
    { person_id: '43666', quarter: 'Q4', height: 160, weight: 55.8, muscle_mass: 22.1, bmi: 21.80, body_fat_percentage: 28.2, fat_mass: 15.7, visceral_fat: 5 },
    { person_id: '42075', quarter: 'Q1', height: 162, weight: 58.8, muscle_mass: 22.2, bmi: 22.41, body_fat_percentage: 30.2, fat_mass: 17.8, visceral_fat: 7 },
    { person_id: '42075', quarter: 'Q2', height: 162, weight: 58.8, muscle_mass: 22.0, bmi: 22.41, body_fat_percentage: 31.2, fat_mass: 18.4, visceral_fat: 7 },
    { person_id: '42075', quarter: 'Q3', height: 162, weight: 58.0, muscle_mass: 21.9, bmi: 22.10, body_fat_percentage: 30.7, fat_mass: 17.8, visceral_fat: 7 },
    { person_id: '42075', quarter: 'Q4', height: 162, weight: 57.2, muscle_mass: 22.3, bmi: 21.79, body_fat_percentage: 29.8, fat_mass: 17.0, visceral_fat: 6 },
  ],
  persons: [
    {
      person_id: '43666',
      height: 160,
      quarters: {
        Q1: { person_id: '43666', quarter: 'Q1', height: 160, weight: 58.8, muscle_mass: 22.5, bmi: 22.97, body_fat_percentage: 29.1, fat_mass: 17.1, visceral_fat: 5 },
        Q2: { person_id: '43666', quarter: 'Q2', height: 160, weight: 60.3, muscle_mass: 22.2, bmi: 23.55, body_fat_percentage: 31.8, fat_mass: 19.2, visceral_fat: 7 },
        Q3: { person_id: '43666', quarter: 'Q3', height: 160, weight: 56.6, muscle_mass: 21.7, bmi: 22.11, body_fat_percentage: 29.1, fat_mass: 16.5, visceral_fat: 6 },
        Q4: { person_id: '43666', quarter: 'Q4', height: 160, weight: 55.8, muscle_mass: 22.1, bmi: 21.80, body_fat_percentage: 28.2, fat_mass: 15.7, visceral_fat: 5 },
      },
      latestQuarter: 'Q4',
      completeness: 'complete',
      fatPercentageChange: -0.9,
      fatPercentageChangePct: -3.09,
      muscleMassChange: -0.4,
      muscleMassChangePct: -1.78,
      visceralFatChange: 0,
      visceralFatChangePct: 0.0,
      bmiChange: -1.17,
      bmiChangePct: -5.09,
      weightChange: -3.0,
      weightChangePct: -5.10,
      bmiGroup: 'ลูกค้าทั่วไป'
    },
    {
      person_id: '42075',
      height: 162,
      quarters: {
        Q1: { person_id: '42075', quarter: 'Q1', height: 162, weight: 58.8, muscle_mass: 22.2, bmi: 22.41, body_fat_percentage: 30.2, fat_mass: 17.8, visceral_fat: 7 },
        Q2: { person_id: '42075', quarter: 'Q2', height: 162, weight: 58.8, muscle_mass: 22.0, bmi: 22.41, body_fat_percentage: 31.2, fat_mass: 18.4, visceral_fat: 7 },
        Q3: { person_id: '42075', quarter: 'Q3', height: 162, weight: 58.0, muscle_mass: 21.9, bmi: 22.10, body_fat_percentage: 30.7, fat_mass: 17.8, visceral_fat: 7 },
        Q4: { person_id: '42075', quarter: 'Q4', height: 162, weight: 57.2, muscle_mass: 22.3, bmi: 21.79, body_fat_percentage: 29.8, fat_mass: 17.0, visceral_fat: 6 },
      },
      latestQuarter: 'Q4',
      completeness: 'complete',
      fatPercentageChange: -0.4,
      fatPercentageChangePct: -1.32,
      muscleMassChange: 0.1,
      muscleMassChangePct: 0.45,
      visceralFatChange: -1,
      visceralFatChangePct: -14.29,
      bmiChange: -0.62,
      bmiChangePct: -2.77,
      weightChange: -1.6,
      weightChangePct: -2.72,
      bmiGroup: 'ลูกค้าทั่วไป'
    }
  ]
};
