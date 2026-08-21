import { BodyCompositionRecord, BMIGroup, MetricSummary, PersonSummary, Quarter } from '../types';
import { getBMIGroup } from './dataset';

export function calculateQuarterAverages(records: BodyCompositionRecord[], quarter: Quarter) {
  const quarterRecords = records.filter(r => r.quarter === quarter);
  if (quarterRecords.length === 0) {
    return {
      count: 0,
      muscle_mass: null,
      bmi: null,
      body_fat_percentage: null,
      fat_mass: null,
      visceral_fat: null,
      weight: null,
    };
  }

  const validMuscle = quarterRecords.map(r => r.muscle_mass).filter((v): v is number => v !== null);
  const validBmi = quarterRecords.map(r => r.bmi).filter((v): v is number => v !== null);
  const validFatPct = quarterRecords.map(r => r.body_fat_percentage).filter((v): v is number => v !== null);
  const validFatMass = quarterRecords.map(r => r.fat_mass).filter((v): v is number => v !== null);
  const validVisceral = quarterRecords.map(r => r.visceral_fat).filter((v): v is number => v !== null);
  const validWeight = quarterRecords.map(r => r.weight).filter((v): v is number => v !== null);

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  return {
    count: quarterRecords.length,
    muscle_mass: avg(validMuscle),
    bmi: avg(validBmi),
    body_fat_percentage: avg(validFatPct),
    fat_mass: avg(validFatMass),
    visceral_fat: avg(validVisceral),
    weight: avg(validWeight),
  };
}

export function computeMetricSummaries(records: BodyCompositionRecord[]): MetricSummary[] {
  const q1 = calculateQuarterAverages(records, 'Q1');
  const q2 = calculateQuarterAverages(records, 'Q2');
  const q3 = calculateQuarterAverages(records, 'Q3');

  const createSummary = (
    key: 'muscle_mass' | 'bmi' | 'body_fat_percentage' | 'fat_mass' | 'visceral_fat' | 'weight',
    labelTh: string,
    labelEn: string,
    unit: string,
    idealRange: string,
    higherIsBetter: boolean
  ): MetricSummary => {
    const q1Val = q1[key];
    const q2Val = q2[key];
    const q3Val = q3[key];
    const current = q3Val ?? q2Val ?? q1Val ?? 0;

    const diffQ2ToQ3Val = (q3Val !== null && q2Val !== null)
      ? Number((q3Val - q2Val).toFixed(2))
      : 0;

    const diffQ1ToQ3Val = (q3Val !== null && q1Val !== null)
      ? Number((q3Val - q1Val).toFixed(2))
      : 0;

    const changeQ2ToQ3 = (q3Val !== null && q2Val !== null && q2Val !== 0)
      ? Number(((q3Val - q2Val) / q2Val * 100).toFixed(2))
      : 0;

    const changeQ1ToQ3 = (q3Val !== null && q1Val !== null && q1Val !== 0)
      ? Number(((q3Val - q1Val) / q1Val * 100).toFixed(2))
      : 0;

    const isPositiveImprovement = higherIsBetter ? (diffQ1ToQ3Val >= 0) : (diffQ1ToQ3Val <= 0);

    return {
      metricKey: key,
      labelTh,
      labelEn,
      unit,
      q1Avg: q1Val !== null ? Number(q1Val.toFixed(2)) : null,
      q2Avg: q2Val !== null ? Number(q2Val.toFixed(2)) : null,
      q3Avg: q3Val !== null ? Number(q3Val.toFixed(2)) : null,
      currentAvg: Number(current.toFixed(2)),
      changeQ2ToQ3,
      changeQ1ToQ3,
      diffQ1ToQ3Val,
      diffQ2ToQ3Val,
      isPositiveImprovement,
      idealRange
    };
  };

  return [
    createSummary('muscle_mass', 'มวลกล้ามเนื้อ', 'Muscle Mass', 'kg', '20.0 - 35.0 kg', true),
    createSummary('bmi', 'ดัชนีมวลกาย', 'BMI', 'kg/m²', '18.5 - 22.9 kg/m²', false),
    createSummary('body_fat_percentage', 'เปอร์เซ็นต์ไขมัน', 'Body Fat %', '%', '10.0 - 24.9%', false),
    createSummary('fat_mass', 'มวลไขมัน', 'Fat Mass', 'kg', '10.0 - 18.0 kg', false),
    createSummary('visceral_fat', 'ไขมันช่องท้อง', 'Visceral Fat', 'Level', '1 - 9 Level', false),
  ];
}

