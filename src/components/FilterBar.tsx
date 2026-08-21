import React from 'react';
import { Building2, User, Search, Filter, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { BMIGroup, FilterState, PersonSummary, Quarter } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  persons: PersonSummary[];
  onSelectPerson: (personId: string | null) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  persons,
  onSelectPerson,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* View Mode Toggle: Organization vs Individual */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => {
                onFilterChange({ viewMode: 'organization' });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filters.viewMode === 'organization'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>ภาพรวมองค์กร</span>
            </button>
            <button
              onClick={() => {
                const defaultPerson = filters.selectedPersonId || persons[0]?.person_id || null;
                onFilterChange({ viewMode: 'individual', selectedPersonId: defaultPerson });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filters.viewMode === 'individual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>ดูเป็นรายบุคคล</span>
            </button>
          </div>

          {/* Quarter Indicator */}
          <div className="hidden sm:flex items-center text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            ไตรมาสล่าสุด: <strong className="ml-1 text-slate-800">Q3 (มีนาคม)</strong>
          </div>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Individual Person Autocomplete / Dropdown */}
          {filters.viewMode === 'individual' ? (
            <div className="relative min-w-[220px]">
              <select
                value={filters.selectedPersonId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onSelectPerson(val || null);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- เลือกบุคลากร ({persons.length} ท่าน) --</option>
                {persons.map((p) => (
                  <option key={p.person_id} value={p.person_id}>
                    ID: {p.person_id} ({p.bmiGroup})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial min-w-[160px] sm:min-w-[180px]">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหา Person ID..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* BMI Group Filter */}
          <div className="flex items-center gap-1">
            <select
              value={filters.bmiGroupFilter}
              onChange={(e) => onFilterChange({ bmiGroupFilter: e.target.value as any })}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">กลุ่ม BMI ทั้งหมด</option>
              <option value="ลูกค้ารายย่อย">ลูกค้ารายย่อย (&lt;18.5)</option>
              <option value="ลูกค้าทั่วไป">ลูกค้าทั่วไป (18.5-22.9)</option>
              <option value="ลูกค้ารายใหญ่">ลูกค้ารายใหญ่ (&gt;23)</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1">
            <select
              value={filters.riskFilter}
              onChange={(e) => onFilterChange({ riskFilter: e.target.value as any })}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">ระดับความเสี่ยงทั้งหมด</option>
              <option value="high_visceral">⚠️ ไขมันช่องท้องสูง (&gt;9)</option>
              <option value="high_fat">⚠️ เปอร์เซ็นต์ไขมันสูง (&gt;30%)</option>
              <option value="healthy">✅ เกณฑ์สุขภาพมาตรฐาน</option>
            </select>
          </div>

          {/* Data Completeness (#N/A Handling) */}
          <div className="flex items-center gap-1">
            <select
              value={filters.completenessFilter}
              onChange={(e) => onFilterChange({ completenessFilter: e.target.value as any })}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">ความครบถ้วนข้อมูล (ทั้งหมด)</option>
              <option value="complete">ครบทั้ง 3 ไตรมาส</option>
              <option value="partial">มีข้อมูลไม่ครบ (มี #N/A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter summary tags if filtered */}
      {(filters.searchQuery || filters.bmiGroupFilter !== 'all' || filters.riskFilter !== 'all' || filters.completenessFilter !== 'all') && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center flex-wrap gap-2 text-xs">
          <span className="text-slate-500 font-medium text-[11px]">ตัวกรองที่เลือก:</span>
          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
              ค้นหา: "{filters.searchQuery}"
              <button onClick={() => onFilterChange({ searchQuery: '' })}>
                <X className="h-3 w-3 text-slate-400 hover:text-slate-600" />
              </button>
            </span>
          )}
          {filters.bmiGroupFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[11px]">
              กลุ่ม: {filters.bmiGroupFilter}
              <button onClick={() => onFilterChange({ bmiGroupFilter: 'all' })}>
                <X className="h-3 w-3 text-blue-500 hover:text-blue-700" />
              </button>
            </span>
          )}
          {filters.riskFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
              ความเสี่ยง: {filters.riskFilter}
              <button onClick={() => onFilterChange({ riskFilter: 'all' })}>
                <X className="h-3 w-3 text-amber-500 hover:text-amber-700" />
              </button>
            </span>
          )}
          {filters.completenessFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px]">
              สถานะข้อมูล: {filters.completenessFilter === 'complete' ? 'ครบ 3 ไตรมาส' : 'มี #N/A'}
              <button onClick={() => onFilterChange({ completenessFilter: 'all' })}>
                <X className="h-3 w-3 text-indigo-500 hover:text-indigo-700" />
              </button>
            </span>
          )}
          <button
            onClick={() =>
              onFilterChange({
                searchQuery: '',
                bmiGroupFilter: 'all',
                riskFilter: 'all',
                completenessFilter: 'all',
              })
            }
            className="text-[11px] text-rose-600 hover:underline font-bold ml-1"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};
