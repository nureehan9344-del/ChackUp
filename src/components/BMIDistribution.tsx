import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
  CalendarCheck,
  Layers,
  BarChart3
} from 'lucide-react';
import { BodyCompositionRecord, PersonSummary, Quarter } from '../types';
import { computeBMIDistributionByQuarter, computeBMITransitionAnalysis, BMITransitionItem } from '../data/analytics';
import { getBMIGroupColor } from '../data/dataset';

interface BMIDistributionProps {
  records: BodyCompositionRecord[];
  persons?: PersonSummary[];
  activeQuarter: Quarter;
  onSelectPerson?: (personId: string) => void;
}

export const BMIDistribution: React.FC<BMIDistributionProps> = ({
  records,
  persons = [],
  activeQuarter,
  onSelectPerson,
}) => {
  const distributionData = computeBMIDistributionByQuarter(records);
  const transitionAnalysis = computeBMITransitionAnalysis(persons);
  const [transitionTab, setTransitionTab] = useState<'all_changed' | 'improved' | 'worsened' | 'three_quarters' | 'two_quarters'>('all_changed');
  const [selectedDistQuarter, setSelectedDistQuarter] = useState<'ALL' | Quarter>('ALL');

  // Distribution for currently selected quarter tab
  const currentDist = selectedDistQuarter === 'ALL'
    ? (distributionData.find((d) => d.quarter === activeQuarter) || distributionData[2])
    : (distributionData.find((d) => d.quarter === selectedDistQuarter) || distributionData[2]);

  const pieData = [
    { name: 'ลูกค้ารายย่อย (< 18.5)', value: currentDist['ลูกค้ารายย่อย'], color: '#3b82f6', description: 'น้ำหนักน้อยกว่าเกณฑ์' },
    { name: 'ลูกค้าทั่วไป (18.5 - 22.9)', value: currentDist['ลูกค้าทั่วไป'], color: '#10b981', description: 'น้ำหนักสมส่วนมาตรฐาน' },
    { name: 'ลูกค้ารายใหญ่ (> 23)', value: currentDist['ลูกค้ารายใหญ่'], color: '#ef4444', description: 'น้ำหนักเกิน / เสี่ยงโรคอ้วน' },
  ];

  // Calculate change between Q1 and Q3
  const q1Dist = distributionData[0];
  const q2Dist = distributionData[1];
  const q3Dist = distributionData[2];

  const generalGrowth = q3Dist && q1Dist ? q3Dist['ลูกค้าทั่วไป'] - q1Dist['ลูกค้าทั่วไป'] : 0;
  const largeClientReduction = q3Dist && q1Dist ? q1Dist['ลูกค้ารายใหญ่'] - q3Dist['ลูกค้ารายใหญ่'] : 0;

  // Filtered transition / participation items to display
  const displayedTransitions = transitionTab === 'all_changed'
    ? transitionAnalysis.changedTransitions
    : transitionTab === 'improved'
    ? transitionAnalysis.improvedTransitions
    : transitionTab === 'worsened'
    ? transitionAnalysis.worsenedTransitions
    : transitionTab === 'three_quarters'
    ? transitionAnalysis.transitions.filter(t => t.totalQuartersCount >= 3)
    : transitionAnalysis.transitions.filter(t => t.totalQuartersCount === 2);

  const { quarterParticipation } = transitionAnalysis;

  return (
    <section className="mb-8">
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              การจัดกลุ่ม BMI &amp; สัดส่วนประชากรองค์กร
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
              เกณฑ์จำแนกเฉพาะ (Custom BMI Segmentation)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            เกณฑ์: <strong>ลูกค้ารายย่อย (&lt;18.5)</strong> | <strong>ลูกค้าทั่วไป (18.5 - 22.9)</strong> | <strong>ลูกค้ารายใหญ่ (&gt;23.0)</strong>
          </p>
        </div>

        {/* BMI Criteria Summary Badges */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
            ลูกค้ารายย่อย: &lt; 18.5
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            ลูกค้าทั่วไป: 18.5 - 22.9
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
            ลูกค้ารายใหญ่: &gt; 23.0
          </span>
        </div>
      </div>

      {/* SPECIAL CALLOUT: Quarters Participation Breakdown & BMI Transition Analysis */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 mb-6 shadow-sm border border-emerald-800/50">
        {/* Header with Title and Big Stat */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <CalendarCheck className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                ความต่อเนื่องของการตรวจ &amp; อัตราการเปลี่ยนกลุ่ม BMI
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 font-semibold border border-emerald-400/30">
                ประเมินจากผลตรวจ 3 ไตรมาส
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              บุคลากรทั้งหมด <strong>{quarterParticipation.totalPersons} ท่าน</strong> | มีผู้เข้ารับการตรวจมากกว่า 2 ไตรมาส (ครบทั้ง 3 ไตรมาส) จำนวน{' '}
              <strong className="text-emerald-300 font-bold underline underline-offset-2">
                {quarterParticipation.moreThanTwoQuartersCount} ท่าน ({quarterParticipation.moreThanTwoQuartersPercentage}%)
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-right">
              <div className="text-[10px] uppercase text-emerald-300 font-bold">มีข้อมูล &gt; 2 ไตรมาส (ครบ 3 Q)</div>
              <div className="text-2xl font-extrabold text-emerald-300">
                {quarterParticipation.moreThanTwoQuartersCount}{' '}
                <span className="text-xs font-normal text-slate-300">({quarterParticipation.moreThanTwoQuartersPercentage}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards: Participation & Transition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Card 1: Data Continuity > 2 Quarters */}
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-emerald-200 font-medium flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                  1. มีข้อมูล &gt; 2 ไตรมาส (ครบ 3 Q)
                </span>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  {quarterParticipation.moreThanTwoQuartersPercentage}%
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {quarterParticipation.moreThanTwoQuartersCount}{' '}
                <span className="text-xs font-normal text-slate-300">จาก {quarterParticipation.totalPersons} ท่าน</span>
              </div>
            </div>
            <p className="text-[11px] text-emerald-200/80 mt-2 pt-2 border-t border-emerald-800/40">
              ตรวจต่อเนื่องครบทั้ง Q1, Q2, Q3 (ข้อมูลสมบูรณ์สูงสุด)
            </p>
          </div>

          {/* Card 2: Exactly 2 Quarters & Total Qualified */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  2. มีข้อมูลอย่างน้อย 2 ไตรมาส
                </span>
                <span className="text-xs font-bold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/40">
                  {quarterParticipation.atLeastTwoQuartersPercentage}%
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {quarterParticipation.atLeastTwoQuartersCount}{' '}
                <span className="text-xs font-normal text-slate-300">ท่าน (2Q = {quarterParticipation.twoQuartersCount} ท่าน)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/10">
              ฐานกลุ่มที่เข้าเกณฑ์ประเมินเปรียบเทียบพัฒนาการ
            </p>
          </div>

          {/* Card 3: BMI Group Changed */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  3. อัตราการเปลี่ยนกลุ่ม BMI
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-700/50">
                  {transitionAnalysis.changedPercentage}%
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {transitionAnalysis.changedCount}{' '}
                <span className="text-xs font-normal text-slate-300">จาก {transitionAnalysis.totalQualified} ท่าน</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/10">
              มีการเคลื่อนย้ายกลุ่ม BMI จากจุดเริ่มต้น
            </p>
          </div>

          {/* Card 4: Improved into Normal */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  4. พัฒนาสู่สมส่วน (ทั่วไป)
                </span>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  {transitionAnalysis.improvedPercentage}%
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-300">
                {transitionAnalysis.improvedCount}{' '}
                <span className="text-xs font-normal text-slate-300">ท่าน (คงที่ {transitionAnalysis.unchangedCount} ท่าน)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/10">
              ลดจากรายใหญ่ หรือเพิ่มจากรายย่อย สู่ 18.5 - 22.9
            </p>
          </div>
        </div>

        {/* List of Persons who changed BMI groups or have >2 quarters with tab filters */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              รายชื่อและประวัติพัฒนาการ ({displayedTransitions.length} ท่าน)
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/10 text-xs flex-wrap">
              <button
                onClick={() => setTransitionTab('all_changed')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  transitionTab === 'all_changed' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                เปลี่ยนกลุ่มทั้งหมด ({transitionAnalysis.changedCount})
              </button>
              <button
                onClick={() => setTransitionTab('improved')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  transitionTab === 'improved' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                สู่กลุ่มสมส่วน ({transitionAnalysis.improvedCount})
              </button>
              <button
                onClick={() => setTransitionTab('worsened')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  transitionTab === 'worsened' ? 'bg-rose-500 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                ควรเฝ้าระวัง ({transitionAnalysis.worsenedCount})
              </button>
              <button
                onClick={() => setTransitionTab('three_quarters')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  transitionTab === 'three_quarters' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                มีข้อมูล &gt; 2 ไตรมาส (ครบ 3 Q) ({quarterParticipation.moreThanTwoQuartersCount})
              </button>
            </div>
          </div>

          {/* Transition / Personnel Pills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {displayedTransitions.map((item) => (
              <div
                key={item.person_id}
                onClick={() => onSelectPerson && onSelectPerson(item.person_id)}
                className="bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl p-2.5 text-xs text-white flex items-center justify-between cursor-pointer transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-white group-hover:text-emerald-300">
                      ID: {item.person_id}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        item.changeType === 'improved'
                          ? 'bg-emerald-500/40 text-emerald-200'
                          : item.changeType === 'worsened'
                          ? 'bg-rose-500/40 text-rose-200'
                          : 'bg-slate-600/50 text-slate-200'
                      }`}
                    >
                      {item.changeType === 'improved'
                        ? '✓ พัฒนาดีขึ้น'
                        : item.changeType === 'worsened'
                        ? '⚠️ เฝ้าระวัง'
                        : '• คงที่'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 font-mono">
                      {item.totalQuartersCount} Qs
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-1">
                    <span className="text-slate-400">{item.initialQuarter} ({item.initialBmi})</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-white">{item.latestQuarter} ({item.latestBmi})</span>
                    <span className={`text-[10px] font-bold ${item.bmiDiff < 0 ? 'text-emerald-300' : item.bmiDiff > 0 ? 'text-rose-300' : 'text-slate-300'}`}>
                      ({item.bmiDiff > 0 ? `+${item.bmiDiff}` : item.bmiDiff} | {item.bmiDiffPct > 0 ? `+${item.bmiDiffPct}` : item.bmiDiffPct}%)
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-300 mt-0.5">
                    {item.initialGroup} ➔ <strong className="text-white">{item.latestGroup}</strong>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Trend Bar Chart & ALL Quarters Segment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quarterly Shift Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  การเคลื่อนย้ายกลุ่มบุคลากรตามไตรมาส (Quarterly BMI Transition)
                </h3>
                <p className="text-xs text-slate-500">
                  เปรียบเทียบจำนวนและสัดส่วนบุคลากรในแต่ละกลุ่มตั้งแต่ Q1, Q2 ถึง Q3
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Grouped Bar Chart
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="quarter" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} label={{ value: 'จำนวนคน', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 10 } }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="ลูกค้ารายย่อย" name="ลูกค้ารายย่อย (< 18.5)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ลูกค้าทั่วไป" name="ลูกค้าทั่วไป (18.5 - 22.9)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ลูกค้ารายใหญ่" name="ลูกค้ารายใหญ่ (> 23)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Organizational Trend Analysis Callout */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
              <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-900">กลุ่มลูกค้าทั่วไป (สมส่วน) เพิ่มขึ้น:</span>
                <p className="text-emerald-700 mt-0.5">
                  เพิ่มขึ้น +{generalGrowth} ท่านจาก Q1 สู่ Q3 สะท้อนผลลัพธ์เชิงบวกขององค์กร
                </p>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-900">กลุ่มลูกค้ารายใหญ่ (เกินเกณฑ์) ปรับลดลง:</span>
                <p className="text-blue-700 mt-0.5">
                  ปรับลดลง -{largeClientReduction} ท่าน เคลื่อนย้ายเข้าสู่เกณฑ์สมส่วน
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BMI Segment Distribution - ALL Quarters Comprehensive View (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with Multi-Q Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  BMI Segment Distribution (ครบทุก Q)
                </h3>
                <p className="text-[11px] text-slate-500">
                  สัดส่วนและเปอร์เซ็นต์บุคลากรจำแนกครบทุกไตรมาส
                </p>
              </div>

              {/* Quarter selector buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
                <button
                  onClick={() => setSelectedDistQuarter('ALL')}
                  className={`px-2 py-1 rounded font-semibold transition-all ${
                    selectedDistQuarter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทุก Q
                </button>
                <button
                  onClick={() => setSelectedDistQuarter('Q1')}
                  className={`px-2 py-1 rounded font-semibold transition-all ${
                    selectedDistQuarter === 'Q1'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Q1
                </button>
                <button
                  onClick={() => setSelectedDistQuarter('Q2')}
                  className={`px-2 py-1 rounded font-semibold transition-all ${
                    selectedDistQuarter === 'Q2'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Q2
                </button>
                <button
                  onClick={() => setSelectedDistQuarter('Q3')}
                  className={`px-2 py-1 rounded font-semibold transition-all ${
                    selectedDistQuarter === 'Q3'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Q3
                </button>
              </div>
            </div>

            {/* If 'ALL' is selected: Show Complete All-Quarter Matrix and side-by-side comparative bars */}
            {selectedDistQuarter === 'ALL' ? (
              <div className="space-y-4">
                {/* Quarter-by-Quarter Comparison Cards */}
                {distributionData.map((qData) => {
                  const under = qData['ลูกค้ารายย่อย'];
                  const normal = qData['ลูกค้าทั่วไป'];
                  const over = qData['ลูกค้ารายใหญ่'];
                  const total = qData.total;

                  const underPct = qData.ลูกค้ารายย่อยPct;
                  const normalPct = qData.ลูกค้าทั่วไปPct;
                  const overPct = qData.ลูกค้ารายใหญ่Pct;

                  return (
                    <div key={qData.quarter} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                            {qData.quarter}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            ผู้ตรวจรวม {total} คน
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ทั่วไป {normalPct}% | รายใหญ่ {overPct}% | รายย่อย {underPct}%
                        </span>
                      </div>

                      {/* Stacked Percentage Bar */}
                      <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${underPct}%` }}
                          className="bg-blue-500 h-full transition-all"
                          title={`ลูกค้ารายย่อย: ${under} คน (${underPct}%)`}
                        />
                        <div
                          style={{ width: `${normalPct}%` }}
                          className="bg-emerald-500 h-full transition-all"
                          title={`ลูกค้าทั่วไป: ${normal} คน (${normalPct}%)`}
                        />
                        <div
                          style={{ width: `${overPct}%` }}
                          className="bg-rose-500 h-full transition-all"
                          title={`ลูกค้ารายใหญ่: ${over} คน (${overPct}%)`}
                        />
                      </div>

                      {/* 3 Metrics breakdown row */}
                      <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
                        <div className="text-blue-700">
                          รายย่อย: <strong>{under} คน</strong> ({underPct}%)
                        </div>
                        <div className="text-emerald-700 text-center font-bold">
                          ทั่วไป: <strong>{normal} คน</strong> ({normalPct}%)
                        </div>
                        <div className="text-rose-700 text-right">
                          รายใหญ่: <strong>{over} คน</strong> ({overPct}%)
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Summary Comparative Matrix Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">กลุ่ม BMI</th>
                        <th className="py-2 px-2 text-center text-blue-800">Q1</th>
                        <th className="py-2 px-2 text-center text-blue-800">Q2</th>
                        <th className="py-2 px-2 text-center text-blue-800">Q3</th>
                        <th className="py-2 px-2.5 text-right">แนวโน้ม (Q1➔Q3)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr>
                        <td className="py-2 px-2.5 font-sans font-medium text-blue-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          ลูกค้ารายย่อย (&lt;18.5)
                        </td>
                        <td className="py-2 px-2 text-center">{q1Dist['ลูกค้ารายย่อย']} ({q1Dist.ลูกค้ารายย่อยPct}%)</td>
                        <td className="py-2 px-2 text-center">{q2Dist['ลูกค้ารายย่อย']} ({q2Dist.ลูกค้ารายย่อยPct}%)</td>
                        <td className="py-2 px-2 text-center font-bold">{q3Dist['ลูกค้ารายย่อย']} ({q3Dist.ลูกค้ารายย่อยPct}%)</td>
                        <td className="py-2 px-2.5 text-right font-sans text-[11px] text-slate-600">
                          {q3Dist['ลูกค้ารายย่อย'] - q1Dist['ลูกค้ารายย่อย'] > 0 ? `+${q3Dist['ลูกค้ารายย่อย'] - q1Dist['ลูกค้ารายย่อย']}` : q3Dist['ลูกค้ารายย่อย'] - q1Dist['ลูกค้ารายย่อย']} คน
                        </td>
                      </tr>
                      <tr className="bg-emerald-50/50">
                        <td className="py-2 px-2.5 font-sans font-bold text-emerald-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          ลูกค้าทั่วไป (18.5-22.9)
                        </td>
                        <td className="py-2 px-2 text-center">{q1Dist['ลูกค้าทั่วไป']} ({q1Dist.ลูกค้าทั่วไปPct}%)</td>
                        <td className="py-2 px-2 text-center">{q2Dist['ลูกค้าทั่วไป']} ({q2Dist.ลูกค้าทั่วไปPct}%)</td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-700">{q3Dist['ลูกค้าทั่วไป']} ({q3Dist.ลูกค้าทั่วไปPct}%)</td>
                        <td className="py-2 px-2.5 text-right font-sans text-[11px] font-bold text-emerald-700">
                          +{generalGrowth} คน (เพิ่มขึ้น)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 font-sans font-medium text-rose-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          ลูกค้ารายใหญ่ (&gt;23)
                        </td>
                        <td className="py-2 px-2 text-center">{q1Dist['ลูกค้ารายใหญ่']} ({q1Dist.ลูกค้ารายใหญ่Pct}%)</td>
                        <td className="py-2 px-2 text-center">{q2Dist['ลูกค้ารายใหญ่']} ({q2Dist.ลูกค้ารายใหญ่Pct}%)</td>
                        <td className="py-2 px-2 text-center font-bold">{q3Dist['ลูกค้ารายใหญ่']} ({q3Dist.ลูกค้ารายใหญ่Pct}%)</td>
                        <td className="py-2 px-2.5 text-right font-sans text-[11px] font-bold text-blue-700">
                          -{largeClientReduction} คน (ลดลง)
                        </td>
                      </tr>
                      <tr className="bg-slate-100/70 font-semibold">
                        <td className="py-2 px-2.5 font-sans text-slate-800">ผู้เข้ารับการตรวจรวม</td>
                        <td className="py-2 px-2 text-center text-slate-800">{q1Dist.total} คน</td>
                        <td className="py-2 px-2 text-center text-slate-800">{q2Dist.total} คน</td>
                        <td className="py-2 px-2 text-center text-slate-900 font-bold">{q3Dist.total} คน</td>
                        <td className="py-2 px-2.5 text-right font-sans text-slate-600">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Specific Single Quarter Breakdown (Q1, Q2, or Q3) */
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    ข้อมูลเฉพาะ {selectedDistQuarter}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    ยอดรวม {currentDist.total} คน
                  </span>
                </div>

                {/* High Density Progress Bars */}
                <div className="space-y-3.5">
                  {pieData.map((item, idx) => {
                    const pct = currentDist.total > 0 ? ((item.value / currentDist.total) * 100).toFixed(1) : '0';
                    const isLarge = item.name.includes('ลูกค้ารายใหญ่');
                    const isNormal = item.name.includes('ลูกค้าทั่วไป');
                    const barColor = isLarge ? 'bg-rose-500' : isNormal ? 'bg-emerald-500' : 'bg-blue-500';
                    const textColor = isLarge ? 'text-rose-600' : isNormal ? 'text-emerald-600' : 'text-blue-600';

                    return (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="font-medium text-slate-700">{item.name}</span>
                          <span className={`font-bold ${textColor}`}>{pct}% ({item.value} คน)</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mini Donut Chart in Center */}
                <div className="h-36 w-full mt-4 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{selectedDistQuarter} Total</span>
                    <span className="text-base font-bold text-slate-800">{currentDist.total}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
