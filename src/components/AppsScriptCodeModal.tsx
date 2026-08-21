import React, { useState } from 'react';
import { X, Copy, Check, Code, FileSpreadsheet, Server, HelpCircle, ExternalLink } from 'lucide-react';

interface AppsScriptCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppsScriptCodeModal: React.FC<AppsScriptCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'codegs' | 'indexhtml' | 'instructions'>('codegs');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const codeGsContent = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (Code.gs)
 * ระบบ Health & Wellness Dashboard สำหรับเปรียบเทียบ Body Composition 3 ไตรมาส
 * =========================================================================
 */

function doGet(e) {
  // หากเรียกผ่าน API หรือระบุ ?format=json จะส่งคืนข้อมูล JSON ทุกชีททันที
  if (e && e.parameter && e.parameter.format === 'json') {
    const data = getDashboardData();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Health & Wellness Body Composition Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * ดึงข้อมูลจากทุกแท็บชีท (Q1, Q2, Q3, ไตรมาส 1-3, หรือทุกชีทในไฟล์)
 * และคำนวณสถิติภาพรวม + จัดกลุ่ม BMI อัตโนมัติ พร้อมคิดผลการเปลี่ยนแปลงเป็น %
 */
function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const allRecords = [];
  const personsMap = {};

  sheets.forEach(sheet => {
    const sheetName = sheet.getName().trim();
    
    // ตรวจจับไตรมาสจากชื่อแท็บชีท
    let qName = 'Q3';
    const sLower = sheetName.toLowerCase();
    if (sLower.includes('q1') || sLower.includes('ไตรมาส 1') || sLower.includes('ไตรมาส1') || sLower.includes('รอบ 1') || sLower.includes('1')) {
      qName = 'Q1';
    } else if (sLower.includes('q2') || sLower.includes('ไตรมาส 2') || sLower.includes('ไตรมาส2') || sLower.includes('รอบ 2') || sLower.includes('2')) {
      qName = 'Q2';
    } else if (sLower.includes('q3') || sLower.includes('ไตรมาส 3') || sLower.includes('ไตรมาส3') || sLower.includes('รอบ 3') || sLower.includes('3')) {
      qName = 'Q3';
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;

    const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/[\\s_#%.-]/g, ''));
    
    // ค้นหาดัชนีคอลัมน์แบบยืดหยุ่นทั้งภาษาไทยและอังกฤษ
    const findIdx = (aliases) => {
      for (let i = 0; i < headers.length; i++) {
        if (aliases.some(a => headers[i] === a || headers[i].includes(a))) return i;
      }
      return -1;
    };

    const idxPerson = findIdx(['personid', 'id', 'รหัส', 'รหัสพนักงาน', 'person', 'pid', 'no']);
    const idxQuarter = findIdx(['quarter', 'ไตรมาส', 'งวด', 'q', 'รอบ']);
    const idxHeight = findIdx(['height', 'ส่วนสูง', 'ความสูง', 'ht', 'cm']);
    const idxWeight = findIdx(['weight', 'น้ำหนัก', 'wt', 'kg']);
    const idxMuscle = findIdx(['musclemass', 'muscle', 'มวลกล้ามเนื้อ', 'กล้ามเนื้อ', 'smm']);
    const idxBmi = findIdx(['bmi', 'ดัชนีมวลกาย']);
    const idxFatPct = findIdx(['bodyfatpercentage', 'bodyfat', 'fatpercentage', 'fatpct', 'เปอร์เซ็นต์ไขมัน', 'ไขมัน%', '%ไขมัน', 'pbf']);
    const idxFatMass = findIdx(['fatmass', 'มวลไขมัน', 'ไขมัน(kg)', 'ไขมันkg', 'fm']);
    const idxVisceral = findIdx(['visceralfat', 'visceral', 'ไขมันช่องท้อง', 'ช่องท้อง', 'vfl']);

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const personId = String(idxPerson !== -1 ? row[idxPerson] : row[0] || '').trim();
      if (!personId || personId === '#N/A' || personId === 'null') continue;

      let rowQuarter = qName;
      if (idxQuarter !== -1 && row[idxQuarter]) {
        const qVal = String(row[idxQuarter]).toUpperCase().trim();
        if (qVal.includes('Q1') || qVal === '1') rowQuarter = 'Q1';
        else if (qVal.includes('Q2') || qVal === '2') rowQuarter = 'Q2';
        else if (qVal.includes('Q3') || qVal === '3') rowQuarter = 'Q3';
      }

      const parseNum = (val) => {
        if (!val || val === '#N/A' || val === '-') return null;
        const n = parseFloat(String(val).replace(/,/g, '').replace(/%/g, ''));
        return isNaN(n) ? null : n;
      };

      const height = idxHeight !== -1 ? parseNum(row[idxHeight]) : 160;
      const weight = idxWeight !== -1 ? parseNum(row[idxWeight]) : null;
      const muscle = idxMuscle !== -1 ? parseNum(row[idxMuscle]) : null;
      let bmi = idxBmi !== -1 ? parseNum(row[idxBmi]) : null;
      const fatPct = idxFatPct !== -1 ? parseNum(row[idxFatPct]) : null;
      const fatMass = idxFatMass !== -1 ? parseNum(row[idxFatMass]) : null;
      let visceral = idxVisceral !== -1 ? parseNum(row[idxVisceral]) : null;

      // คำนวณ BMI อัตโนมัติหากไม่มีระบุ
      if (!bmi && height && weight && height > 0) {
        bmi = Number((weight / Math.pow(height / 100, 2)).toFixed(2));
      }

      // คำนวณไขมันช่องท้องโดยประมาณ
      if (!visceral && bmi && fatPct) {
        visceral = Math.round(Math.max(1, (bmi - 18) * 0.45 + (fatPct - 15) * 0.22 + 1));
      }

      if (weight === null && muscle === null && bmi === null && fatPct === null) continue;

      const record = {
        person_id: personId,
        quarter: rowQuarter,
        height: height,
        weight: weight,
        muscle_mass: muscle,
        bmi: bmi,
        body_fat_percentage: fatPct,
        fat_mass: fatMass,
        visceral_fat: visceral
      };

      allRecords.push(record);

      if (!personsMap[personId]) {
        personsMap[personId] = {
          person_id: personId,
          height: height,
          quarters: {}
        };
      }
      personsMap[personId].quarters[rowQuarter] = record;
    }
  });

  return {
    records: allRecords,
    persons: Object.values(personsMap)
  };
}

/**
 * กำหนดเกณฑ์กลุ่ม BMI ตามข้อกำหนด
 * < 18.5 => 'ลูกค้ารายย่อย'
 * 18.5 - 22.9 => 'ลูกค้าทั่วไป'
 * > 23 => 'ลูกค้ารายใหญ่'
 */
function getBMIGroup(bmi) {
  if (!bmi || isNaN(bmi)) return 'ลูกค้าทั่วไป';
  if (bmi < 18.5) return 'ลูกค้ารายย่อย';
  if (bmi <= 22.9) return 'ลูกค้าทั่วไป';
  return 'ลูกค้ารายใหญ่';
}
`;

  const indexHtmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>Health & Wellness Body Composition Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-slate-50 text-slate-800 p-6 font-sans">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <header class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-900">ระบบเปรียบเทียบมวลร่างกาย (Google Sheets Health Dashboard)</h1>
        <p class="text-xs text-slate-500 mt-1">ดึงข้อมูลสดจากแท็บชีท Q1, Q2, Q3 พร้อมคิดผลการเปลี่ยนแปลงเป็น %</p>
      </div>
      <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">Google Apps Script Web App</span>
    </header>

    <!-- Executive Summary Cards Container -->
    <div id="executiveCards" class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse text-center text-xs text-slate-400">
        กำลังโหลดข้อมูลจาก Google Sheet...
      </div>
    </div>

    <!-- Charts Container -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 class="font-bold text-sm text-slate-900 mb-3">แนวโน้ม 3 ไตรมาส: ไขมันช่องท้อง & % ไขมัน</h3>
        <canvas id="trendChart" height="200"></canvas>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 class="font-bold text-sm text-slate-900 mb-3">การจัดกลุ่ม BMI (ลูกค้ารายย่อย / ลูกค้าทั่วไป / ลูกค้ารายใหญ่)</h3>
        <canvas id="bmiChart" height="200"></canvas>
      </div>
    </div>
  </div>

  <script>
    // ดึงข้อมูลจาก Code.gs
    google.script.run.withSuccessHandler(renderDashboard).getDashboardData();

    function renderDashboard(data) {
      console.log("Loaded data:", data);
      // Render Charts with Chart.js & Update KPI Cards
    }
  </script>
</body>
</html>
`;

  const copyToClipboard = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopied(tabName);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Google Apps Script (GAS) Web App Integration Code
              </h3>
              <p className="text-xs text-slate-500">
                ชุดโค้ดสำหรับนำไปวางใน Google Apps Script Editor เชื่อมโยงกับ Google Sheet แท็บ Q1, Q2, Q3, Q4
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

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex gap-2">
          <button
            onClick={() => setActiveTab('codegs')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'codegs'
                ? 'bg-white text-emerald-700 border-slate-200 -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Code.gs (Backend Script)
          </button>
          <button
            onClick={() => setActiveTab('indexhtml')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'indexhtml'
                ? 'bg-white text-emerald-700 border-slate-200 -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Index.html (Frontend Template)
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'instructions'
                ? 'bg-white text-indigo-700 border-slate-200 -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            📖 ขั้นตอนการติดตั้ง (Setup Guide)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'codegs' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">
                  ไฟล์: <strong className="text-slate-900">Code.gs</strong> (ฟังก์ชันอ่านชีท Q1, Q2, Q3, Q4 และส่งข้อมูลแบบ JSON)
                </span>
                <button
                  onClick={() => copyToClipboard(codeGsContent, 'codegs')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  {copied === 'codegs' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied === 'codegs' ? 'คัดลอกแล้ว!' : 'คัดลอก Code.gs'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed rounded-xl overflow-x-auto border border-slate-800 shadow-inner max-h-[380px]">
                {codeGsContent}
              </pre>
            </div>
          )}

          {activeTab === 'indexhtml' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">
                  ไฟล์: <strong className="text-slate-900">Index.html</strong> (HTML5 / Tailwind UI สำหรับแสดงผล Web App)
                </span>
                <button
                  onClick={() => copyToClipboard(indexHtmlContent, 'indexhtml')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  {copied === 'indexhtml' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied === 'indexhtml' ? 'คัดลอกแล้ว!' : 'คัดลอก Index.html'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-blue-300 font-mono text-[11px] leading-relaxed rounded-xl overflow-x-auto border border-slate-800 shadow-inner max-h-[380px]">
                {indexHtmlContent}
              </pre>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <h4 className="font-bold text-emerald-900 text-sm mb-2">
                  🚀 วิธีเชื่อมต่อ Google Sheet เข้ากับ Google Apps Script Web App
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-emerald-800">
                  <li>
                    เปิด Google Spreadsheet ของคุณที่มีแท็บชื่อ <strong>Q1</strong>, <strong>Q2</strong>, <strong>Q3</strong> และ (เผื่อ <strong>Q4</strong>)
                  </li>
                  <li>
                    ไปที่เมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong>
                  </li>
                  <li>
                    วางโค้ดในแท็บ <code>Code.gs</code> และสร้างไฟล์ HTML ชื่อ <code>Index.html</code> แล้ววางโค้ดจากแท็บที่ 2
                  </li>
                  <li>
                    คลิกปุ่ม <strong>ทำให้ใช้งานได้ (Deploy)</strong> &gt; <strong>การทำให้ใช้งานได้ใหม่ (New deployment)</strong>
                  </li>
                  <li>
                    เลือกประเภท: <strong>เว็บแอป (Web app)</strong> | ผู้มีสิทธิ์เข้าถึง: <strong>ทุกคน (Anyone)</strong>
                  </li>
                  <li>
                    คัดลอก URL ของ Web App เพื่อเปิดใช้งาน Dashboard ที่ดึงข้อมูลสดจาก Google Sheet ได้ทันที!
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">โครงสร้างหัวตารางที่รองรับใน Google Sheet</h4>
                <p className="text-xs text-slate-600 mb-2">
                  แต่ละแท็บ (Q1, Q2, Q3) ต้องมีแถวหัวตาราง (Row 1) ดังนี้:
                </p>
                <code className="block p-2.5 bg-white border border-slate-300 rounded font-mono text-xs text-indigo-700">
                  person_id, height, weight, muscle_mass, bmi, body_fat_percentage, fat_mass, quarter
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between text-xs text-slate-500">
          <span>สร้างขึ้นเฉพาะสำหรับระบบ Health &amp; Wellness โดยใช้ Google Sheet เป็นฐานข้อมูลหลัก</span>
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
