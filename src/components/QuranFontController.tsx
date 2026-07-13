import React from 'react';
import { Type, ZoomIn, ZoomOut, RotateCcw, HelpCircle } from 'lucide-react';

export interface FontSettings {
  fontSize: number; // in rem
  fontFamily: 'font-serif' | 'font-naskh' | 'font-kufi' | 'font-sans';
}

interface QuranFontControllerProps {
  settings: FontSettings;
  onChange: (newSettings: FontSettings) => void;
  isDark?: boolean;
}

export default function QuranFontController({ settings, onChange, isDark = false }: QuranFontControllerProps) {
  const fontFamilies = [
    { key: 'font-serif', name: 'الخط العثماني', label: 'العثماني' },
    { key: 'font-naskh', name: 'خط النسخ التقليدي', label: 'النسخ' },
    { key: 'font-sans', name: 'الخط الإملائي المبسط', label: 'الإملائي' },
  ] as const;

  const handleZoomIn = () => {
    if (settings.fontSize < 4.0) {
      onChange({ ...settings, fontSize: parseFloat((settings.fontSize + 0.2).toFixed(2)) });
    }
  };

  const handleZoomOut = () => {
    if (settings.fontSize > 1.0) {
      onChange({ ...settings, fontSize: parseFloat((settings.fontSize - 0.2).toFixed(2)) });
    }
  };

  const handleFontChange = (fam: FontSettings['fontFamily']) => {
    onChange({ ...settings, fontFamily: fam });
  };

  const handleReset = () => {
    onChange({ fontSize: 1.75, fontFamily: 'font-serif' });
  };

  const currentFontLabel = fontFamilies.find(f => f.key === settings.fontFamily)?.name || 'الخط العثماني';

  return (
    <div 
      className={`flex items-center gap-3 px-4 py-2.5 rounded-full border shadow-2xl transition-all text-right backdrop-blur-md pointer-events-auto ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-emerald-950/20' 
          : 'bg-white/95 border-slate-150 text-slate-800 shadow-slate-300/40'
      }`} 
      id="quran-floating-font-controller"
    >
      {/* Label & Font indicator */}
      <div className="hidden md:flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
        <div className="h-6 w-6 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
          <Type className="h-3.5 w-3.5" />
        </div>
        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">الخط المعتمد:</span>
        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{currentFontLabel}</span>
      </div>

      {/* Font Family selector pills */}
      <div className="flex items-center gap-1">
        {fontFamilies.map((fam) => {
          const isSelected = settings.fontFamily === fam.key;
          return (
            <button
              key={fam.key}
              onClick={() => handleFontChange(fam.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/15'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-850'
              }`}
              title={fam.name}
            >
              {fam.label}
            </button>
          );
        })}
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

      {/* Font Zoom Controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleZoomOut}
          className="h-7 w-7 rounded-full text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
          title="تصغير حجم الخط -"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        <span className="text-[11px] font-mono font-black min-w-[36px] text-center text-slate-600 dark:text-slate-350">
          {Math.round(settings.fontSize * 40)}%
        </span>

        <button
          type="button"
          onClick={handleZoomIn}
          className="h-7 w-7 rounded-full text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
          title="تكبير حجم الخط +"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

      {/* Reset Defaults button */}
      <button
        onClick={handleReset}
        className="p-1.5 rounded-full text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
        title="إعادة ضبط حجم ونوع الخط الافتراضي"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
