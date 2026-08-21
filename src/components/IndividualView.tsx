import React, { useState, useEffect } from 'react';
import {
  User,
  ArrowLeft,
  Calendar,
  Activity,
  Dumbbell,
  Flame,
  Heart,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Share2,
  Printer,
  Sparkles,
  MessageSquarePlus,
  Send,
  Trash2,
  Lock,
  Cloud,
  Percent
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { BodyCompositionRecord, PersonSummary, Quarter } from '../types';
import { getBMIGroupColor } from '../data/dataset';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

interface IndividualViewProps {
  person: PersonSummary;
  onBackToOverview: () => void;
}

interface WellnessNoteItem {
  id: string;
  person_id: string;
  note: string;
  targetQuarter: string;
  authorId: string;
  authorEmail: string;
  createdAt: string;
}

export const IndividualView: React.FC<IndividualViewProps> = ({ person, onBackToOverview }) => {
  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3'];

  // Table rows for all 5 metrics plus weight & height
  const metricsConfig = [
    { key: 'weight', labelTh: 'น้ำหนักตัว (Weight)', unit: 'kg', ideal: 'ตามเกณฑ์ BMI' },
    { key: 'muscle_mass', labelTh: 'มวลกล้ามเนื้อ (Muscle Mass)', unit: 'kg', ideal: '≥ 20 - 35 kg' },
    { key: 'bmi', labelTh: 'ดัชนีมวลกาย (BMI)', unit: 'kg/m²', ideal: '18.5 - 22.9 kg/m²' },
    { key: 'body_fat_percentage', labelTh: 'เปอร์เซ็นต์ไขมัน (Body Fat %)', unit: '%', ideal: '10 - 24.9 %' },
    { key: 'fat_mass', labelTh: 'มวลไขมัน (Fat Mass)', unit: 'kg', ideal: '10 - 18 kg' },
    { key: 'visceral_fat', labelTh: 'ไขมันช่องท้อง (Visceral Fat)', unit: 'Level', ideal: '1 - 9 Level' },
  ];

  // Chart data for this individual
  const chartData = quarters.map((q) => {
    const rec = person.quarters[q];
    return {
      quarter: q === 'Q3' ? 'Q3 (ล่าสุด)' : q,
      muscle_mass: rec?.muscle_mass ?? null,
      bmi: rec?.bmi ?? null,
      body_fat_percentage: rec?.body_fat_percentage ?? null,
      fat_mass: rec?.fat_mass ?? null,
      visceral_fat: rec?.visceral_fat ?? null,
      weight: rec?.weight ?? null,
    };
  });

  // Firebase Real-time Wellness Notes state
  const { user, signInWithGoogle } = useAuth();
  const [notes, setNotes] = useState<WellnessNoteItem[]>([]);
  const [newNote, setNewNote] = useState('');
  const [targetQuarter, setTargetQuarter] = useState<string>('Q3');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const notesPath = 'notes';
    const q = query(collection(db, notesPath), where('person_id', '==', person.person_id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: WellnessNoteItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<WellnessNoteItem, 'id'>) });
        });
        // Sort descending by date
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotes(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, notesPath);
      }
    );

    return () => unsubscribe();
  }, [person.person_id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user) return;
    setIsSubmitting(true);
    const notesPath = 'notes';
    try {
      await addDoc(collection(db, notesPath), {
        person_id: person.person_id,
        note: newNote.trim(),
        targetQuarter,
        authorId: user.uid,
        authorEmail: user.email || 'Anonymous',
        createdAt: new Date().toISOString(),
      });
      setNewNote('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, notesPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    const noteDocPath = `notes/${noteId}`;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, noteDocPath);
    }
  };

  // Radar comparison Q1 vs Q3
  const q1Rec = person.quarters.Q1 || person.quarters.Q2;
  const q3Rec = person.quarters.Q3;

  const radarData = [
    { subject: 'มวลกล้ามเนื้อ', Q1: q1Rec?.muscle_mass ?? 20, Q3: q3Rec?.muscle_mass ?? 20, fullMark: 40 },
    { subject: '% ไขมัน', Q1: q1Rec?.body_fat_percentage ?? 30, Q3: q3Rec?.body_fat_percentage ?? 30, fullMark: 50 },
    { subject: 'ไขมันช่องท้อง (x2)', Q1: (q1Rec?.visceral_fat ?? 6) * 2, Q3: (q3Rec?.visceral_fat ?? 6) * 2, fullMark: 30 },
    { subject: 'BMI', Q1: q1Rec?.bmi ?? 24, Q3: q3Rec?.bmi ?? 24, fullMark: 35 },
    { subject: 'มวลไขมัน', Q1: q1Rec?.fat_mass ?? 20, Q3: q3Rec?.fat_mass ?? 20, fullMark: 40 },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Individual Header Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToOverview}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>กลับภาพรวม</span>
            </button>

            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              <User className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  รหัสบุคลากร: {person.person_id}
                </h2>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getBMIGroupColor(
                    person.bmiGroup
                  )}`}
                >
                  กลุ่ม: {person.bmiGroup}
                </span>
                {person.completeness === 'partial' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                    มีข้อมูลไม่ครบ (มีค่า #N/A)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ส่วนสูง: <strong className="text-slate-700">{person.height} ซม.</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>พิมพ์รายงานส่วนบุคคล</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Quarter Body Composition Matrix Table with explicit #N/A and % difference */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              ตารางเปรียบเทียบผลการวัดมวลร่างกาย 3 ไตรมาส (Body Composition Matrix)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              * ข้อมูลที่ขาดหายไปหรือไม่ได้เข้าตรวจในรอบนั้นจะแสดงสถานะเป็น <strong>#N/A</strong> พร้อมผลการเปลี่ยนแปลงสัมบูรณ์และคิดเป็นเปอร์เซ็นต์ (%)
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
            ID: {person.person_id}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">ตัวชี้วัด (Metrics)</th>
                <th className="py-2.5 px-4 text-center">Q1 (ไตรมาส 1)</th>
                <th className="py-2.5 px-4 text-center">Q2 (ไตรมาส 2)</th>
                <th className="py-2.5 px-4 text-center bg-blue-50 text-blue-900">Q3 (ไตรมาส 3 ล่าสุด)</th>
                <th className="py-2.5 px-4 text-center">การเปลี่ยนแปลง (Q3 vs Q1)</th>
                <th className="py-2.5 px-4 text-center bg-emerald-50/60 text-emerald-900">% เปลี่ยนแปลง</th>
                <th className="py-2.5 px-4 text-center">เกณฑ์มาตรฐานสากล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metricsConfig.map((cfg) => {
                const q1Val = person.quarters.Q1?.[cfg.key as keyof BodyCompositionRecord] as number | null;
                const q2Val = person.quarters.Q2?.[cfg.key as keyof BodyCompositionRecord] as number | null;
                const q3Val = person.quarters.Q3?.[cfg.key as keyof BodyCompositionRecord] as number | null;

                const startVal = q1Val ?? q2Val;
                const diff = (q3Val !== null && startVal !== null && q3Val !== undefined && startVal !== undefined)
                  ? Number((q3Val - startVal).toFixed(2))
                  : null;
                
                const pctDiff = (diff !== null && startVal !== null && startVal > 0)
                  ? Number(((diff / startVal) * 100).toFixed(1))
                  : null;

                const isMuscle = cfg.key === 'muscle_mass';
                const isGood = isMuscle ? (diff !== null && diff >= 0) : (diff !== null && diff <= 0);

                return (
                  <tr key={cfg.key} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{cfg.labelTh}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-medium text-slate-700">
                      {q1Val !== null && q1Val !== undefined ? `${q1Val} ${cfg.unit}` : <span className="text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">#N/A</span>}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-medium text-slate-700">
                      {q2Val !== null && q2Val !== undefined ? `${q2Val} ${cfg.unit}` : <span className="text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">#N/A</span>}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold bg-blue-50/50 text-blue-950">
                      {q3Val !== null && q3Val !== undefined ? `${q3Val} ${cfg.unit}` : <span className="text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">#N/A</span>}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono">
                      {diff !== null ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                            isGood
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {diff > 0 ? `+${diff}` : diff} {cfg.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">#N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">
                      {pctDiff !== null ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                            isGood ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'
                          }`}
                        >
                          {pctDiff > 0 ? `+${pctDiff}%` : `${pctDiff}%`}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">#N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center text-xs text-slate-500">{cfg.ideal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Individual Trajectory Chart & Radar Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">
              เส้นทางการเปลี่ยนแปลงส่วนบุคคล (Personal Trend Line)
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Line Chart (Q1 - Q3)
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            ติดตามมวลกล้ามเนื้อและไขมันของ Person ID: {person.person_id}
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="quarter" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line type="monotone" dataKey="muscle_mass" name="มวลกล้ามเนื้อ (kg)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
                <Line type="monotone" dataKey="body_fat_percentage" name="% ไขมันในร่างกาย" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
                <Line type="monotone" dataKey="visceral_fat" name="ไขมันช่องท้อง (Level)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Personal Radar Balance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">
              สมดุลสรีระส่วนบุคคล (Personal Body Balance Profile)
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Radar Chart
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            เปรียบเทียบจุดเริ่มต้น (Q1) กับผลการประเมินล่าสุด (Q3)
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" stroke="#475569" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 45]} stroke="#94a3b8" fontSize={10} />
                <Radar name="Q1 (เริ่มต้น)" dataKey="Q1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                <Radar name="Q3 (ล่าสุด)" dataKey="Q3" stroke="#2563eb" fill="#2563eb" fillOpacity={0.35} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Health Counseling Advice Box */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-12 translate-x-12 blur-2xl pointer-events-none"></div>
        <div className="flex items-start gap-3 relative z-10">
          <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">
              คำแนะนำและแผนส่งเสริมสุขภาพส่วนบุคคล (Personalized Wellness Recommendations)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {person.bmiGroup === 'ลูกค้ารายใหญ่' && (
                <>
                  บุคลากรอยู่ในกลุ่ม <strong className="text-amber-300">ลูกค้ารายใหญ่ (BMI &gt; 23)</strong> แนะนำให้เน้นการคุมพลังงานจากอาหาร ลดแป้งขัดสีและของทอด ควบคู่การออกกำลังกายแบบแอโรบิกต่อเนื่อง 150 นาที/สัปดาห์ และฝึกกล้ามเนื้อเพื่อดึงค่าไขมันช่องท้องให้อยู่ในเกณฑ์ปลอดภัย (&lt; 9 Level)
                </>
              )}
              {person.bmiGroup === 'ลูกค้าทั่วไป' && (
                <>
                  บุคลากรอยู่ในกลุ่ม <strong className="text-emerald-400">ลูกค้าทั่วไป (BMI 18.5 - 22.9)</strong> ซึ่งเป็นเกณฑ์มาตรฐานที่ยอดเยี่ยม ควรรักษาความสม่ำเสมอในการรับประทานอาหารที่มีโปรตีนคุณภาพดี และรักษามวลกล้ามเนื้อด้วยการเวทเทรนนิ่ง 2-3 วันต่อสัปดาห์
                </>
              )}
              {person.bmiGroup === 'ลูกค้ารายย่อย' && (
                <>
                  บุคลากรอยู่ในกลุ่ม <strong className="text-blue-300">ลูกค้ารายย่อย (BMI &lt; 18.5)</strong> แนะนำให้เพิ่มปริมาณพลังงานและสารอาหารที่มีประโยชน์ โดยเฉพาะโปรตีนและไขมันดี พร้อมฝึกกล้ามเนื้อเพื่อเพิ่มมวลกล้ามเนื้อ (Muscle Mass) และเสริมสร้างความแข็งแรงของกระดูก
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Cloud Firestore Counselor Coaching Notes Section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                บันทึกการให้คำปรึกษาและติดตามผล (Cloud Firestore Wellness Notes)
              </h3>
              <p className="text-xs text-slate-500">
                บันทึกคำแนะนำรายบุคคล ซิงค์ข้อมูลอัตโนมัติบน Google Cloud Firestore
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            {notes.length} รายการบันทึก
          </span>
        </div>

        {/* Note Input / Form */}
        <div className="mt-4">
          {user ? (
            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={targetQuarter}
                  onChange={(e) => setTargetQuarter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Q1">สำหรับ Q1</option>
                  <option value="Q2">สำหรับ Q2</option>
                  <option value="Q3">สำหรับ Q3 (ล่าสุด)</option>
                </select>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="เขียนบันทึกการโค้ชชิ่ง เช่น แนะนำปรับตารางออกกำลังกาย, นัดติดตามผล..."
                  maxLength={1000}
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newNote.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>เข้าสู่ระบบด้วย Google เพื่อเพิ่มหรือแก้ไขบันทึกการโค้ชชิ่งบน Firestore</span>
              </div>
              <button
                onClick={signInWithGoogle}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
              >
                เข้าสู่ระบบ Google
              </button>
            </div>
          )}
        </div>

        {/* Notes List */}
        <div className="mt-4 space-y-2">
          {notes.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              ยังไม่มีบันทึกการให้คำปรึกษาสำหรับบุคลากรรหัสนี้
            </div>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {n.targetQuarter}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{n.authorEmail}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{n.note}</p>
                </div>

                {user && user.uid === n.authorId && (
                  <button
                    onClick={() => handleDeleteNote(n.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="ลบบันทึก"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
