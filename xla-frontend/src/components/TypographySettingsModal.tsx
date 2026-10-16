import { useState, useEffect } from 'react';
import { Check, RotateCcw, X, Sliders } from 'lucide-react';
import { AVAILABLE_FONTS, FONT_SIZES, getSavedTypography, applyTypography } from '../utils/typography';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  isInline?: boolean; // If true, renders as an inline panel inside AdminMenu rather than a floating modal
}

export default function TypographySettingsModal({ isOpen = true, onClose, isInline = false }: Props) {
  const [currentFont, setCurrentFont] = useState('Montserrat');
  const [currentSize, setCurrentSize] = useState('14px');

  useEffect(() => {
    const { fontFamily, fontSize } = getSavedTypography();
    setCurrentFont(fontFamily);
    setCurrentSize(fontSize);

    const handler = (e: any) => {
      if (e.detail) {
        setCurrentFont(e.detail.fontFamily);
        setCurrentSize(e.detail.fontSize);
      }
    };
    window.addEventListener('xla_typography_changed', handler);
    return () => window.removeEventListener('xla_typography_changed', handler);
  }, []);

  const handleSelectFont = (fontId: string) => {
    setCurrentFont(fontId);
    applyTypography(fontId, currentSize);
  };

  const handleSelectSize = (sizeId: string) => {
    setCurrentSize(sizeId);
    applyTypography(currentFont, sizeId);
  };

  const handleReset = () => {
    setCurrentFont('Montserrat');
    setCurrentSize('14px');
    applyTypography('Montserrat', '14px');
  };

  if (!isOpen && !isInline) return null;

  const content = (
    <div className={`flex flex-col gap-6 ${isInline ? 'bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Display & Typography Settings
            </h3>
            <p className="text-[11px] text-slate-400">
              Customize system font family and global text scaling across all pages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors"
            title="Reset to default Montserrat 14px"
          >
            <RotateCcw size={13} /> Reset Default
          </button>
          {!isInline && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors ml-2"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Font Size Selection */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-2">
            <span>Font Size / Scale</span>
            <span className="text-[10px] text-slate-400 font-normal">({currentSize} base scale)</span>
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {FONT_SIZES.map((size) => {
            const isSelected = currentSize === size.scale;
            return (
              <button
                key={size.id}
                onClick={() => handleSelectSize(size.scale)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-500 text-white shadow-sm ring-1 ring-sky-500/30'
                    : 'bg-[#151c2c] border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-sky-300' : 'text-slate-300'}`}>
                    {size.name}
                  </span>
                  {isSelected && <Check size={14} className="text-sky-400" />}
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1">{size.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Family Selection */}
      <div>
        <label className="text-xs font-black text-emerald-400 uppercase tracking-wider block mb-2.5">
          System Font Family
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {AVAILABLE_FONTS.map((font) => {
            const isSelected = currentFont === font.id;
            const previewFamily = font.id === 'system-ui' ? 'sans-serif' : font.name;
            return (
              <button
                key={font.id}
                onClick={() => handleSelectFont(font.id)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-[#151c2c] border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`text-sm font-bold truncate ${isSelected ? 'text-emerald-300' : 'text-white'}`}
                    style={{ fontFamily: previewFamily }}
                  >
                    {font.name}
                  </span>
                  {isSelected && <Check size={14} className="text-emerald-400 shrink-0 ml-1" />}
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">{font.category}</span>
                <span
                  className="text-xs text-slate-300/80 line-clamp-1 italic"
                  style={{ fontFamily: previewFamily }}
                >
                  Aa Bb Gg 123
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="bg-[#151c2c] border border-slate-700/80 rounded-xl p-4">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
          <span>LIVE PREVIEW (APPLIED INSTANTLY ACROSS ALL PAGES)</span>
          <span className="text-sky-400 font-bold">{currentFont} @ {currentSize}</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              CREATE STATE & HEADQUARTERS
            </h4>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Active Status
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[11px] mb-1">Form Input Value:</span>
              <span className="text-white font-semibold">Maharashtra - Mumbai Central HQ</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[11px] mb-1">Data Grid Row:</span>
              <span className="text-sky-400 font-bold">12 Total Visits Recorded</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a1f30] border border-slate-700 shadow-2xl rounded-2xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in duration-200">
        {content}
      </div>
    </div>
  );
}
