import React, { useState } from 'react';
import { X, Copy, Check, FileText, BarChart3, Layout, Layers, ShieldCheck } from 'lucide-react';

interface WireframeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WireframeGuideModal: React.FC<WireframeGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const wireframeText = `
========================================================================================================
📋 TEXT WIREFRAME DESIGN : HEALTH & WELLNESS BODY COMPOSITION DASHBOARD
========================================================================================================

+------------------------------------------------------------------------------------------------------+
| [HEADER BAR] 🏥 Health & Wellness Dashboard | เปรียบเทียบผลตรวจมวลร่างกาย 3 ไตรมาส (Q1, Q2, Q3)        |
| [Quarter Picker: Q1 | Q2 | (Q3 Latest)]  [Text Wireframe Guide]  [Google Apps Script]  [จัดการข้อมูล]   |
+------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------+
| 🔍 [FILTER SECTION / แถบตัวกรองข้อมูล]                                                                 |
| [🔘 ภาพรวมทั้งองค์กร / 👤 ดูรายบุคคล] | [🔍 ค้นหา Person ID] | [กลุ่ม BMI: รายย่อย/ทั่วไป/รายใหญ่]   |
| [⚠️ ระดับความเสี่ยง: ไขมันช่องท้อง/ไขมันสูง] | [สถานะข้อมูล: ครบ 3 ไตรมาส / มีค่า #N/A]                 |
+------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------+
| 📊 SECTION 1: EXECUTIVE SUMMARY (สรุปภาพรวม 5 ตัวชี้วัดหลักใน Q3 พร้อมแนวโน้ม % เปลี่ยนแปลง vs Q1)   |
|                                                                                                      |
| +----------------+ +----------------+ +----------------+ +----------------+ +----------------+      |
| | 1.มวลกล้ามเนื้อ | | 2.ดัชนีมวลกาย  | | 3.% ไขมันกาย  | | 4.มวลไขมันรวม  | | 5.ไขมันช่องท้อง |      |
| | (Muscle Mass)  | | (BMI)          | | (Body Fat %)   | | (Fat Mass)     | | (Visceral Fat) |      |
| | 23.4 kg        | | 24.2 kg/m²     | | 29.8 %         | | 18.2 kg        | | 5.8 Level      |      |
| | 🟢 +2.6% (+0.6)| | 🟢 -1.6% (-0.4)| | 🟢 -5.7% (-1.8)| | 🟢 -6.2% (-1.2)| | 🟢 -12.1%(-0.8)|      |
| | [Q1 Q2 Q3 mini]| | [Q1 Q2 Q3 mini]| | [Q1 Q2 Q3 mini]| | [Q1 Q2 Q3 mini]| | [Q1 Q2 Q3 mini]|      |
| +----------------+ +----------------+ +----------------+ +----------------+ +----------------+      |
+------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------+
| 📈 SECTION 2: COMPARATIVE ANALYSIS (กราฟเปรียบเทียบแนวโน้ม 3 ไตรมาส & ไฮไลท์ความเสี่ยงระยะยาว)         |
|                                                                                                      |
| [ฝั่งซ้าย: 2/3 Width]                                    [ฝั่งขวา: 1/3 Width]                        |
| +------------------------------------------------------+ +------------------------------------------+|
| | 📈 กราฟแนวโน้มพัฒนาการ (Quarterly Trend Chart)        | | 🛡️ Critical Risk Highlight Cards       ||
| | [Type: Dual-Axis Line / Area Chart]                  | | ⚠️ ไขมันช่องท้อง (Visceral Fat > 9 Lv)   ||
| | แกนซ้าย: Visceral Fat Level (1-15)                   | | ⚠️ % ไขมันสะสมในร่างกาย (> 30%)          ||
| | แกนขวา: Body Fat % (15%-45%)                          | | เกณฑ์เตือนความเสี่ยงโรค NCDs และหลอดเลือด ||
| | เส้นแสดง: Q1 -> Q2 -> Q3 (ล่าสุด) พร้อมอัตรา % ลดลง   | | แผนปฏิบัติการส่งเสริมสุขภาพองค์กร         ||
| +------------------------------------------------------+ +------------------------------------------+|
|                                                                                                      |
| [แถวที่สอง: กราฟเสริม]                                                                               |
| +------------------------------------------------------+ +------------------------------------------+|
| | 🕸️ Radar Chart : มิติสมดุลสรีระ (Q1 vs Q3)           | | 🎯 Scatter Matrix : ความเสี่ยงบุคลากร    ||
| | [Type: Radar / Spider Chart]                         | | [Type: Scatter Plot with Risk Thresholds] ||
| | เปรียบเทียบ 5 แกน (กล้ามเนื้อ, BMI, %Fat, FatMass, VF)| | แกน X: %Fat, แกน Y: Visceral Fat Level   ||
| +------------------------------------------------------+ +------------------------------------------+|
+------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------+
| 👥 SECTION 3: BMI DISTRIBUTION & ORGANIZATION TREND (การจัดกลุ่ม BMI & ทิศทางสัดส่วนประชากร)         |
|                                                                                                      |
| [ฝั่งซ้าย: 2/3 Width]                                    [ฝั่งขวา: 1/3 Width]                        |
| +------------------------------------------------------+ +------------------------------------------+|
| | 📊 การกระจายตัวประชากรรายไตรมาส (BMI Shift)            | | 🍩 สัดส่วนกลุ่ม BMI ในไตรมาส Q3 (Donut)  ||
| | [Type: Grouped Column / Stacked Bar Chart]           | | [Type: Donut / Pie Chart]                ||
| | 🟡 ลูกค้ารายย่อย (< 18.5)                            | | • ลูกค้ารายย่อย: 4.2%                    ||
| | 🟢 ลูกค้าทั่วไป (18.5 - 22.9)                         | | • ลูกค้าทั่วไป: 48.6%                   ||
| | 🔴 ลูกค้ารายใหญ่ (> 23.0)                            | | • ลูกค้ารายใหญ่: 47.2%                   ||
| | *แสดงการขยับของจำนวนคนจาก "รายใหญ่" สู่ "ทั่วไป"       | |                                          ||
| +------------------------------------------------------+ +------------------------------------------+|
+------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------+
| 🏆 SECTION 4: INDIVIDUAL LEADERBOARD (กระดานเกียรติยศ บุคลากรพัฒนาการสุขภาพดีเด่น)                   |
| [แท็บ: 🥇 % ไขมันลดลงมากที่สุด | 💪 กล้ามเนื้อเพิ่มมากที่สุด | 🛡️ ลดไขมันช่องท้องมากที่สุด]          |
|                                                                                                      |
| Rank | Person ID | กลุ่ม BMI     | ค่าเริ่มต้น (Q1) | ค่าล่าสุด (Q3) | ผลต่างพัฒนาการ | % การเปลี่ยนแปลง|
| 🥇 1 | 48621     | ลูกค้าทั่วไป  | 23.5 %           | 18.2 %         | 🟢 -5.3 %      | 🟢 -22.6%      |
| 🥈 2 | 47085     | ลูกค้าทั่วไป  | 15.1 %           | 11.2 %         | 🟢 -3.9 %      | 🟢 -25.8%      |
| 🥉 3 | 13582     | ลูกค้ารายใหญ่ | 21.4 %           | 17.8 %         | 🟢 -3.6 %      | 🟢 -16.8%      |
+------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------+
| 👤 SECTION 5: INDIVIDUAL PERSONNEL DEEP DIVE (มุมมองเจาะลึกรายบุคคล + การแสดงผล #N/A + % เปลี่ยนแปลง) |
|                                                                                                      |
| บุคลากร: Person ID 49068 | กลุ่ม: ลูกค้ารายใหญ่ (BMI 26.89)                                           |
|                                                                                                      |
| ตัวชี้วัด (Metrics)            | Q1       | Q2       | Q3 (ล่าสุด) | ผลต่าง (Q3 vs Q1) | % เปลี่ยนแปลง  |
| • น้ำหนักตัว (Weight kg)       | 77.7     | 76.2     | 74.8        | 🟢 -2.9 kg        | 🟢 -3.7%       |
| • มวลกล้ามเนื้อ (Muscle Mass)   | 30.3     | 30.8     | 31.5        | 🟢 +1.2 kg        | 🟢 +4.0%       |
| • ดัชนีมวลกาย (BMI)             | 26.89    | 26.37    | 25.88       | 🟢 -1.01          | 🟢 -3.8%       |
| • เปอร์เซ็นต์ไขมัน (% Body Fat)| 31.1     | 28.5     | 26.2        | 🟢 -4.9 %         | 🟢 -15.8%      |
| • มวลไขมัน (Fat Mass kg)       | 24.2     | 21.7     | 19.6        | 🟢 -4.6 kg        | 🟢 -19.0%      |
| • ไขมันช่องท้อง (Visceral Fat) | 9        | 8        | 7           | 🟢 -2 Level       | 🟢 -22.2%      |
| * หากบุคลากรไม่ได้รับการตรวจในไตรมาสใด ระบบจะแสดงช่องว่างเป็น #N/A โดยอัตโนมัติ                       |
+------------------------------------------------------------------------------------------------------+
`;

  const chartRecommendations = [
    {
      section: '1. Executive Summary (ภาพรวม 5 ตัวชี้วัด)',
      chartType: 'KPI Metric Cards + Mini Progression Sparks',
      reason: 'ผู้บริหารสามารถสแกนดูค่าเฉลี่ยล่าสุด (Q3) และลูกศรชี้วัดแนวโน้ม (Delta vs Q2, Q1) ได้ทันทีใน 3 วินาที',
      badge: 'KPI Cards'
    },
    {
      section: '2. Comparative Trend (แนวโน้ม 3 ไตรมาส)',
      chartType: 'Dual-Axis Line / Spline Chart',
      reason: 'เหมาะที่สุดสำหรับติดตามตัวชี้วัดที่มีสเกลต่างกันบนแกนคู่ (เช่น Visceral Fat ระดับ 1-15 vs Body Fat % 10-40%)',
      badge: 'Dual-Axis Line'
    },
    {
      section: '3. Long-term Health Risk Matrix (ความเสี่ยงระยะยาว)',
      chartType: 'Scatter Matrix Plot + Reference Danger Lines',
      reason: 'พล็อตจุดความสัมพันธ์ระหว่าง % ไขมัน และ ไขมันช่องท้อง พร้อมเส้นตัดเกณฑ์อันตราย เพื่อคัดกรองบุคลากรกลุ่มเสี่ยง NCDs',
      badge: 'Scatter Plot'
    },
    {
      section: '4. BMI Grouping Transition (การกระจายกลุ่ม BMI)',
      chartType: 'Grouped Column Bar Chart + Donut Ratio',
      reason: 'เห็นการเคลื่อนย้ายเชิงปริมาณประชากรองค์กรจาก "ลูกค้ารายใหญ่ (>23)" สู่ "ลูกค้าทั่วไป (18.5-22.9)" ในแต่ละไตรมาส',
      badge: 'Grouped Bar'
    },
    {
      section: '5. Individual Body Balance (สมดุลสรีระส่วนบุคคล)',
      chartType: 'Radar / Spider Chart (Q1 vs Q3 Overlay)',
      reason: 'ฉายภาพซ้อนให้เห็นการหดตัวของไขมันรอบเอวและการขยายตัวของกล้ามเนื้อได้อย่างชัดเจนในภาพเดียว',
      badge: 'Radar Chart'
    },
    {
      section: '6. Body Composition Breakdown (องค์ประกอบมวลกาย)',
      chartType: 'Stacked Bar Chart (Lean Mass vs Fat Mass)',
      reason: 'จำแนกสัดส่วนมวลกล้ามเนื้อและไขมันออกจากน้ำหนักตัวรวมได้อย่างแม่นยำ',
      badge: 'Stacked Bar'
    }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(wireframeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Layout className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Text Wireframe Layout &amp; แนะนำประเภทกราฟ (Chart Type Recommendations)
              </h3>
              <p className="text-xs text-slate-500">
                โครงสร้างการจัดวางหน้าจอและเหตุผลประกอบการเลือกใช้กราฟสำหรับระบบ Health &amp; Wellness
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Chart Type Recommendations Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              ตารางสรุปคำแนะนำประเภทกราฟ (Chart Type Selection Rationale)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chartRecommendations.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{item.section}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {item.badge}
                    </span>
                  </div>
                  <div className="text-xs text-indigo-700 font-semibold mb-1">
                    ประเภทกราฟ: {item.chartType}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Text Wireframe Code Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Text Wireframe Layout (แบบร่างโครงสร้างหน้าจอตัวอักษร)
              </h4>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'คัดลอกสำเร็จ!' : 'คัดลอก Wireframe'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed rounded-xl overflow-x-auto border border-slate-800 shadow-inner max-h-[380px]">
              {wireframeText}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between text-xs text-slate-500">
          <span>รองรับการนำไปปรับใช้ใน Google Apps Script Web App และ Dashboard รายงานผล</span>
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
