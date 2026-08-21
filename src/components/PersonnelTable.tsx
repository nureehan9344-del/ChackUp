import React, { useState } from 'react';
import { User, Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter, AlertCircle, Eye, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { BMIGroup, PersonSummary } from '../types';
import { getBMIGroupColor } from '../data/dataset';

interface PersonnelTableProps {
  persons: PersonSummary[];
  onSelectPerson: (personId: string) => void;
}

export const PersonnelTable: React.FC<PersonnelTableProps> = ({ persons, onSelectPerson }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'person_id' | 'bmi' | 'muscle_mass' | 'body_fat_percentage' | 'fat_change_pct' | 'muscle_change_pct'>('person_id');
  const [sortAsc, setSortAsc] = useState(true);
  const pageSize = 15;

  // Sorting
  const sortedPersons = [...persons].sort((a, b) => {
    let valA: any = a.person_id;
    let valB: any = b.person_id;

    const q3A = a.quarters.Q3 || a.quarters.Q2 || a.quarters.Q1;
    const q3B = b.quarters.Q3 || b.quarters.Q2 || b.quarters.Q1;

    if (sortField === 'bmi') {
      valA = q3A?.bmi ?? 0;
      valB = q3B?.bmi ?? 0;
    } else if (sortField === 'muscle_mass') {
      valA = q3A?.muscle_mass ?? 0;
      valB = q3B?.muscle_mass ?? 0;
    } else if (sortField === 'body_fat_percentage') {
      valA = q3A?.body_fat_percentage ?? 0;
      valB = q3B?.body_fat_percentage ?? 0;
    } else if (sortField === 'fat_change_pct') {
      valA = a.fatPercentageChangePct ?? 999;
      valB = b.fatPercentageChangePct ?? 999;
    } else if (sortField === 'muscle_change_pct') {
      valA = a.muscleMassChangePct ?? -999;
      valB = b.muscleMassChangePct ?? -999;
    }

    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const totalPages = Math.ceil(sortedPersons.length / pageSize) || 1;
  const paginatedPersons = sortedPersons.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <section className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              ทำเนียบบุคลากรและประวัติการวัดผล 3 ไตรมาส (Personnel Directory)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
              <Percent className="w-2.5 h-2.5" />
              พร้อม % ผลการเปลี่ยนแปลง
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            แสดงข้อมูลบุคลากรทั้งหมด {persons.length} ท่าน พร้อมสถานะความครบถ้วนของข้อมูล (#N/A หากขาดการตรวจ) และอัตราการเปลี่ยนแปลง (%)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th
                  onClick={() => handleSort('person_id')}
                  className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Person ID</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-4">กลุ่ม BMI</th>
                <th className="py-2.5 px-4 text-center">ส่วนสูง (cm)</th>
                <th className="py-2.5 px-4 text-center">Q1 BMI (%Fat)</th>
                <th className="py-2.5 px-4 text-center">Q2 BMI (%Fat)</th>
                <th
                  onClick={() => handleSort('bmi')}
                  className="py-2.5 px-4 text-center bg-blue-50 text-blue-900 cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Q3 BMI (%Fat)</span>
                    <ArrowUpDown className="h-3 w-3 text-blue-700" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('muscle_mass')}
                  className="py-2.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>กล้ามเนื้อ Q3</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-4 text-center">ไขมันช่องท้อง Q3</th>
                <th
                  onClick={() => handleSort('fat_change_pct')}
                  className="py-2.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>% Δ ไขมัน (Q3 vs Q1)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('muscle_change_pct')}
                  className="py-2.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>% Δ กล้ามเนื้อ (Q3 vs Q1)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-4 text-center">สถานะ</th>
                <th className="py-2.5 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPersons.map((p) => {
                const q1 = p.quarters.Q1;
                const q2 = p.quarters.Q2;
                const q3 = p.quarters.Q3;

                return (
                  <tr
                    key={p.person_id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onSelectPerson(p.person_id)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {p.person_id}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${getBMIGroupColor(
                          p.bmiGroup
                        )}`}
                      >
                        {p.bmiGroup}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">{p.height}</td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {q1?.bmi ? (
                        <span>
                          {q1.bmi.toFixed(1)}{' '}
                          <span className="text-slate-400">({q1.body_fat_percentage}%)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold bg-slate-100 px-1 py-0.5 rounded">#N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {q2?.bmi ? (
                        <span>
                          {q2.bmi.toFixed(1)}{' '}
                          <span className="text-slate-400">({q2.body_fat_percentage}%)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold bg-slate-100 px-1 py-0.5 rounded">#N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-xs bg-emerald-50/40 text-emerald-950">
                      {q3?.bmi ? (
                        <span>
                          {q3.bmi.toFixed(1)}{' '}
                          <span className="text-emerald-700">({q3.body_fat_percentage}%)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold bg-slate-100 px-1 py-0.5 rounded">#N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-800">
                      {q3?.muscle_mass ? `${q3.muscle_mass} kg` : <span className="text-slate-400 font-bold">#N/A</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {q3?.visceral_fat ? (
                        <span
                          className={`font-semibold px-1.5 py-0.5 rounded ${
                            q3.visceral_fat >= 10
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-50 text-purple-800'
                          }`}
                        >
                          {q3.visceral_fat} Lv
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">#N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {p.fatPercentageChangePct !== null ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold ${
                            p.fatPercentageChangePct <= 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.fatPercentageChangePct <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {p.fatPercentageChangePct > 0 ? `+${p.fatPercentageChangePct}` : p.fatPercentageChangePct}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">#N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {p.muscleMassChangePct !== null ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold ${
                            p.muscleMassChangePct >= 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.muscleMassChangePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {p.muscleMassChangePct > 0 ? `+${p.muscleMassChangePct}` : p.muscleMassChangePct}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">#N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.completeness === 'complete' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ครบ 3 ไตรมาส
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          มี #N/A
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPerson(p.person_id);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="ดูรายละเอียดเชิงลึก"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            แสดงหน้า <strong>{currentPage}</strong> จาก <strong>{totalPages}</strong> (รวมทั้งหมด {sortedPersons.length} รายการ)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

