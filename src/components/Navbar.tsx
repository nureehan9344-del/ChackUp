import React from 'react';
import { Activity, Code, FileText, Download, Sparkles, HeartPulse, RefreshCw, BarChart2, LogIn, LogOut, User as UserIcon, Cloud } from 'lucide-react';
import { Quarter } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  selectedQuarter: Quarter;
  onSelectQuarter: (q: Quarter) => void;
  onOpenAppsScript: () => void;
  onOpenWireframeGuide: () => void;
  onOpenDataModal: () => void;
  totalPersonnel: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedQuarter,
  onSelectQuarter,
  onOpenAppsScript,
  onOpenWireframeGuide,
  onOpenDataModal,
  totalPersonnel,
}) => {
  const { user, signInWithGoogle, signOut, isFirestoreConnected } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs text-white">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Health &amp; Wellness Body Composition Dashboard
                </h1>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  <Cloud className="w-2.5 h-2.5 text-blue-600" />
                  Firebase Enabled
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                เปรียบเทียบผลตรวจมวลร่างกาย 3 ไตรมาส (บุคลากร {totalPersonnel} ท่าน)
              </p>
            </div>
          </div>

          {/* Right Action buttons & Quarter Switcher */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quarter Quick Selector */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              {(['Q1', 'Q2', 'Q3'] as Quarter[]).map((q) => (
                <button
                  key={q}
                  onClick={() => onSelectQuarter(q)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedQuarter === q
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {q === 'Q3' ? `${q} (ล่าสุด)` : q}
                </button>
              ))}
            </div>

            {/* Wireframe Text Guide Button */}
            <button
              onClick={onOpenWireframeGuide}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              title="ดูแบบร่าง Text Wireframe และคำแนะนำประเภทกราฟ"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden lg:inline">Text Wireframe</span>
            </button>

            {/* Google Apps Script Code Button */}
            <button
              onClick={onOpenAppsScript}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
              title="โค้ด Google Apps Script (GAS) สำหรับเชื่อมโยง Google Sheet"
            >
              <Code className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden lg:inline">Apps Script</span>
            </button>

            {/* Data Import / Sync */}
            <button
              onClick={onOpenDataModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
              title="จัดการข้อมูล Google Sheet / CSV"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">จัดการข้อมูล</span>
            </button>

            {/* Firebase Auth Button */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg pl-1.5 pr-1 py-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                )}
                <span className="text-[11px] font-semibold text-slate-700 max-w-[90px] truncate hidden md:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={signOut}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="ออกจากระบบ Firebase"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                title="เข้าสู่ระบบด้วย Google Firebase"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>เข้าสู่ระบบ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