export interface BMIDistributionQuarter {
  quarter: Quarter;
  'ลูกค้ารายย่อย': number; // < 18.5
  'ลูกค้าทั่วไป': number;  // 18.5 - 22.9
  'ลูกค้ารายใหญ่': number;  // > 23
  'ลูกค้ารายย่อยPct': number;
  'ลูกค้าทั่วไปPct': number;
  'ลูกค้ารายใหญ่Pct': number;
  total: number;
}

export function computeBMIDistributionByQuarter(records: BodyCompositionRecord[]): BMIDistributionQuarter[] {
  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3'];

  return quarters.map(q => {
    const qRecords = records.filter(r => r.quarter === q && r.bmi !== null);
    let under = 0; // < 18.5
    let normal = 0; // 18.5 - 22.9
    let over = 0; // > 23

    qRecords.forEach(r => {
      const group = getBMIGroup(r.bmi);
      if (group === 'ลูกค้ารายย่อย') under++;
      else if (group === 'ลูกค้าทั่วไป') normal++;
      else over++;
    });

    const total = qRecords.length;
    const underPct = total > 0 ? Number(((under / total) * 100).toFixed(1)) : 0;
    const normalPct = total > 0 ? Number(((normal / total) * 100).toFixed(1)) : 0;
    const overPct = total > 0 ? Number(((over / total) * 100).toFixed(1)) : 0;

    return {
      quarter: q,
      'ลูกค้ารายย่อย': under,
      'ลูกค้าทั่วไป': normal,
      'ลูกค้ารายใหญ่': over,
      'ลูกค้ารายย่อยPct': underPct,
      'ลูกค้าทั่วไปPct': normalPct,
      'ลูกค้ารายใหญ่Pct': overPct,
      total,
    };
  });
}

export interface QuarterParticipationSummary {
  totalPersons: number;
  moreThanTwoQuartersCount: number; // > 2 quarters (i.e. exactly 3 quarters)
  moreThanTwoQuartersPercentage: number;
  threeQuartersCount: number; // all 3 quarters
  threeQuartersPercentage: number;
  twoQuartersCount: number; // exactly 2 quarters
  twoQuartersPercentage: number;
  oneQuarterCount: number; // exactly 1 quarter
  oneQuarterPercentage: number;
  atLeastTwoQuartersCount: number; // >= 2 quarters
  atLeastTwoQuartersPercentage: number;
  threeQuartersPersonIds: string[];
  twoQuartersPersonIds: string[];
  oneQuarterPersonIds: string[];
}

export interface BMITransitionItem {
  person_id: string;
  initialQuarter: Quarter;
  initialBmi: number;
  initialGroup: BMIGroup;
  latestQuarter: Quarter;
  latestBmi: number;
  latestGroup: BMIGroup;
  changeType: 'improved' | 'worsened' | 'unchanged';
  bmiDiff: number;
  bmiDiffPct: number;
  description: string;
  totalQuartersCount: number;
}

export interface BMITransitionAnalysis {
  totalQualified: number; // total people with data in >= 2 quarters
  changedCount: number; // people whose BMI group changed
  changedPercentage: number; // % of qualified who changed group
  improvedCount: number; // positive transition (e.g. รายใหญ่ -> ทั่วไป, รายย่อย -> ทั่วไป)
  improvedPercentage: number;
  worsenedCount: number; // negative transition (e.g. ทั่วไป -> รายใหญ่, ทั่วไป -> รายย่อย)
  worsenedPercentage: number;
  unchangedCount: number;
  unchangedPercentage: number;
  transitions: BMITransitionItem[];
  changedTransitions: BMITransitionItem[];
  improvedTransitions: BMITransitionItem[];
  worsenedTransitions: BMITransitionItem[];
  quarterParticipation: QuarterParticipationSummary;
}

