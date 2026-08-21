import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Heart,
  Dumbbell,
  Activity,
  Flame,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Percent,
  CheckCircle2,
  AlertCircle,
  Users,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { MetricSummary, PersonSummary, Quarter } from '../types';
import { computeBMITransitionAnalysis } from '../data/analytics';

interface ExecutiveSummaryProps {
  summaries: MetricSummary[];
  activeQuarter: Quarter;
  totalPersonnel: number;
  persons?: PersonSummary[];
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  summaries,
  activeQuarter,
  totalPersonnel,
  persons = [],
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Compute BMI Transition statistics for persons with >= 2 quarters
  const transitionAnalysis = computeBMITransitionAnalysis(persons);

  const getMetricDetails = (key: string) => {
    switch (key) {
      case 'muscle_mass':
        return {
          icon: <Dumbbell className="h-5 w-5 text-blue-600" />,
          colorClass: 'blue',
          borderClass: 'border-blue-200 hover:border-blue-400',
          badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
          goalText: 'เป้าหมาย: เพิ่มขึ้น (ยิ่งมากยิ่งดี)',
          explanation: 'มวลกล้ามเนื้อช่วยเพิ่มอัตราการเผาผลาญพลังงาน (BMR) และเสริมความแข็งแรงของระบบกระดูกและข้อ',
          statusCheck: (val: number) => val >= 20 ? 'อยู่ในเกณฑ์มาตรฐาน (ปกติ)' : 'ต่ำกว่าเกณฑ์มาตรฐาน',
        };
      case 'bmi':
        return {
          icon: <Activity className="h-5 w-5 text-orange-600" />,
          colorClass: 'orange',
          borderClass: 'border-orange-200 hover:border-orange-400',
          badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
          goalText: 'เป้าหมาย: 18.5 - 22.9 kg/m² (สมส่วน)',
          explanation: 'ดัชนีมวลกายบอกความสมดุลระหว่างน้ำหนักและส่วนสูง โดยเกณฑ์เอเชีย ค่ามาตรฐานคือ 18.5 - 22.9',
          statusCheck: (val: number) => (val >= 18.5 && val <= 22.9) ? 'สมส่วน (เกณฑ์มาตรฐาน)' : val > 22.9 ? 'น้ำหนักเกินเกณฑ์ (เฝ้าระวัง)' : 'น้ำหนักต่ำกว่าเกณฑ์',
        };
      case 'body_fat_percentage':
        return {
          icon: <Flame className="h-5 w-5 text-amber-500" />,
          colorClass: 'amber',
          borderClass: 'border-amber-200 hover:border-amber-400',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          goalText: 'เป้าหมาย: ลดลงสู่วัยมาตรฐาน (10-24%)',
          explanation: 'สัดส่วนไขมันสะสมในร่างกาย การลดลงของ % ไขมันช่วยให้รูปร่างกระชับและลดความดันโลหิต',
          statusCheck: (val: number) => val <= 25 ? 'อยู่ในเกณฑ์สุขภาพดี' : 'เกินเกณฑ์มาตรฐาน (ควรลดไขมัน)',
        };
      case 'fat_mass':
        return {
          icon: <Heart className="h-5 w-5 text-emerald-600" />,
          colorClass: 'emerald',
          borderClass: 'border-emerald-200 hover:border-emerald-400',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          goalText: 'เป้าหมาย: ลดลง (10 - 18 kg)',
          explanation: 'น้ำหนักไขมันรวมในร่างกาย การลดมวลไขมันส่วนเกินช่วยลดภาระการทำงานของหัวใจและหลอดเลือด',
          statusCheck: (val: number) => val <= 18 ? 'อยู่ในเกณฑ์เหมาะสม' : 'ไขมันสะสมสูงกว่าปกติ',
        };
      case 'visceral_fat':
        return {
          icon: <ShieldAlert className="h-5 w-5 text-rose-600" />,
          colorClass: 'rose',
          borderClass: 'border-rose-200 hover:border-rose-400',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
          goalText: 'เป้าหมาย: ลดลงปลอดภัย (1 - 9 Level)',
          explanation: 'ไขมันที่เกาะรอบอวัยวะภายในช่องท้อง เป็นตัวบ่งชี้สำคัญที่สุดของความเสี่ยงโรคหัวใจ เบาหวาน และ NCDs',
          statusCheck: (val: number) => val <= 9 ? 'ปลอดภัย (Safe Zone)' : 'เสี่ยงโรคหลอดเลือด (>9 Lv)',
        };
      default:
        return {
          icon: <Activity className="h-5 w-5 text-slate-600" />,
          colorClass: 'slate',
          borderClass: 'border-slate-200',
          badgeClass: 'bg-slate-50 text-slate-800 border-slate-200',
          goalText: 'เป้าหมายมาตรฐาน',
          explanation: 'ตัวชี้วัดสุขภาพของร่างกาย',
          statusCheck: () => 'ปกติ',
        };
    }
  };

