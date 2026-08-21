import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  Cell
} from 'recharts';
import { ShieldAlert, TrendingDown, TrendingUp, Sparkles, Activity, Flame, Dumbbell, BarChart3, HelpCircle, Percent } from 'lucide-react';
import { BodyCompositionRecord, Quarter } from '../types';
import { calculateQuarterAverages } from '../data/analytics';

interface ComparativeChartsProps {
  records: BodyCompositionRecord[];
  activeQuarter: Quarter;
}

export const ComparativeCharts: React.FC<ComparativeChartsProps> = ({ records, activeQuarter }) => {
  const [chartMetricView, setChartMetricView] = useState<'all' | 'critical' | 'body_composition'>('critical');

  // Compute quarters data for charts (Q1, Q2, Q3)
  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3'];
  const trendData = quarters.map((q) => {
    const avg = calculateQuarterAverages(records, q);
    return {
      quarter: q === 'Q3' ? 'Q3 (ล่าสุด)' : q,
      quarterKey: q,
      muscle_mass: avg.muscle_mass ? Number(avg.muscle_mass.toFixed(1)) : null,
      bmi: avg.bmi ? Number(avg.bmi.toFixed(2)) : null,
      body_fat_percentage: avg.body_fat_percentage ? Number(avg.body_fat_percentage.toFixed(1)) : null,
      fat_mass: avg.fat_mass ? Number(avg.fat_mass.toFixed(1)) : null,
      visceral_fat: avg.visceral_fat ? Number(avg.visceral_fat.toFixed(1)) : null,
      weight: avg.weight ? Number(avg.weight.toFixed(1)) : null,
      count: avg.count,
    };
  });

  // Critical health risk radar comparison data (Q1 vs Q3)
  const q1Avg = calculateQuarterAverages(records, 'Q1');
  const q3Avg = calculateQuarterAverages(records, 'Q3');

  // Calculate percentage changes
  const musclePctChange = q1Avg.muscle_mass && q3Avg.muscle_mass ? Number((((q3Avg.muscle_mass - q1Avg.muscle_mass) / q1Avg.muscle_mass) * 100).toFixed(1)) : 0;
  const fatPctChange = q1Avg.body_fat_percentage && q3Avg.body_fat_percentage ? Number((((q3Avg.body_fat_percentage - q1Avg.body_fat_percentage) / q1Avg.body_fat_percentage) * 100).toFixed(1)) : 0;
  const visceralPctChange = q1Avg.visceral_fat && q3Avg.visceral_fat ? Number((((q3Avg.visceral_fat - q1Avg.visceral_fat) / q1Avg.visceral_fat) * 100).toFixed(1)) : 0;

  const radarData = [
    { subject: 'มวลกล้ามเนื้อ (kg)', Q1: q1Avg.muscle_mass ?? 22, Q3: q3Avg.muscle_mass ?? 23, fullMark: 40 },
    { subject: 'เปอร์เซ็นต์ไขมัน (%)', Q1: q1Avg.body_fat_percentage ?? 32, Q3: q3Avg.body_fat_percentage ?? 29, fullMark: 50 },
    { subject: 'ไขมันช่องท้อง (Level x2)', Q1: (q1Avg.visceral_fat ?? 6) * 2, Q3: (q3Avg.visceral_fat ?? 5) * 2, fullMark: 30 },
    { subject: 'ดัชนีมวลกาย (BMI)', Q1: q1Avg.bmi ?? 24, Q3: q3Avg.bmi ?? 23.5, fullMark: 35 },
    { subject: 'มวลไขมัน (kg)', Q1: q1Avg.fat_mass ?? 20, Q3: q3Avg.fat_mass ?? 18, fullMark: 40 },
  ];

  // Scatter data for latest quarter (visceral_fat vs body_fat_percentage)
  const q3Records = records.filter(r => r.quarter === 'Q3' && r.body_fat_percentage !== null && r.visceral_fat !== null);
  const riskScatterData = q3Records.slice(0, 120).map(r => ({
    person_id: r.person_id,
    body_fat: r.body_fat_percentage,
    visceral_fat: r.visceral_fat,
    bmi: r.bmi,
    isHighRisk: (r.visceral_fat ?? 0) >= 10 || (r.body_fat_percentage ?? 0) >= 35
  }));

  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Comparative Analysis : กราฟเปรียบเทียบแนวโน้ม 3 ไตรมาส
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Q1 → Q2 → Q3
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
              <Percent className="w-3 h-3" />
              คำนวณ % การเปลี่ยนแปลง
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            กราฟแสดงการเปลี่ยนแปลงรายไตรมาส (Q1 - Q3) พร้อมไฮไลท์ตัวชี้วัดความเสี่ยงและอัตราการเปลี่ยนแปลง (%)
          </p>
        </div>

        {/* Chart View Mode Switcher */}
        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setChartMetricView('critical')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              chartMetricView === 'critical' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⭐ ไฮไลท์ตัวชี้วัดสำคัญ (Critical Risks)
          </button>
          <button
            onClick={() => setChartMetricView('all')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              chartMetricView === 'all' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 แนวโน้ม 5 ตัวชี้วัดรวม
          </button>
          <button
            onClick={() => setChartMetricView('body_composition')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              chartMetricView === 'body_composition' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚖️ มวลกล้ามเนื้อ vs มวลไขมัน
          </button>
        </div>
      </div>

      {/* Grid: Main Trends Chart & Critical Highlight Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                {chartMetricView === 'critical' && 'Quarterly Trend Analysis (Q1 - Q3)'}
                {chartMetricView === 'all' && 'แนวโน้มค่าเฉลี่ย 5 ตัวชี้วัดทางสรีรวิทยา (Q1 - Q3)'}
                {chartMetricView === 'body_composition' && 'เปรียบเทียบสัดส่วน: มวลกล้ามเนื้อ (Lean Mass) vs มวลไขมัน (Fat Mass)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {chartMetricView === 'critical' && 'ติดตามค่าเฉลี่ยไขมันช่องท้องและเปอร์เซ็นต์ไขมันตลอด 3 ไตรมาส'}
                {chartMetricView === 'all' && 'เปรียบเทียบมิติความเปลี่ยนแปลงด้านสรีระองค์กร'}
                {chartMetricView === 'body_composition' && 'มวลกล้ามเนื้อที่เพิ่มขึ้นจะช่วยเร่งการเผาผลาญไขมันสะสม'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Muscle</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span> Visceral</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Body Fat %</div>
            </div>
          </div>

          {/* Render Active Chart */}
          <div className="h-72 w-full">
            {chartMetricView === 'critical' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="quarter" stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#ef4444" fontSize={12} label={{ value: 'ไขมันช่องท้อง (Level)', angle: -90, position: 'insideLeft', style: { fill: '#ef4444', fontSize: 10 } }} domain={[0, 15]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={12} label={{ value: 'เปอร์เซ็นต์ไขมัน (%)', angle: 90, position: 'insideRight', style: { fill: '#f59e0b', fontSize: 10 } }} domain={[15, 45]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'visceral_fat') return [`${value} Level`, 'ไขมันช่องท้อง (Visceral Fat)'];
                      if (name === 'body_fat_percentage') return [`${value} %`, 'เปอร์เซ็นต์ไขมัน (Body Fat %)'];
                      if (name === 'muscle_mass') return [`${value} kg`, 'มวลกล้ามเนื้อ (Muscle Mass)'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="visceral_fat" name="visceral_fat" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, fill: '#ef4444' }} activeDot={{ r: 7 }} />
                  <Line yAxisId="right" type="monotone" dataKey="body_fat_percentage" name="body_fat_percentage" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {chartMetricView === 'all' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="quarter" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="muscle_mass" name="มวลกล้ามเนื้อ (kg)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="bmi" name="ดัชนีมวลกาย BMI" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="body_fat_percentage" name="% ไขมันในร่างกาย" stroke="#eab308" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="visceral_fat" name="ไขมันช่องท้อง (Level)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {chartMetricView === 'body_composition' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="quarter" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} label={{ value: 'น้ำหนัก (kg)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 10 } }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="muscle_mass" name="มวลกล้ามเนื้อ (Muscle Mass)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fat_mass" name="มวลไขมัน (Fat Mass)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick takeaway summary footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <TrendingUp className="h-4 w-4" />
              ภาพรวม 3 ไตรมาส: มวลกล้ามเนื้อ {musclePctChange >= 0 ? `+${musclePctChange}%` : `${musclePctChange}%`} | % ไขมัน {fatPctChange <= 0 ? `${fatPctChange}%` : `+${fatPctChange}%`} | ไขมันช่องท้อง {visceralPctChange <= 0 ? `${visceralPctChange}%` : `+${visceralPctChange}%`}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">Sync: Google Sheet Q1-Q3</span>
          </div>
        </div>

        {/* Critical Health Highlights Card (1 Column, High Density Dark Style) */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-12 translate-x-12 blur-2xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                <ShieldAlert className="h-3 w-3 text-red-400" />
                Critical Risk Matrix
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Q3 Audit</span>
            </div>

            <h3 className="text-sm font-bold text-white mt-3 uppercase tracking-tight">
              จุดสังเกตสุขภาพระยะยาว (Long-Term Health Risks)
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">
              2 ตัวชี้วัดสำคัญที่มีผลต่อโรคไม่ติดต่อเรื้อรัง (NCDs) &amp; หลอดเลือดหัวใจ
            </p>

            {/* Metric 1: Visceral Fat */}
            <div className="mt-3.5 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-red-300 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" /> ไขมันช่องท้อง (Visceral Fat)
                </span>
                <span className="font-mono font-bold text-white text-sm">
                  {q3Avg.visceral_fat ? q3Avg.visceral_fat.toFixed(1) : '-'} Level
                </span>
              </div>
              <p className="text-[10px] text-slate-300 mt-1">
                เกณฑ์มาตรฐาน: &lt; 9 Level (หากเกิน 10 เสี่ยงต่อภาวะไขมันพอกตับและความดันโลหิตสูง)
              </p>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, ((q3Avg.visceral_fat ?? 6) / 15) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Metric 2: Body Fat % */}
            <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" /> เปอร์เซ็นต์ไขมัน (Body Fat %)
                </span>
                <span className="font-mono font-bold text-white text-sm">
                  {q3Avg.body_fat_percentage ? q3Avg.body_fat_percentage.toFixed(1) : '-'} %
                </span>
              </div>
              <p className="text-[10px] text-slate-300 mt-1">
                เกณฑ์มาตรฐาน: ชาย 10-20%, หญิง 18-28% (ส่งผลต่อโรคหัวใจและหลอดเลือด)
              </p>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, ((q3Avg.body_fat_percentage ?? 28) / 45) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Health Score Footer */}
          <div className="mt-4 pt-3 border-t border-white/10 text-center relative z-10">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Organization Wellness Score</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">78.4 / 100</p>
          </div>
        </div>
      </div>

      {/* Secondary Row: Radar Profile & Scatter Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Radar: Multi-Dimensional Health Shift (Q1 vs Q3) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                มิติด้านสุขภาพเปรียบเทียบ (Radar Profile: Q1 vs Q3)
              </h3>
              <p className="text-xs text-slate-500">
                แสดงการหดตัวของไขมันและการขยายตัวของกล้ามเนื้อระหว่างไตรมาสแรกและไตรมาสล่าสุด
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Chart: Radar / Spider
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" stroke="#475569" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 45]} stroke="#94a3b8" fontSize={10} />
                <Radar name="Q1 (ไตรมาสที่ 1)" dataKey="Q1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.25} />
                <Radar name="Q3 (ไตรมาสที่ 3 ล่าสุด)" dataKey="Q3" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter: Long-term Risk Matrix (Body Fat vs Visceral Fat) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                เมทริกซ์กระจายความเสี่ยงบุคลากร (Risk Matrix Scatter)
              </h3>
              <p className="text-xs text-slate-500">
                จุดพิกัด % ไขมัน (แกน X) เทียบกับ ระดับไขมันช่องท้อง (แกน Y) ในไตรมาส Q3
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Chart: Scatter Matrix
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="body_fat" name="เปอร์เซ็นต์ไขมัน" unit="%" domain={[10, 50]} stroke="#64748b" fontSize={11} label={{ value: 'เปอร์เซ็นต์ไขมัน (%)', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: '#64748b' } }} />
                <YAxis type="number" dataKey="visceral_fat" name="ไขมันช่องท้อง" unit=" Lv" domain={[0, 20]} stroke="#64748b" fontSize={11} label={{ value: 'ไขมันช่องท้อง (Level)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-md text-xs">
                          <p className="font-bold text-slate-900">Person ID: {data.person_id}</p>
                          <p className="text-amber-600 font-semibold">% ไขมัน: {data.body_fat}%</p>
                          <p className="text-purple-600 font-semibold">ไขมันช่องท้อง: {data.visceral_fat} Level</p>
                          <p className="text-blue-600">BMI: {data.bmi}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={9} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'เกณฑ์ความเสี่ยงไขมันช่องท้อง (>9)', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine x={30} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'เกณฑ์ไขมันสูง (>30%)', position: 'insideBottomRight', fill: '#f59e0b', fontSize: 10 }} />
                <Scatter name="บุคลากร" data={riskScatterData} fill="#3b82f6">
                  {riskScatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isHighRisk ? '#ef4444' : '#10b981'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> ปลอดภัย (&lt;9 Lv, &lt;30%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> กลุ่มเสี่ยงโรคหลอดเลือด (&gt;9 Lv)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