export function computeBMITransitionAnalysis(persons: PersonSummary[]): BMITransitionAnalysis {
  const quartersOrder: Quarter[] = ['Q1', 'Q2', 'Q3'];
  const qualifiedTransitions: BMITransitionItem[] = [];

  const threeQuartersPersonIds: string[] = [];
  const twoQuartersPersonIds: string[] = [];
  const oneQuarterPersonIds: string[] = [];

  persons.forEach((person) => {
    // Collect all quarters where the person has recorded BMI
    const availableQuarters = quartersOrder.filter(
      (q) => person.quarters[q] && person.quarters[q]?.bmi !== null && !isNaN(person.quarters[q]!.bmi!)
    );

    const qCount = availableQuarters.length;
    if (qCount >= 3) {
      threeQuartersPersonIds.push(person.person_id);
    } else if (qCount === 2) {
      twoQuartersPersonIds.push(person.person_id);
    } else if (qCount === 1) {
      oneQuarterPersonIds.push(person.person_id);
    }

    // Only consider persons who have data in at least 2 quarters
    if (qCount >= 2) {
      const initialQuarter = availableQuarters[0];
      const latestQuarter = availableQuarters[availableQuarters.length - 1];

      const initialRec = person.quarters[initialQuarter]!;
      const latestRec = person.quarters[latestQuarter]!;

      const initialBmi = Number(initialRec.bmi!.toFixed(2));
      const latestBmi = Number(latestRec.bmi!.toFixed(2));

      const initialGroup = getBMIGroup(initialBmi);
      const latestGroup = getBMIGroup(latestBmi);

      const bmiDiff = Number((latestBmi - initialBmi).toFixed(2));
      const bmiDiffPct = initialBmi > 0 ? Number(((bmiDiff / initialBmi) * 100).toFixed(1)) : 0;

      let changeType: 'improved' | 'worsened' | 'unchanged' = 'unchanged';
      let description = `คงที่ในกลุ่ม ${latestGroup}`;

      if (initialGroup !== latestGroup) {
        if (
          (initialGroup === 'ลูกค้ารายใหญ่' && latestGroup === 'ลูกค้าทั่วไป') ||
          (initialGroup === 'ลูกค้ารายย่อย' && latestGroup === 'ลูกค้าทั่วไป')
        ) {
          changeType = 'improved';
          description = `พัฒนาดีขึ้น: จาก ${initialGroup} → ${latestGroup} (สมส่วน)`;
        } else if (
          (initialGroup === 'ลูกค้าทั่วไป' && latestGroup === 'ลูกค้ารายใหญ่') ||
          (initialGroup === 'ลูกค้าทั่วไป' && latestGroup === 'ลูกค้ารายย่อย') ||
          (initialGroup === 'ลูกค้ารายย่อย' && latestGroup === 'ลูกค้ารายใหญ่')
        ) {
          changeType = 'worsened';
          description = `ควรเฝ้าระวัง: จาก ${initialGroup} → ${latestGroup}`;
        } else {
          changeType = 'improved';
          description = `เปลี่ยนจาก ${initialGroup} → ${latestGroup}`;
        }
      }

      qualifiedTransitions.push({
        person_id: person.person_id,
        initialQuarter,
        initialBmi,
        initialGroup,
        latestQuarter,
        latestBmi,
        latestGroup,
        changeType,
        bmiDiff,
        bmiDiffPct,
        description,
        totalQuartersCount: qCount,
      });
    }
  });

  const totalPersons = persons.length;
  const threeQuartersCount = threeQuartersPersonIds.length;
  const twoQuartersCount = twoQuartersPersonIds.length;
  const oneQuarterCount = oneQuarterPersonIds.length;
  const atLeastTwoQuartersCount = threeQuartersCount + twoQuartersCount;
  const moreThanTwoQuartersCount = threeQuartersCount; // > 2 quarters is exactly 3 quarters

  const quarterParticipation: QuarterParticipationSummary = {
    totalPersons,
    moreThanTwoQuartersCount,
    moreThanTwoQuartersPercentage: totalPersons > 0 ? Number(((moreThanTwoQuartersCount / totalPersons) * 100).toFixed(1)) : 0,
    threeQuartersCount,
    threeQuartersPercentage: totalPersons > 0 ? Number(((threeQuartersCount / totalPersons) * 100).toFixed(1)) : 0,
    twoQuartersCount,
    twoQuartersPercentage: totalPersons > 0 ? Number(((twoQuartersCount / totalPersons) * 100).toFixed(1)) : 0,
    oneQuarterCount,
    oneQuarterPercentage: totalPersons > 0 ? Number(((oneQuarterCount / totalPersons) * 100).toFixed(1)) : 0,
    atLeastTwoQuartersCount,
    atLeastTwoQuartersPercentage: totalPersons > 0 ? Number(((atLeastTwoQuartersCount / totalPersons) * 100).toFixed(1)) : 0,
    threeQuartersPersonIds,
    twoQuartersPersonIds,
    oneQuarterPersonIds,
  };

  const totalQualified = qualifiedTransitions.length;
  const changedTransitions = qualifiedTransitions.filter((t) => t.changeType !== 'unchanged');
  const improvedTransitions = qualifiedTransitions.filter((t) => t.changeType === 'improved');
  const worsenedTransitions = qualifiedTransitions.filter((t) => t.changeType === 'worsened');
  const unchangedTransitions = qualifiedTransitions.filter((t) => t.changeType === 'unchanged');

  const changedCount = changedTransitions.length;
  const improvedCount = improvedTransitions.length;
  const worsenedCount = worsenedTransitions.length;
  const unchangedCount = unchangedTransitions.length;

  const changedPercentage = totalQualified > 0 ? Number(((changedCount / totalQualified) * 100).toFixed(1)) : 0;
  const improvedPercentage = totalQualified > 0 ? Number(((improvedCount / totalQualified) * 100).toFixed(1)) : 0;
  const worsenedPercentage = totalQualified > 0 ? Number(((worsenedCount / totalQualified) * 100).toFixed(1)) : 0;
  const unchangedPercentage = totalQualified > 0 ? Number(((unchangedCount / totalQualified) * 100).toFixed(1)) : 0;

  return {
    totalQualified,
    changedCount,
    changedPercentage,
    improvedCount,
    improvedPercentage,
    worsenedCount,
    worsenedPercentage,
    unchangedCount,
    unchangedPercentage,
    transitions: qualifiedTransitions,
    changedTransitions,
    improvedTransitions,
    worsenedTransitions,
    quarterParticipation,
  };
}

