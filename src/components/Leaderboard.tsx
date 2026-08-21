import React, { useState } from 'react';
import { Trophy, Flame, Dumbbell, ShieldCheck, ArrowUpRight, ArrowDownRight, Award, User, Sparkles, ChevronRight, Percent } from 'lucide-react';
import { PersonSummary } from '../types';
import { computeLeaderboards } from '../data/analytics';
import { getBMIGroupColor } from '../data/dataset';

interface LeaderboardProps {
  persons: PersonSummary[];
  onSelectPerson: (personId: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ persons, onSelectPerson }) => {
  const [activeTab, setActiveTab] = useState<'fat' | 'muscle' | 'visceral'>('fat');
  const { topFatLoss, topMuscleGain, topVisceralLoss } = computeLeaderboards(persons);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="h-6 w-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">🥇</span>;
      case 2:
        return <span className="h-6 w-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs">🥈</span>;
      case 3:
        return <span className="h-6 w-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-xs">🥉</span>;
      default:
        return <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">#{rank}</span>;
    }
  };

  return (
    <section className="mb-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Individual Leaderboard : กระดานเกียรติยศบุคลากรพัฒนาการดีเด่น
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold uppercase tracking-wider border border-amber-200">
              3 ไตรมาส (Q1 → Q3)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
              <Percent className="w-2.5 h-2.5" />
              คิดผลต่างเป็น %
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ยกย่องบุคลากรที่มีผลการดูแลสุขภาพเป็นเลิศ พร้อมอัตราการเปลี่ยนแปลงสัมพัทธ์ในรูปแบบเปอร์เซ็นต์ (%)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('fat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'fat'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>% ไขมันลดลงสูงสุด</span>
          </button>
          <button
            onClick={() => setActiveTab('muscle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'muscle'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span>กล้ามเนื้อเพิ่มสูงสุด</span>
          </button>
          <button
            onClick={() => setActiveTab('visceral')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'visceral'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>ลดไขมันช่องท้องสูงสุด</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">อันดับ</th>
                <th className="py-2.5 px-4">บุคลากร (Person ID)</th>
                <th className="py-2.5 px-4">กลุ่ม BMI</th>
                <th className="py-2.5 px-4 text-center">ค่าเริ่มต้น (Q1)</th>
                <th className="py-2.5 px-4 text-center">ค่าล่าสุด (Q3)</th>
                <th className="py-2.5 px-4 text-right">
                  {activeTab === 'fat' && 'ผลต่าง % ไขมัน (และ % เปลี่ยนแปลง)'}
                  {activeTab === 'muscle' && 'ผลต่างมวลกล้ามเนื้อ (และ % เปลี่ยนแปลง)'}
                  {activeTab === 'visceral' && 'ผลต่างไขมันช่องท้อง (และ % เปลี่ยนแปลง)'}
                </th>
                <th className="py-2.5 px-4 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'fat' ? topFatLoss : activeTab === 'muscle' ? topMuscleGain : topVisceralLoss).map(
                (person, index) => {
                  const rank = index + 1;
                  const q1 = person.quarters.Q1 || person.quarters.Q2;
                  const q3 = person.quarters.Q3;

                  let initialVal = '-';
                  let latestVal = '-';
                  let deltaNode: React.ReactNode = null;

                  if (activeTab === 'fat') {
                    initialVal = q1?.body_fat_percentage ? `${q1.body_fat_percentage}%` : '#N/A';
                    latestVal = q3?.body_fat_percentage ? `${q3.body_fat_percentage}%` : '#N/A';
                    const pctVal = person.fatPercentageChangePct ?? 0;
                    deltaNode = (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <ArrowDownRight className="h-3.5 w-3.5" />
                        {person.fatPercentageChange}% ({pctVal > 0 ? `+${pctVal}` : pctVal}%)
                      </span>
                    );
                  } else if (activeTab === 'muscle') {
                    initialVal = q1?.muscle_mass ? `${q1.muscle_mass} kg` : '#N/A';
                    latestVal = q3?.muscle_mass ? `${q3.muscle_mass} kg` : '#N/A';
                    const pctVal = person.muscleMassChangePct ?? 0;
                    deltaNode = (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        +{person.muscleMassChange} kg (+{pctVal}%)
                      </span>
                    );
                  } else {
                    initialVal = q1?.visceral_fat ? `${q1.visceral_fat} Lv` : '#N/A';
                    latestVal = q3?.visceral_fat ? `${q3.visceral_fat} Lv` : '#N/A';
                    const pctVal = person.visceralFatChangePct ?? 0;
                    deltaNode = (
                      <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                        <ArrowDownRight className="h-3.5 w-3.5" />
                        {person.visceralFatChange} Lv ({pctVal > 0 ? `+${pctVal}` : pctVal}%)
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={person.person_id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => onSelectPerson(person.person_id)}
                    >
                      <td className="py-3 px-4 text-center font-bold">{getRankBadge(rank)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                        <span className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                          <User className="h-3.5 w-3.5" />
                        </span>
                        ID: {person.person_id}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${getBMIGroupColor(
                            person.bmiGroup
                          )}`}
                        >
                          {person.bmiGroup}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">{initialVal}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-900">{latestVal}</td>
                      <td className="py-3 px-4 text-right">{deltaNode}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPerson(person.person_id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                        >
                          ดูประวัติ <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>* เฉพาะบุคลากรที่มีบันทึกตรวจวัดอย่างน้อย 2 ไตรมาส (เริ่มต้น และ ล่าสุด)</span>
          <span className="text-emerald-700 font-medium">คลิกที่แถวเพื่อดูรายละเอียดพัฒนาการสุขภาพรายบุคคล</span>
        </div>
      </div>
    </section>
  );
};

