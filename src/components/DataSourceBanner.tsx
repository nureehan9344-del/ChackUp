import React from 'react';
import { Database, RefreshCw, FileSpreadsheet, RotateCcw, Cloud, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';

interface DataSourceBannerProps {
  mode: 'default' | 'custom' | 'sheet_live';
  totalPersons: number;
  totalRecords: number;
  lastSync: string | null;
  sheetUrl?: string;
  isSyncing: boolean;
  onSyncLive: () => void;
  onOpenDataModal: () => void;
  onResetToDefault: () => void;
}

export const DataSourceBanner: React.FC<DataSourceBannerProps> = ({
  mode,
  totalPersons,
  totalRecords,
  lastSync,
  sheetUrl,
  isSyncing,
  onSyncLive,
  onOpenDataModal,
  onResetToDefault,
}) => {
  const isCustom = mode !== 'default';

  return (
    <div
      id="datasource-banner"
      className={`rounded-2xl border p-3.5 mb-6 shadow-xs transition-all ${
        isCustom
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-emerald-300 text-slate-900'
          : 'bg-white border-slate-200 text-slate-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left Status & Details */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isCustom ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {isCustom ? <FileSpreadsheet className="w-5 h-5" /> : <Database className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-slate-900">
                {isCustom ? '📊 กำลังใช้งาน: ข้อมูลจาก Google Sheet / CSV ของคุณ' : '🏢 กำลังใช้งาน: ชุดข้อมูลมาตรฐานองค์กร 3 ไตรมาส'}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isCustom
                    ? 'bg-emerald-200/70 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <CheckCircle className="w-3 h-3 text-emerald-700" />
                บันทึกอัตโนมัติ (ไม่สูญหาย)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>บุคลากร: <strong className="text-slate-900 font-semibold">{totalPersons.toLocaleString()}</strong> ท่าน</span>
              <span className="text-slate-400">•</span>
              <span>ข้อมูลรวม: <strong className="text-slate-900 font-semibold">{totalRecords.toLocaleString()}</strong> รายการ</span>
              {lastSync && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">อัปเดตล่าสุด: {lastSync}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {sheetUrl && (
            <button
              onClick={onSyncLive}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              title="ดึงข้อมูลล่าสุดสดๆ จาก Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์จาก Sheet สด'}</span>
            </button>
          )}

          <button
            onClick={onOpenDataModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isCustom ? 'ตั้งค่า / นำเข้าชีทใหม่' : '📥 เชื่อมโยง Google Sheet ของคุณ'}</span>
          </button>

          {isCustom && (
            <button
              onClick={onResetToDefault}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors"
              title="สลับกลับไปใช้ชุดข้อมูลมาตรฐาน (2,721 ท่าน)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>คืนค่าตั้งต้น</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