export function computeLeaderboards(persons: PersonSummary[]) {
  // Only consider persons who have data in both Q1 (or Q2) and Q3
  const qualifiedPersons = persons.filter(p => p.quarters.Q3 && (p.quarters.Q1 || p.quarters.Q2));

  // 1. Top Fat Loss (% Body Fat reduced most)
  const topFatLoss = [...qualifiedPersons]
    .filter(p => p.fatPercentageChange !== null && p.fatPercentageChange < 0)
    .sort((a, b) => {
      // Prioritize largest percentage reduction
      const pctA = a.fatPercentageChangePct ?? 0;
      const pctB = b.fatPercentageChangePct ?? 0;
      return pctA - pctB;
    })
    .slice(0, 10);

  // 2. Top Muscle Gain (Muscle mass % increased most)
  const topMuscleGain = [...qualifiedPersons]
    .filter(p => p.muscleMassChange !== null && p.muscleMassChange > 0)
    .sort((a, b) => {
      const pctA = a.muscleMassChangePct ?? 0;
      const pctB = b.muscleMassChangePct ?? 0;
      return pctB - pctA;
    })
    .slice(0, 10);

  // 3. Top Visceral Fat Reduction
  const topVisceralLoss = [...qualifiedPersons]
    .filter(p => p.visceralFatChange !== null && p.visceralFatChange < 0)
    .sort((a, b) => {
      const pctA = a.visceralFatChangePct ?? 0;
      const pctB = b.visceralFatChangePct ?? 0;
      return pctA - pctB;
    })
    .slice(0, 10);

  return {
    topFatLoss,
    topMuscleGain,
    topVisceralLoss,
  };
}