  return (
    <section className="mb-8">
      {/* Header section with plain-language title and toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Executive Summary : สรุปภาพรวม 5 ตัวชี้วัดหลัก
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-md shadow-xs">
              ไตรมาสล่าสุด (Q3)
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md flex items-center gap-1">
              <Percent className="w-3 h-3" />
              เปรียบเทียบผลการเปลี่ยนแปลง (%)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            สรุปผลการประเมินสุขภาพเฉลี่ยของบุคลากรทั้งองค์กร ({totalPersonnel} ท่าน) เปรียบเทียบผลจากจุดเริ่มต้น (Q1) สู่ไตรมาสล่าสุด (Q3)
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode('cards')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'cards'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>มุมมองการ์ด (เข้าใจง่าย)</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'table'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>มุมมองตารางสรุป</span>
          </button>
        </div>
      </div>

      {/* Special Highlights Bar: 1) Key Takeaway & 2) BMI Transition Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Overall Direction Summary */}
        <div className="lg:col-span-2 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                บทสรุปทิศทางสุขภาพองค์กร (Executive Insights)
              </span>
              <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded border border-white/20">
                Q1 ➔ Q3
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              ภาพรวมสุขภาพองค์กรอยู่ในทิศทาง <span className="text-emerald-400">พัฒนาดีขึ้นชัดเจน</span>: มวลกล้ามเนื้อเฉลี่ยเพิ่มขึ้น และสัดส่วนไขมันสะสมลดลงต่อเนื่อง
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                <Dumbbell className="w-4 h-4 text-blue-300 shrink-0" />
                <div>
                  <div className="text-white/60 text-[10px]">มวลกล้ามเนื้อ</div>
                  <div className="font-bold text-emerald-300">เพิ่มขึ้น +2.6%</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                <Flame className="w-4 h-4 text-amber-300 shrink-0" />
                <div>
                  <div className="text-white/60 text-[10px]">% ไขมันในร่างกาย</div>
                  <div className="font-bold text-emerald-300">ลดลง -5.7%</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                <ShieldAlert className="w-4 h-4 text-rose-300 shrink-0" />
                <div>
                  <div className="text-white/60 text-[10px]">ไขมันช่องท้อง (อันตราย)</div>
                  <div className="font-bold text-emerald-300">ลดลง -12.1%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BMI Transition Highlight Box (Specific User Request: >= 2 quarters & > 2 quarters) */}
        <div className="bg-white border-2 border-emerald-300/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between bg-radial from-emerald-50/40 to-white">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                ความต่อเนื่อง &amp; การเปลี่ยนกลุ่ม BMI
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                &gt; 2 Qs: {transitionAnalysis.quarterParticipation.moreThanTwoQuartersCount} ท่าน
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2.5">
              มีข้อมูล &gt; 2 ไตรมาส (ครบ 3 Q): <strong className="text-emerald-700">{transitionAnalysis.quarterParticipation.moreThanTwoQuartersCount} ท่าน ({transitionAnalysis.quarterParticipation.moreThanTwoQuartersPercentage}%)</strong> | มีข้อมูล ≥ 2 Q รวม {transitionAnalysis.totalQualified} ท่าน
            </p>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {transitionAnalysis.changedPercentage}%
              </span>
              <span className="text-xs font-semibold text-slate-600">
                มีการเปลี่ยนกลุ่ม BMI ({transitionAnalysis.changedCount} ท่าน)
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                <span className="font-semibold">ปรับสู่เกณฑ์สมส่วน (ลูกค้าทั่วไป):</span>
                <strong className="text-emerald-800">
                  {transitionAnalysis.improvedCount} คน ({transitionAnalysis.improvedPercentage}%)
                </strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                <span>มีข้อมูลครบ 3 ไตรมาส:</span>
                <span className="font-bold text-blue-700">
                  {transitionAnalysis.quarterParticipation.moreThanTwoQuartersCount} คน ({transitionAnalysis.quarterParticipation.moreThanTwoQuartersPercentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode 1: 5 Clean, Highly Readable Metric Cards */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {summaries.map((metric, index) => {
            const isMuscle = metric.metricKey === 'muscle_mass';
            const details = getMetricDetails(metric.metricKey);
            const valQ3 = metric.q3Avg ?? metric.currentAvg;
            const valQ1 = metric.q1Avg;

            // Calculations
            const diffVal = valQ1 !== null ? Number((valQ3 - valQ1).toFixed(2)) : null;
            const pctVal = (valQ1 !== null && valQ1 > 0) ? Number(((valQ3 - valQ1) / valQ1 * 100).toFixed(1)) : null;

            // For muscle: higher is better (+ is good). For others: lower is better (- is good).
            const isGood = isMuscle ? (diffVal !== null && diffVal >= 0) : (diffVal !== null && diffVal <= 0);

            return (
              <div
                key={metric.metricKey}
                className={`bg-white rounded-2xl p-4 shadow-xs border transition-all duration-200 flex flex-col justify-between ${details.borderClass}`}
              >
                {/* Metric Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        {details.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                          ตัวชี้วัดที่ {index + 1}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {metric.labelTh}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium mb-3">
                    {metric.labelEn} ({metric.unit})
                  </div>

                  {/* Primary Number (Q3 Latest Average) */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      ค่าเฉลี่ยล่าสุด (Q3)
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {valQ3.toFixed(1)}{' '}
                        <span className="text-xs font-normal text-slate-500">{metric.unit}</span>
                      </span>

                      {/* Status pill */}
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                          isGood
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {pctVal !== null ? `${pctVal > 0 ? `+${pctVal}` : pctVal}%` : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Comparison Row: Q1 -> Q3 */}
                  <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2.5 mb-3">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">จุดเริ่มต้น (Q1):</span>
                      <strong className="text-slate-700 font-mono">
                        {valQ1 !== null ? `${valQ1.toFixed(1)} ${metric.unit}` : '#N/A'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ผลต่างสุทธิ:</span>
                      <span className={`font-bold font-mono ${isGood ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {diffVal !== null ? `${diffVal > 0 ? `+${diffVal}` : diffVal} ${metric.unit}` : '#N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded text-[11px]">
                      <span className="text-slate-500">เกณฑ์มาตรฐาน:</span>
                      <strong className="text-slate-700">{metric.idealRange}</strong>
                    </div>
                  </div>
                </div>

                {/* Friendly Thai Explanation Footer */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    💡 {details.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View Mode 2: Clean Summary Comparison Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              ตารางเปรียบเทียบสถิติ 5 ตัวชี้วัดหลัก 3 ไตรมาส (Q1 - Q3)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงค่าเฉลี่ยองค์กร ผลต่างสุทธิ และอัตราการเปลี่ยนแปลงคิดเป็นเปอร์เซ็นต์ (%)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">ตัวชี้วัด (Metrics)</th>
                  <th className="py-3 px-4 text-center">ค่าเฉลี่ย Q1</th>
                  <th className="py-3 px-4 text-center">ค่าเฉลี่ย Q2</th>
                  <th className="py-3 px-4 text-center bg-blue-50 text-blue-900 font-bold">ค่าเฉลี่ย Q3 (ล่าสุด)</th>
                  <th className="py-3 px-4 text-center">ผลต่าง (Q3 vs Q1)</th>
                  <th className="py-3 px-4 text-center bg-emerald-50 text-emerald-900 font-bold">% การเปลี่ยนแปลง</th>
                  <th className="py-3 px-4 text-center">เกณฑ์มาตรฐานสากล</th>
                  <th className="py-3 px-4">การแปลผลสุขภาพ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {summaries.map((metric) => {
                  const isMuscle = metric.metricKey === 'muscle_mass';
                  const details = getMetricDetails(metric.metricKey);
                  const valQ3 = metric.q3Avg ?? metric.currentAvg;
                  const valQ2 = metric.q2Avg;
                  const valQ1 = metric.q1Avg;

                  const diffVal = valQ1 !== null ? Number((valQ3 - valQ1).toFixed(2)) : null;
                  const pctVal = (valQ1 !== null && valQ1 > 0) ? Number(((valQ3 - valQ1) / valQ1 * 100).toFixed(1)) : null;
                  const isGood = isMuscle ? (diffVal !== null && diffVal >= 0) : (diffVal !== null && diffVal <= 0);

                  return (
                    <tr key={metric.metricKey} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-slate-100">{details.icon}</div>
                          <div>
                            <span className="font-bold text-slate-900 block">{metric.labelTh}</span>
                            <span className="text-[11px] text-slate-400">{metric.labelEn}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700">
                        {valQ1 !== null ? `${valQ1.toFixed(1)} ${metric.unit}` : '#N/A'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700">
                        {valQ2 !== null ? `${valQ2.toFixed(1)} ${metric.unit}` : '#N/A'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold bg-blue-50/40 text-blue-900">
                        {valQ3.toFixed(1)} {metric.unit}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {diffVal !== null ? (
                          <span className={`font-bold ${isGood ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {diffVal > 0 ? `+${diffVal}` : diffVal} {metric.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400">#N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold bg-emerald-50/40">
                        {pctVal !== null ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                              isGood
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {pctVal > 0 ? `+${pctVal}%` : `${pctVal}%`}
                          </span>
                        ) : (
                          <span className="text-slate-400">#N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-slate-500 font-mono">
                        {metric.idealRange}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <span className={`inline-flex items-center gap-1 font-semibold ${isGood ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {isGood ? '🟢 พัฒนาการดีขึ้น' : '⚠️ ควรติดตาม'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
