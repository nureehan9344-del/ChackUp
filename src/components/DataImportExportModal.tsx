import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { BodyCompositionRecord } from '../types';

interface DataImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: BodyCompositionRecord[];
  onImportNewRecords: (records: BodyCompositionRecord[]) => void;
}

export const DataImportExportModal: React.FC<DataImportExportModalProps> = ({
  isOpen,
  onClose,
  records,
  onImportNewRecords,
}) => {
  const [pastedCsv, setPastedCsv] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportCsv = (quarter: string) => {
    const targetRecords = quarter === 'ALL' ? records : records.filter((r) => r.quarter === quarter);
    const headers = ['person_id', 'quarter', 'height', 'weight', 'muscle_mass', 'bmi', 'body_fat_percentage', 'fat_mass', 'visceral_fat'];
    const rows = targetRecords.map((r) => [
      r.person_id,
      r.quarter,
      r.height ?? '#N/A',
      r.weight ?? '#N/A',
      r.muscle_mass ?? '#N/A',
      r.bmi ?? '#N/A',
      r.body_fat_percentage ?? '#N/A',
      r.fat_mass ?? '#N/A',
      r.visceral_fat ?? '#N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `body_composition_${quarter}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleParseCsv = () => {
    if (!pastedCsv.trim()) {
      setImportStatus('กรุณาวางข้อความ CSV ก่อนกดนำเข้า');
      return;
    }

    try {
      const lines = pastedCsv.trim().split('\n');
      if (lines.length <= 1) {
        setImportStatus('ไม่พบแถวข้อมูลในข้อความ CSV');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const idxPerson = headers.indexOf('person_id');
      const idxQuarter = headers.indexOf('quarter');
      const idxHeight = headers.indexOf('height');
      const idxWeight = headers.indexOf('weight');
      const idxMuscle = headers.indexOf('muscle_mass');
      const idxBmi = headers.indexOf('bmi');
      const idxFatPct = headers.indexOf('body_fat_percentage');
      const idxFatMass = headers.indexOf('fat_mass');

      const parsed: BodyCompositionRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length < 2) continue;

        const personId = parts[idxPerson !== -1 ? idxPerson : 0];
        const qRaw = parts[idxQuarter !== -1 ? idxQuarter : 7] || 'Q3';
        const quarter = qRaw.includes('Q1') ? 'Q1' : qRaw.includes('Q2') ? 'Q2' : 'Q3';

        const height = parseFloat(parts[idxHeight !== -1 ? idxHeight : 1]) || 160;
        const weight = parseFloat(parts[idxWeight !== -1 ? idxWeight : 2]) || 60;
        const muscle = parseFloat(parts[idxMuscle !== -1 ? idxMuscle : 3]) || 20;
        const bmi = parseFloat(parts[idxBmi !== -1 ? idxBmi : 4]) || Number((weight / ((height / 100) ** 2)).toFixed(2));
        const fatPct = parseFloat(parts[idxFatPct !== -1 ? idxFatPct : 5]) || 25;
        const fatMass = parseFloat(parts[idxFatMass !== -1 ? idxFatMass : 6]) || Number((weight * (fatPct / 100)).toFixed(1));

        parsed.push({
          person_id: personId,
          quarter: quarter as any,
          height,
          weight,
          muscle_mass: muscle,
          bmi,
          body_fat_percentage: fatPct,
          fat_mass: fatMass,
          visceral_fat: Math.max(1, Math.round((bmi - 18) * 0.45 + (fatPct - 15) * 0.22 + 1)),
        });
      }

      if (parsed.length > 0) {
        onImportNewRecords(parsed);
        setImportStatus(`นำเข้าสำเร็จเรียบร้อย ${parsed.length} แถวข้อมูล!`);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setImportStatus('ไม่สามารถแปลงข้อมูลได้ กรุณาตรวจสอบหัวคอลัมน์');
      }
    } catch (e) {
      setImportStatus('เกิดข้อผิดพลาดในการประมวลผล CSV');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col my-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                นำเข้าและส่งออกข้อมูล (Data Sync &amp; Export)
              </h3>
              <p className="text-xs text-slate-500">
                ส่งออก CSV แยกตามไตรมาส หรือนำเข้าข้อมูลผลตรวจร่างกายชุดใหม่
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Download className="h-4 w-4 text-emerald-600" /> ส่งออกไฟล์ CSV (Download Dataset)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Q1', 'Q2', 'Q3', 'ALL'].map((q) => (
                <button
                  key={q}
                  onClick={() => handleExportCsv(q)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 transition-colors text-center"
                >
                  {q === 'ALL' ? 'ส่งออกทั้งหมด (All Quarters)' : `ข้อมูลชีท ${q}`}
                </button>
              ))}
            </div>
          </div>

          {/* Import Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-indigo-600" /> วางข้อมูล CSV เพื่ออัปเดตแบบเรียลไทม์
            </h4>
            <textarea
              rows={5}
              placeholder="วางข้อมูล CSV ที่นี่ (ตัวอย่าง: person_id,height,weight,muscle_mass,bmi,body_fat_percentage,fat_mass,quarter)"
              value={pastedCsv}
              onChange={(e) => setPastedCsv(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {importStatus && (
              <p
                className={`text-xs mt-2 font-medium ${
                  importStatus.includes('สำเร็จ') ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {importStatus}
              </p>
            )}
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleParseCsv}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                ประมวลผลและอัปเดต Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
