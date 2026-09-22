import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  Check,
  RefreshCw,
  AlertCircle,
  Link as LinkIcon,
  Globe,
  FileText,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  FileDown
} from 'lucide-react';
import { BodyCompositionRecord, Quarter } from '../types';
import {
  fetchAllSheetsFromSpreadsheet,
  parseHealthRecordsCsv,
  detectQuarterFromName,
  MultiSheetFetchResult
} from '../utils/csvParser';

interface DataImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: BodyCompositionRecord[];
  currentSheetUrl?: string;
  onImportNewRecords: (records: BodyCompositionRecord[], sheetUrl?: string, mode?: 'custom' | 'sheet_live') => void;
  onResetToDefault: () => void;
  onOpenPdfReport?: () => void;
  mode: 'default' | 'custom' | 'sheet_live';
}

export const DataImportExportModal: React.FC<DataImportExportModalProps> = ({
  isOpen,
  onClose,
  records,
  currentSheetUrl = '',
  onImportNewRecords,
  onResetToDefault,
  onOpenPdfReport,
  mode,
}) => {
  const [activeTab, setActiveTab] = useState<'sheet_url' | 'upload_file' | 'paste_csv' | 'export'>('sheet_url');
  const [sheetUrlInput, setSheetUrlInput] = useState(currentSheetUrl);
  const [customTabsInput, setCustomTabsInput] = useState('Q1, Q2, Q3, ไตรมาส 1, ไตรมาส 2, ไตรมาส 3');
  const [showAdvancedTabs, setShowAdvancedTabs] = useState(false);
  const [pastedCsv, setPastedCsv] = useState('');
  const [pastedQuarter, setPastedQuarter] = useState<'AUTO' | 'Q1' | 'Q2' | 'Q3'>('AUTO');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [lastFetchResult, setLastFetchResult] = useState<MultiSheetFetchResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!isOpen) return null;

  // 1. Fetch & Parse from Google Sheets (Auto Multi-Sheet)
  const handleFetchGoogleSheets = async () => {
    if (!sheetUrlInput.trim()) {
      setStatusMessage({ text: 'กรุณาวางลิงก์ Google Sheet หรือ Apps Script URL', type: 'error' });
      return;
    }

    setIsLoading(true);
    setLoadingProgress('กำลังเชื่อมต่อ Google Spreadsheet...');
    setStatusMessage(null);
    setLastFetchResult(null);

    try {
      const customTabList = customTabsInput
        .split(/[,;\n]/)
        .map((t) => t.trim())
        .filter(Boolean);

      const result = await fetchAllSheetsFromSpreadsheet(sheetUrlInput, customTabList, (msg) => {
        setLoadingProgress(msg);
      });

      setLastFetchResult(result);

      if (result.records.length === 0) {
        throw new Error(
          'ไม่พบข้อมูลในชีทที่ระบุ กรุณาตรวจสอบว่าแชร์สิทธิ์เป็น "ทุกคนที่มีลิงก์ (Anyone with the link)" และชื่อแท็บตรงกับ Q1, Q2, Q3'
        );
      }

      onImportNewRecords(result.records, sheetUrlInput.trim(), 'sheet_live');

      const tabsFound = result.fetchedTabs.join(', ') || 'ค่าเริ่มต้น';
      const qSummary = `Q1: ${result.quarterCounts.Q1.toLocaleString()} | Q2: ${result.quarterCounts.Q2.toLocaleString()} | Q3: ${result.quarterCounts.Q3.toLocaleString()}`;

      setStatusMessage({
        text: `ดึงข้อมูลครบทุกชีทสำเร็จ รวม ${result.records.length.toLocaleString()} รายการ (${qSummary}) จากแท็บ [${tabsFound}]`,
        type: 'success',
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Fetch multi-sheet error:', err);
      setStatusMessage({
        text: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลชีท กรุณาตรวจสิทธิ์การเข้าถึงไฟล์',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  };

  // 2. Handle Multiple File Upload (.csv / .tsv / .json)
  const handleMultipleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setStatusMessage({ text: `กำลังอ่านข้อมูล ${files.length} ไฟล์พร้อมกัน...`, type: 'info' });

    const allUploadedRecords: BodyCompositionRecord[] = [];
    const recordMap = new Map<string, BodyCompositionRecord>();
    let filesProcessed = 0;

    Array.from(files).forEach((file: File) => {
      const fallbackQuarter = detectQuarterFromName(file.name);
      const reader = new FileReader();

      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          let parsed: BodyCompositionRecord[] = [];

          if (file.name.endsWith('.json')) {
            const json = JSON.parse(content);
            parsed = json.records || (Array.isArray(json) ? json : []);
          } else {
            parsed = parseHealthRecordsCsv(content, fallbackQuarter);
          }

          parsed.forEach((r) => {
            const key = `${r.person_id}_${r.quarter}`;
            recordMap.set(key, r);
          });
        } catch (err) {
          console.warn('File parse error:', file.name, err);
        } finally {
          filesProcessed++;
          if (filesProcessed === files.length) {
            const finalRecords = Array.from(recordMap.values());
            if (finalRecords.length === 0) {
              setStatusMessage({ text: 'ไม่พบข้อมูลที่ถูกต้องในไฟล์ กรุณาตรวจสอบหัวตาราง', type: 'error' });
              setIsLoading(false);
              return;
            }

            onImportNewRecords(finalRecords, undefined, 'custom');

            const q1Count = finalRecords.filter((r) => r.quarter === 'Q1').length;
            const q2Count = finalRecords.filter((r) => r.quarter === 'Q2').length;
            const q3Count = finalRecords.filter((r) => r.quarter === 'Q3').length;

            setStatusMessage({
              text: `รวมข้อมูลจาก ${files.length} ไฟล์สำเร็จ รวม ${finalRecords.length.toLocaleString()} รายการ (Q1: ${q1Count}, Q2: ${q2Count}, Q3: ${q3Count}) บันทึกเรียบร้อย!`,
              type: 'success',
            });
            setIsLoading(false);

            setTimeout(() => {
              onClose();
            }, 1800);
          }
        }
      };

      reader.onerror = () => {
        filesProcessed++;
        if (filesProcessed === files.length) {
          setIsLoading(false);
        }
      };

      reader.readAsText(file);
    });
  };

  // 3. Handle Pasted CSV
  const handleParsePastedCsv = () => {
    if (!pastedCsv.trim()) {
      setStatusMessage({ text: 'กรุณาวางข้อความข้อมูล CSV ก่อนกดนำเข้า', type: 'error' });
      return;
    }

    const fallbackQ = pastedQuarter === 'AUTO' ? undefined : (pastedQuarter as Quarter);
    const parsed = parseHealthRecordsCsv(pastedCsv, fallbackQ);
    if (parsed.length === 0) {
      setStatusMessage({ text: 'ไม่สามารถแปลงข้อมูลได้ กรุณาตรวจสอบว่ามีหัวตาราง person_id, weight, etc.', type: 'error' });
      return;
    }

    onImportNewRecords(parsed, undefined, 'custom');
    const q1Count = parsed.filter((r) => r.quarter === 'Q1').length;
    const q2Count = parsed.filter((r) => r.quarter === 'Q2').length;
    const q3Count = parsed.filter((r) => r.quarter === 'Q3').length;

    setStatusMessage({
      text: `นำเข้าสำเร็จ ${parsed.length.toLocaleString()} รายการ (Q1: ${q1Count}, Q2: ${q2Count}, Q3: ${q3Count}) อัปเดตและบันทึก Dashboard แล้ว`,
      type: 'success',
    });

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // 4. Export CSV
  const handleExportCsv = (quarter: string) => {
    const targetRecords = quarter === 'ALL' ? records : records.filter((r) => r.quarter === quarter);
    const headers = [
      'person_id',
      'quarter',
      'height',
      'weight',
      'muscle_mass',
      'bmi',
      'body_fat_percentage',
      'fat_mass',
      'visceral_fat',
      'department',
    ];
    const rows = targetRecords.map((r) => [
      r.person_id,
      r.quarter,
      r.height ?? '',
      r.weight ?? '',
      r.muscle_mass ?? '',
      r.bmi ?? '',
      r.body_fat_percentage ?? '',
      r.fat_mass ?? '',
      r.visceral_fat ?? '',
      r.department ?? '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `body_composition_${quarter}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ดึงและเชื่อมต่อข้อมูลทุกชีท (Multi-Sheet Google Sync &amp; Data Hub)
              </h3>
              <p className="text-xs text-slate-500">
                ดึงข้อมูลครบทุกแท็บ (Q1, Q2, Q3) อัตโนมัติจาก Google Sheet เดียวกัน หรืออัปโหลดไฟล์รวม
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('sheet_url'); setStatusMessage(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sheet_url'
                ? 'bg-white text-emerald-700 border-slate-200 -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>เชื่อมต่อ Google Sheets ทุกแท็บ (Live Sync)</span>
          </button>

          <button
            onClick={() => { setActiveTab('upload_file'); setStatusMessage(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'upload_file'
                ? 'bg-white text-indigo-700 border-slate-200 -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>อัปโหลดหลายไฟล์พร้อมกัน (Multiple CSV)</span>
          </button>

          <button
            onClick={() => { setActiveTab('paste_csv'); setStatusMessage(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'paste_csv'
                ? 'bg-white text-blue-700 border-slate-200 -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>วางข้อความ CSV</span>
          </button>

          <button
            onClick={() => { setActiveTab('export'); setStatusMessage(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-white text-slate-900 border-slate-200 -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>ส่งออกข้อมูล (Export)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: Google Sheets URL with Multi-Sheet Auto-Scan */}
          {activeTab === 'sheet_url' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  ดึงข้อมูลครบทุกแท็บชีท (Q1, Q2, Q3) ในคลิกเดียว
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  ระบบจะสแกนและดึงข้อมูลจากทุกแท็บใน Google Spreadsheet ของคุณโดยอัตโนมัติ (เช่น แท็บ <strong>Q1</strong>, <strong>Q2</strong>, <strong>Q3</strong> หรือ <strong>ไตรมาส 1, 2, 3</strong>) แล้วรวมเป็นชุดข้อมูลเดียวเพื่อนำมาเปรียบเทียบการเปลี่ยนแปลง
                </p>
                <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
                  <span>✓ ตรวจจับชื่อแท็บอัตโนมัติ</span>
                  <span>•</span>
                  <span>✓ จัดกลุ่มข้อมูลไตรมาสอัตโนมัติ</span>
                  <span>•</span>
                  <span>✓ บันทึกถาวรลงระบบ</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  URL ของ Google Spreadsheet:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit..."
                      value={sheetUrlInput}
                      onChange={(e) => setSheetUrlInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-2xs"
                    />
                  </div>
                  <button
                    onClick={handleFetchGoogleSheets}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'กำลังดึงทุกชีท...' : 'ดึงข้อมูลทุกชีท'}</span>
                  </button>
                </div>
                {loadingProgress && (
                  <p className="mt-1.5 text-xs text-emerald-700 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {loadingProgress}
                  </p>
                )}
              </div>

              {/* Advanced Tab Names toggle */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedTabs(!showAdvancedTabs)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-left text-xs font-bold text-slate-700 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    กำหนดชื่อแท็บในชีท (Custom Tab Names) - หากชื่อแท็บต่างจากมาตรฐาน
                  </span>
                  {showAdvancedTabs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvancedTabs && (
                  <div className="p-4 bg-white space-y-2 border-t border-slate-200">
                    <label className="block text-[11px] text-slate-600">
                      ระบุชื่อแท็บในไฟล์ของคุณ (คั่นด้วยเครื่องหมายจุลภาค <code>,</code>):
                    </label>
                    <input
                      type="text"
                      value={customTabsInput}
                      onChange={(e) => setCustomTabsInput(e.target.value)}
                      placeholder="Q1, Q2, Q3, ไตรมาส 1, ไตรมาส 2, ไตรมาส 3, Sheet1"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono"
                    />
                    <p className="text-[10px] text-slate-400">
                      * ระบบจะทำการค้นหาและดึงข้อมูลจากชื่อแท็บเหล่านี้มาประกอบกันเป็น 3 ไตรมาส
                    </p>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800">💡 การตั้งค่าการแชร์ใน Google Sheet:</span>
                <p>
                  1. ไปที่ Google Sheet ของคุณ → กดปุ่ม <strong>แชร์ (Share)</strong> ที่มุมขวาบน<br />
                  2. เปลี่ยนเป็น <strong>"ทุกคนที่มีลิงก์ (Anyone with the link) มีสิทธิ์อ่าน"</strong><br />
                  3. คัดลอกลิงก์มาวางในช่องด้านบน แล้วกด <strong>"ดึงข้อมูลทุกชีท"</strong>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Multiple File Upload */}
          {activeTab === 'upload_file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-2xl p-8 text-center bg-indigo-50/20 hover:bg-indigo-50/40 transition-colors">
                <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-slate-800 mb-1">
                  เลือกหลายไฟล์พร้อมกัน (Multiple Files: Q1, Q2, Q3)
                </h4>
                <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
                  คุณสามารถกดเลือกไฟล์ <code>Q1.csv</code>, <code>Q2.csv</code>, <code>Q3.csv</code> พร้อมกันได้เลย ระบบจะรวมข้อมูลของทุกไตรมาสเข้าด้วยกันให้อัตโนมัติ
                </p>
                <label className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>เลือกหลายไฟล์จากคอมพิวเตอร์</span>
                  <input
                    type="file"
                    multiple
                    accept=".csv,.tsv,.txt,.json"
                    onChange={handleMultipleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: Paste CSV */}
          {activeTab === 'paste_csv' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700">
                  วางข้อความข้อมูล CSV หรือ Tab-separated:
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">ระบุไตรมาส:</span>
                  <select
                    value={pastedQuarter}
                    onChange={(e) => setPastedQuarter(e.target.value as any)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-700"
                  >
                    <option value="AUTO">ตรวจจับจากคอลัมน์ (Auto)</option>
                    <option value="Q1">กำหนดเป็น Q1 ทั้งหมด</option>
                    <option value="Q2">กำหนดเป็น Q2 ทั้งหมด</option>
                    <option value="Q3">กำหนดเป็น Q3 ทั้งหมด</option>
                  </select>
                </div>
              </div>
              <textarea
                rows={6}
                placeholder="person_id,quarter,height,weight,muscle_mass,bmi,body_fat_percentage,fat_mass,visceral_fat&#10;43666,Q1,160,58.8,22.5,22.97,29.1,17.1,5&#10;43666,Q2,160,60.3,22.2,23.55,31.8,19.2,7&#10;43666,Q3,160,56.6,21.7,22.11,29.1,16.5,6"
                value={pastedCsv}
                onChange={(e) => setPastedCsv(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleParsePastedCsv}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  ประมวลผลและอัปเดต Dashboard
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Export */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Executive PDF Report Card */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 sm:p-5 rounded-xl border border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <FileDown className="h-4 w-4 text-emerald-400" />
                    ส่งออกรายงานสรุปผู้บริหาร (Executive Summary PDF Report)
                  </h4>
                  <p className="text-xs text-blue-150 leading-relaxed max-w-xl">
                    สร้างเอกสารรายงาน PDF สรุป 5 ตัวชี้วัดสำคัญ (กล้ามเนื้อ, ไขมัน, ไขมันช่องท้อง, BMI) พร้อมกราฟเปรียบเทียบแนวโน้ม 3 ไตรมาส และข้อเสนอแนะเชิงกลยุทธ์ เพื่อนำเสนอต่อผู้บริหาร
                  </p>
                </div>
                {onOpenPdfReport && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPdfReport();
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>เปิดหน้าส่งออก PDF</span>
                  </button>
                )}
              </div>

              {/* CSV Download Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-emerald-600" /> ดาวน์โหลดชุดข้อมูล CSV
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  ส่งออกข้อมูลที่กำลังแสดงอยู่ทั้งหมด ({records.length.toLocaleString()} รายการ) เป็นไฟล์ CSV เพื่อนำไปเปิดใน Excel หรือ Google Sheet ได้ทันที
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Q1', 'Q2', 'Q3', 'ALL'].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleExportCsv(q)}
                      className="px-3 py-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-medium text-slate-800 transition-colors text-center shadow-2xs"
                    >
                      {q === 'ALL' ? 'ดาวน์โหลดทั้งหมด (All Quarters)' : `ข้อมูลเฉพาะชีท ${q}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reset to default dataset section */}
          {mode !== 'default' && (
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 p-3 rounded-xl">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">ต้องการกลับไปใช้ชุดข้อมูลมาตรฐาน?</span>
                <p className="text-[11px] text-slate-500">โหลดชุดข้อมูลตัวอย่างองค์กร 3 ไตรมาส (2,721 ท่าน)</p>
              </div>
              <button
                onClick={() => {
                  onResetToDefault();
                  setStatusMessage({ text: 'สลับกลับเป็นชุดข้อมูลมาตรฐานองค์กรเรียบร้อยแล้ว', type: 'success' });
                  setTimeout(() => onClose(), 1200);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตข้อมูลเดิม</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-emerald-700">
            <Database className="w-3.5 h-3.5" />
            ข้อมูลจะถูกบันทึกอัตโนมัติ ไม่สูญหายเมื่อรีเฟรชหรือสลับหน้า
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
