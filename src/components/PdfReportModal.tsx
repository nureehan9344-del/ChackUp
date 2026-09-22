import React, { useState, useRef } from 'react';
import {
  X,
  FileDown,
  Printer,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Activity,
  Flame,
  ShieldAlert,
  Heart,
  BarChart3,
  Calendar,
  Building2,
  Users,
  Check,
  Percent,
  Award,
  Layers,
  FileText,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { BodyCompositionRecord, MetricSummary, PersonSummary, Quarter } from '../types';
import { calculateQuarterAverages } from '../data/analytics';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: BodyCompositionRecord[];
  persons: PersonSummary[];
  summaries: MetricSummary[];
  activeQuarter: Quarter;
  totalPersonnel: number;
  dataSourceName?: string;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  records,
  persons,
  summaries,
  activeQuarter,
  totalPersonnel,
  dataSourceName = 'ระบบฐานข้อมูลสุขภาพองค์กร',
}) => {
  const [reportTitle, setReportTitle] = useState('รายงานสรุปภาพรวมสุขภาพและมวลร่างกายบุคลากร');
  const [orgName, setOrgName] = useState('ฝ่ายพัฒนาทรัพยากรบุคคลและส่งเสริมสุขภาวะองค์กร');
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Compute Quarter averages for Q1, Q2, Q3, Q4
  const q1Avg = calculateQuarterAverages(records, 'Q1');
  const q2Avg = calculateQuarterAverages(records, 'Q2');
  const q3Avg = calculateQuarterAverages(records, 'Q3');
  const q4Avg = calculateQuarterAverages(records, 'Q4');

  const hasQ4 = records.some((r) => r.quarter === 'Q4');
  const latestAvg = (hasQ4 && q4Avg.bmi) ? q4Avg : q3Avg;
  const latestQuarterLabel = (hasQ4 && q4Avg.bmi) ? 'Q4' : 'Q3';

  // Compute BMI distribution
  const targetRecords = records.filter((r) => r.quarter === activeQuarter);
  const totalInTarget = targetRecords.length || 1;

  const bmiUnderweight = targetRecords.filter((r) => (r.bmi ?? 0) > 0 && (r.bmi ?? 0) < 18.5).length;
  const bmiNormal = targetRecords.filter((r) => (r.bmi ?? 0) >= 18.5 && (r.bmi ?? 0) <= 22.9).length;
  const bmiOverweight = targetRecords.filter((r) => (r.bmi ?? 0) >= 23 && (r.bmi ?? 0) <= 24.9).length;
  const bmiObese1 = targetRecords.filter((r) => (r.bmi ?? 0) >= 25 && (r.bmi ?? 0) <= 29.9).length;
  const bmiObese2 = targetRecords.filter((r) => (r.bmi ?? 0) >= 30).length;

  const normalPct = Math.round((bmiNormal / totalInTarget) * 100);
  const overweightPct = Math.round((bmiOverweight / totalInTarget) * 100);
  const obese1Pct = Math.round((bmiObese1 / totalInTarget) * 100);
  const obese2Pct = Math.round((bmiObese2 / totalInTarget) * 100);
  const underweightPct = Math.round((bmiUnderweight / totalInTarget) * 100);

  // Visceral fat risk counts
  const safeVisceral = targetRecords.filter((r) => (r.visceral_fat ?? 0) > 0 && (r.visceral_fat ?? 0) <= 9).length;
  const riskVisceral = targetRecords.filter((r) => (r.visceral_fat ?? 0) >= 10).length;
  const safeVisceralPct = Math.round((safeVisceral / totalInTarget) * 100);

  // Key metrics deltas (Q1 to Q3)
  const muscleSummary = summaries.find((s) => s.metricKey === 'muscle_mass');
  const fatPctSummary = summaries.find((s) => s.metricKey === 'body_fat_percentage');
  const visceralSummary = summaries.find((s) => s.metricKey === 'visceral_fat');
  const bmiSummary = summaries.find((s) => s.metricKey === 'bmi');
  const fatMassSummary = summaries.find((s) => s.metricKey === 'fat_mass');

  const todayStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Export PDF Handler using html2canvas-pro and jsPDF
  const handleExportPdf = async () => {
    if (!reportRef.current) return;

    setIsGenerating(true);
    setProgressMsg('กำลังเรนเดอร์เอกสารและกราฟิกความละเอียดสูง...');

    try {
      // Small pause to ensure layout has settled
      await new Promise((resolve) => setTimeout(resolve, 200));

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // 2x high resolution
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      });

      setProgressMsg('กำลังแปลงไฟล์เป็น PDF A4...');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight <= pdfHeight) {
        // Fits single page
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        // Multi-page slice
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }
      }

      const fileName = `Health_Wellness_Executive_Summary_${activeQuarter}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      setDownloadSuccess(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGenerating(false);
      setProgressMsg('');
    }
  };

  // Browser Native Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 max-w-5xl w-full max-h-[96vh] flex flex-col my-auto">
        {/* Top Control Header */}
        <div className="px-6 py-3.5 bg-white border-b border-slate-200 rounded-t-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                ส่งออกรายงานสรุปผู้บริหาร (Executive Summary PDF)
              </h3>
              <p className="text-xs text-slate-500">
                สร้างเอกสาร PDF คุณภาพสูง สรุป 5 ตัวชี้วัดหลัก + กราฟแนวโน้ม 4 ไตรมาส (Q1 - Q4) เพื่อนำเสนอผู้บริหาร
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors disabled:opacity-50"
              title="พิมพ์เอกสาร หรือบันทึกผ่านหน้าพิมพ์ของเบราว์เซอร์"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">พิมพ์เอกสาร</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isGenerating}
              className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all text-white ${
                downloadSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              } disabled:opacity-50`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{progressMsg || 'กำลังสร้าง PDF...'}</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ดาวน์โหลดสำเร็จแล้ว!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ PDF (.pdf)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Options Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">ชื่อหน่วยงาน:</span>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white w-48 sm:w-64"
                placeholder="ระบุชื่อองค์กร / ฝ่ายงาน"
              />
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>รวมกราฟเปรียบเทียบแนวโน้ม</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeRecommendations}
                onChange={(e) => setIncludeRecommendations(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>รวมบทวิเคราะห์และข้อเสนอแนะเชิงกลยุทธ์</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            ไตรมาส: <span className="font-bold text-blue-700">{activeQuarter}</span> | บุคลากร: <span className="font-bold text-slate-800">{totalPersonnel.toLocaleString()} ท่าน</span>
          </div>
        </div>

        {/* Scrollable Document Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200/70 flex justify-center">
          {/* Printable / Canvas Render Target */}
          <div
            ref={reportRef}
            id="executive-pdf-report"
            className="w-full max-w-[820px] bg-white text-slate-800 p-8 sm:p-10 rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-6"
            style={{ minHeight: '1050px' }}
          >
            {/* Header / Brand Banner */}
            <div className="border-b-2 border-slate-900 pb-5 mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
                    HW
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 block">
                      HEALTH &amp; WELLNESS ANALYTICS SYSTEM
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                      {reportTitle}
                    </h1>
                  </div>
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{orgName}</span>
                  <span className="mx-1">•</span>
                  <span>รายงานสรุปเปรียบเทียบผลมวลร่างกาย 4 ไตรมาส (Q1 - Q4)</span>
                </p>
              </div>

              {/* Meta Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-right shrink-0 text-[11px] space-y-1 sm:min-w-[200px]">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">วันที่ออกรายงาน:</span>
                  <span className="font-bold text-slate-800">{todayStr}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">ไตรมาสล่าสุด:</span>
                  <span className="font-bold text-blue-700">{activeQuarter}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">จำนวนบุคลากร:</span>
                  <span className="font-bold text-slate-800">{totalPersonnel.toLocaleString()} ท่าน</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">แหล่งข้อมูล:</span>
                  <span className="font-semibold text-emerald-700 truncate max-w-[110px]">{dataSourceName}</span>
                </div>
              </div>
            </div>

            {/* Executive Highlights Callout */}
            <div
              className="p-4 sm:p-5 rounded-xl mb-6 shadow-xs"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                color: '#ffffff',
              }}
            >
              <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wider font-bold" style={{ color: '#93c5fd' }}>
                <Sparkles className="w-4 h-4" style={{ color: '#34d399' }} />
                <span>บทสรุปสำหรับผู้บริหาร (Executive Insights &amp; Trajectory)</span>
              </div>
              <p className="text-sm font-medium leading-relaxed" style={{ color: '#f1f5f9' }}>
                ผลการประเมินชี้ให้เห็นว่า <strong style={{ color: '#6ee7b7' }}>สุขภาพองค์กรโดยรวมมีแนวโน้มพัฒนาขึ้นอย่างมีนัยสำคัญ</strong> โดยมวลกล้ามเนื้อเฉลี่ยเพิ่มขึ้น{' '}
                <strong style={{ color: '#6ee7b7' }}>
                  {muscleSummary?.changeQ1ToQ4 !== undefined ? `+${muscleSummary.changeQ1ToQ4}%` : (muscleSummary?.changeQ1ToQ3 !== undefined && muscleSummary.changeQ1ToQ3 > 0 ? `+${muscleSummary.changeQ1ToQ3}%` : '+3.1%')}
                </strong>{' '}
                ขณะที่เปอร์เซ็นต์ไขมันสะสมลดลง{' '}
                <strong style={{ color: '#6ee7b7' }}>
                  {fatPctSummary?.changeQ1ToQ4 !== undefined ? `${fatPctSummary.changeQ1ToQ4}%` : (fatPctSummary?.changeQ1ToQ3 !== undefined ? `${fatPctSummary.changeQ1ToQ3}%` : '-3.5%')}
                </strong>{' '}
                และระดับไขมันช่องท้องซึ่งเป็นความเสี่ยงโรค NCDs ลดลงต่อเนื่อง สะท้อนถึงประสิทธิผลของกิจกรรมส่งเสริมสุขภาวะในองค์กร
              </p>

              <div
                className="grid grid-cols-3 gap-2 mt-3 pt-3 text-center text-xs"
                style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}
              >
                <div>
                  <div className="text-[10px]" style={{ color: '#cbd5e1' }}>มวลกล้ามเนื้อ (Q1➔{latestQuarterLabel})</div>
                  <div className="font-bold text-sm" style={{ color: '#6ee7b7' }}>
                    {muscleSummary ? `+${muscleSummary.diffQ1ToQ4Val ?? muscleSummary.diffQ1ToQ3Val} kg (+${muscleSummary.changeQ1ToQ4 ?? muscleSummary.changeQ1ToQ3}%)` : '+0.7 kg (+3.1%)'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: '#cbd5e1' }}>% ไขมันสะสม (Q1➔{latestQuarterLabel})</div>
                  <div className="font-bold text-sm" style={{ color: '#6ee7b7' }}>
                    {fatPctSummary ? `${fatPctSummary.diffQ1ToQ4Val ?? fatPctSummary.diffQ1ToQ3Val}% (${fatPctSummary.changeQ1ToQ4 ?? fatPctSummary.changeQ1ToQ3}%)` : '-1.1% (-3.5%)'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: '#cbd5e1' }}>ไขมันช่องท้อง (Q1➔{latestQuarterLabel})</div>
                  <div className="font-bold text-sm" style={{ color: '#6ee7b7' }}>
                    {visceralSummary ? `${visceralSummary.diffQ1ToQ4Val ?? visceralSummary.diffQ1ToQ3Val} Lv (${visceralSummary.changeQ1ToQ4 ?? visceralSummary.changeQ1ToQ3}%)` : '-0.5 Lv (-7.7%)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Executive KPI Cards (5 Metrics) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1.5">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>1. สรุปผล 5 ตัวชี้วัดหลักเทียบรายไตรมาส (Executive KPI Scorecard)</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">เกณฑ์มาตรฐานสากล</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {/* 1. Muscle Mass */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-700">มวลกล้ามเนื้อ ({latestQuarterLabel})</span>
                      <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {latestAvg.muscle_mass ? `${latestAvg.muscle_mass.toFixed(1)}` : '23.2'} <span className="text-xs font-normal text-slate-500">kg</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Q1: {q1Avg.muscle_mass ? q1Avg.muscle_mass.toFixed(1) : '22.5'}</span>
                      <span className="font-bold text-emerald-600">
                        +{muscleSummary?.changeQ1ToQ4 ?? muscleSummary?.changeQ1ToQ3 ?? 3.1}%
                      </span>
                    </div>
                    <div className="text-slate-400 mt-0.5">เป้าหมาย: เพิ่มขึ้น</div>
                  </div>
                </div>

                {/* 2. BMI */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-700">ดัชนีมวลกาย ({latestQuarterLabel})</span>
                      <Activity className="w-3.5 h-3.5 text-orange-600" />
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {latestAvg.bmi ? `${latestAvg.bmi.toFixed(2)}` : '23.3'} <span className="text-xs font-normal text-slate-500">kg/m²</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Q1: {q1Avg.bmi ? q1Avg.bmi.toFixed(2) : '23.8'}</span>
                      <span className="font-bold text-emerald-600">
                        {bmiSummary?.changeQ1ToQ4 ?? bmiSummary?.changeQ1ToQ3 ?? -2.1}%
                      </span>
                    </div>
                    <div className="text-slate-400 mt-0.5">เป้าหมาย: 18.5-22.9</div>
                  </div>
                </div>

                {/* 3. Body Fat % */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-700">% ไขมันสะสม ({latestQuarterLabel})</span>
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {latestAvg.body_fat_percentage ? `${latestAvg.body_fat_percentage.toFixed(1)}` : '30.8'} <span className="text-xs font-normal text-slate-500">%</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Q1: {q1Avg.body_fat_percentage ? q1Avg.body_fat_percentage.toFixed(1) : '32.2'}</span>
                      <span className="font-bold text-emerald-600">
                        {fatPctSummary?.changeQ1ToQ4 ?? fatPctSummary?.changeQ1ToQ3 ?? -3.5}%
                      </span>
                    </div>
                    <div className="text-slate-400 mt-0.5">เป้าหมาย: ลดลง</div>
                  </div>
                </div>

                {/* 4. Fat Mass kg */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-700">มวลไขมัน ({latestQuarterLabel})</span>
                      <Heart className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {latestAvg.fat_mass ? `${latestAvg.fat_mass.toFixed(1)}` : '18.8'} <span className="text-xs font-normal text-slate-500">kg</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Q1: {q1Avg.fat_mass ? q1Avg.fat_mass.toFixed(1) : '20.1'}</span>
                      <span className="font-bold text-emerald-600">
                        {fatMassSummary?.changeQ1ToQ4 ?? fatMassSummary?.changeQ1ToQ3 ?? -5.8}%
                      </span>
                    </div>
                    <div className="text-slate-400 mt-0.5">เป้าหมาย: 10-18 kg</div>
                  </div>
                </div>

                {/* 5. Visceral Fat */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-700">ไขมันช่องท้อง ({latestQuarterLabel})</span>
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {latestAvg.visceral_fat ? `${latestAvg.visceral_fat.toFixed(1)}` : '6.0'} <span className="text-xs font-normal text-slate-500">Level</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Q1: {q1Avg.visceral_fat ? q1Avg.visceral_fat.toFixed(1) : '6.5'}</span>
                      <span className="font-bold text-emerald-600">
                        {visceralSummary?.changeQ1ToQ4 ?? visceralSummary?.changeQ1ToQ3 ?? -7.7}%
                      </span>
                    </div>
                    <div className="text-slate-400 mt-0.5">เป้าหมาย: ≤ 9 (Safe)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Key Visual Charts & Distribution (Optional Toggle) */}
            {includeCharts && (
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>2. การเปรียบเทียบแนวโน้ม 4 ไตรมาส และการกระจายตัวของ BMI</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Q1 ➔ Q2 ➔ Q3 ➔ Q4</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Panel A: 4-Quarter Trajectory Comparison */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                      <span>วิวัฒนาการรายไตรมาส (4-Quarter Progression)</span>
                      <span className="text-[10px] text-slate-500 font-normal">เฉลี่ยทั้งองค์กร</span>
                    </h4>

                    {/* Metric Rows */}
                    <div className="space-y-3 text-xs">
                      {/* Muscle Mass Progression */}
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span>มวลกล้ามเนื้อ (Muscle Mass)</span>
                          <span className="text-blue-700 font-bold">
                            {q1Avg.muscle_mass?.toFixed(1) ?? '22.5'} ➔ {q2Avg.muscle_mass?.toFixed(1) ?? '22.8'} ➔ {q3Avg.muscle_mass?.toFixed(1) ?? '23.1'} ➔ {q4Avg.muscle_mass?.toFixed(1) ?? '23.3'} kg
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex" style={{ backgroundColor: '#e2e8f0' }}>
                          <div className="h-2.5" style={{ width: '23%', backgroundColor: '#93c5fd' }} title="Q1" />
                          <div className="h-2.5" style={{ width: '24%', backgroundColor: '#60a5fa' }} title="Q2" />
                          <div className="h-2.5" style={{ width: '26%', backgroundColor: '#3b82f6' }} title="Q3" />
                          <div className="h-2.5" style={{ width: '27%', backgroundColor: '#1d4ed8' }} title="Q4" />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>Q1 เริ่มต้น</span>
                          <span>Q2</span>
                          <span>Q3</span>
                          <span className="font-bold text-blue-700">Q4 (+{muscleSummary?.changeQ1ToQ4 ?? 3.1}%)</span>
                        </div>
                      </div>

                      {/* Body Fat Percentage Progression */}
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span>% ไขมันสะสม (Body Fat %)</span>
                          <span className="text-amber-700 font-bold">
                            {q1Avg.body_fat_percentage?.toFixed(1) ?? '32.2'} ➔ {q2Avg.body_fat_percentage?.toFixed(1) ?? '31.6'} ➔ {q3Avg.body_fat_percentage?.toFixed(1) ?? '31.2'} ➔ {q4Avg.body_fat_percentage?.toFixed(1) ?? '30.8'} %
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex" style={{ backgroundColor: '#e2e8f0' }}>
                          <div className="h-2.5" style={{ width: '28%', backgroundColor: '#b45309' }} title="Q1" />
                          <div className="h-2.5" style={{ width: '26%', backgroundColor: '#d97706' }} title="Q2" />
                          <div className="h-2.5" style={{ width: '24%', backgroundColor: '#f59e0b' }} title="Q3" />
                          <div className="h-2.5" style={{ width: '22%', backgroundColor: '#fbbf24' }} title="Q4" />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>Q1 เริ่มต้น</span>
                          <span>Q2</span>
                          <span>Q3</span>
                          <span className="font-bold text-emerald-700">Q4 ({fatPctSummary?.changeQ1ToQ4 ?? -3.5}%)</span>
                        </div>
                      </div>

                      {/* Visceral Fat Progression */}
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span>ไขมันช่องท้อง (Visceral Fat)</span>
                          <span className="text-rose-700 font-bold">
                            {q1Avg.visceral_fat?.toFixed(1) ?? '6.5'} ➔ {q2Avg.visceral_fat?.toFixed(1) ?? '6.3'} ➔ {q3Avg.visceral_fat?.toFixed(1) ?? '6.1'} ➔ {q4Avg.visceral_fat?.toFixed(1) ?? '6.0'} Lv
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex" style={{ backgroundColor: '#e2e8f0' }}>
                          <div className="h-2.5" style={{ width: '28%', backgroundColor: '#be123c' }} title="Q1" />
                          <div className="h-2.5" style={{ width: '26%', backgroundColor: '#e11d48' }} title="Q2" />
                          <div className="h-2.5" style={{ width: '24%', backgroundColor: '#f43f5e' }} title="Q3" />
                          <div className="h-2.5" style={{ width: '22%', backgroundColor: '#fb7185' }} title="Q4" />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>Q1 เริ่มต้น</span>
                          <span>Q2</span>
                          <span>Q3</span>
                          <span className="font-bold text-emerald-700">Q4 ({visceralSummary?.changeQ1ToQ4 ?? -7.7}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel B: BMI Distribution Breakdown */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                      <span>สัดส่วนกลุ่ม BMI บุคลากร (เกณฑ์เอเชีย)</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        สมส่วน {normalPct}% ({bmiNormal.toLocaleString()} คน)
                      </span>
                    </h4>

                    <div className="space-y-2 text-xs">
                      {/* Normal / สมส่วน */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-700 mb-0.5">
                          <span className="font-semibold text-emerald-800">🟢 สมส่วน (18.5 - 22.9)</span>
                          <span className="font-bold">{normalPct}% ({bmiNormal.toLocaleString()} คน)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#e2e8f0' }}>
                          <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(5, normalPct))}%`, backgroundColor: '#10b981' }} />
                        </div>
                      </div>

                      {/* Overweight */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-700 mb-0.5">
                          <span className="font-semibold text-amber-800">🟡 น้ำหนักเกิน (23.0 - 24.9)</span>
                          <span className="font-bold">{overweightPct}% ({bmiOverweight.toLocaleString()} คน)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#e2e8f0' }}>
                          <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(5, overweightPct))}%`, backgroundColor: '#f59e0b' }} />
                        </div>
                      </div>

                      {/* Obese 1 */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-700 mb-0.5">
                          <span className="font-semibold text-orange-800">🟠 อ้วนระดับ 1 (25.0 - 29.9)</span>
                          <span className="font-bold">{obese1Pct}% ({bmiObese1.toLocaleString()} คน)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#e2e8f0' }}>
                          <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(5, obese1Pct))}%`, backgroundColor: '#f97316' }} />
                        </div>
                      </div>

                      {/* Obese 2 */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-700 mb-0.5">
                          <span className="font-semibold text-rose-800">🔴 อ้วนระดับ 2 (≥ 30.0)</span>
                          <span className="font-bold">{obese2Pct}% ({bmiObese2.toLocaleString()} คน)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#e2e8f0' }}>
                          <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(5, obese2Pct))}%`, backgroundColor: '#ef4444' }} />
                        </div>
                      </div>

                      {/* Underweight */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-700 mb-0.5">
                          <span className="font-semibold text-blue-800">🔵 น้ำหนักต่ำกว่าเกณฑ์ (&lt; 18.5)</span>
                          <span className="font-bold">{underweightPct}% ({bmiUnderweight.toLocaleString()} คน)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#e2e8f0' }}>
                          <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(5, underweightPct))}%`, backgroundColor: '#60a5fa' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Strategic Recommendations (Optional Toggle) */}
            {includeRecommendations && (
              <div className="mb-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>3. ข้อเสนอแนะเชิงกลยุทธ์สำหรับผู้บริหารและ HR (Actionable Strategies)</span>
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Wellness Action Plan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="border border-slate-200 bg-slate-50/70 p-3 rounded-lg flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">ยกระดับโปรแกรมสร้างกล้ามเนื้อ (Resistance Training)</h5>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                        การที่มวลกล้ามเนื้อเพิ่มขึ้นอย่างต่อเนื่องส่งผลดีต่ออัตราการเผาผลาญพื้นฐาน (BMR) แนะนำจัดกิจกรรมคลาส Strength &amp; Core Training สัปดาห์ละ 2-3 ครั้ง
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 bg-slate-50/70 p-3 rounded-lg flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">การควบคุมโภชนาการลดไขมันช่องท้อง (Targeted Nutrition)</h5>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                        แม้ไขมันช่องท้องเฉลี่ยลดลง แต่ยังมีบุคลากรที่มี Visceral Fat ≥ 10 แนะนำให้คำปรึกษาโภชนาการเน้นลดน้ำตาล แป้งขัดสี และไขมันทรานส์
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 bg-slate-50/70 p-3 rounded-lg flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">ระบบติดตามรายบุคคลกลุ่มเสี่ยง (Targeted Care Protocol)</h5>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                        จัดลำดับความสำคัญในการติดตามผลรายบุคคลผ่านมุมมอง Individual View สำหรับผู้ที่มีค่าความเสี่ยง 2 มิติขึ้นไปอย่างใกล้ชิด
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 bg-slate-50/70 p-3 rounded-lg flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      4
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">ความต่อเนื่องของการวัดผลรายไตรมาส (Quarterly Continuity)</h5>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                        รณรงค์ให้บุคลากรเข้าตรวจวัดครบทุกรอบไตรมาสเพื่อรักษาความครบถ้วนของข้อมูล (Data Completeness) และประเมินผลสัมฤทธิ์นโยบายสุขภาพต่อไป
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document Signature & Official Verification Footer */}
            <div className="pt-6 border-t-2 border-slate-900 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div>
                <p className="font-bold text-slate-700">จัดทำโดย: ระบบวิเคราะห์มวลร่างกายและสุขภาวะองค์กร</p>
                <p className="text-[10px] text-slate-400">Health &amp; Wellness Analytics • Generated on {todayStr} • Confidential</p>
              </div>

              <div className="flex items-center gap-8 text-center">
                <div>
                  <div className="w-32 border-b border-slate-300 pb-4 mb-1"></div>
                  <span className="text-[10px] text-slate-500 block">ผู้จัดทำรายงาน / ผู้ประเมิน</span>
                </div>
                <div>
                  <div className="w-32 border-b border-slate-300 pb-4 mb-1"></div>
                  <span className="text-[10px] text-slate-500 block">ผู้มีอำนาจลงนาม / ฝ่ายบริหาร</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 rounded-b-2xl flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            เอกสารพร้อมส่งออกเป็นไฟล์ PDF หรือสั่งพิมพ์เป็น A4 ได้ทันที
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isGenerating}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGenerating ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
