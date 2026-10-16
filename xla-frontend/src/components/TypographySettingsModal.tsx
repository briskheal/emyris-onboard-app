import { useState, useEffect } from 'react';
import { Check, RotateCcw, X, Sliders, Heading } from 'lucide-react';
import { AVAILABLE_FONTS, FONT_SIZES, MENU_HEADING_SIZES, getSavedTypography, applyTypography } from '../utils/typography';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  isInline?: boolean; // If true, renders as an inline panel inside Settings rather than a floating modal
}

export default function TypographySettingsModal({ isOpen = true, onClose, isInline = false }: Props) {
  const [currentFont, setCurrentFont] = useState('Montserrat');
  const [currentSize, setCurrentSize] = useState('14px');
  const [currentMenuSize, setCurrentMenuSize] = useState('16px');

  useEffect(() => {
    const { fontFamily, fontSize, menuHeadingSize } = getSavedTypography();
    setCurrentFont(fontFamily);
    setCurrentSize(fontSize);
    setCurrentMenuSize(menuHeadingSize);

    const handler = (e: any) => {
      if (e.detail) {
        setCurrentFont(e.detail.fontFamily);
        setCurrentSize(e.detail.fontSize);
        if (e.detail.menuHeadingSize) setCurrentMenuSize(e.detail.menuHeadingSize);
      }
    };
    window.addEventListener('xla_typography_changed', handler);
    return () => window.removeEventListener('xla_typography_changed', handler);
  }, []);

  const handleSelectFont = (fontId: string) => {
    setCurrentFont(fontId);
    applyTypography(fontId, currentSize, currentMenuSize);
  };

  const handleSelectSize = (sizeId: string) => {
    setCurrentSize(sizeId);
    applyTypography(currentFont, sizeId, currentMenuSize);
  };

  const handleSelectMenuSize = (menuSizeId: string) => {
    setCurrentMenuSize(menuSizeId);
    applyTypography(currentFont, currentSize, menuSizeId);
  };

  const handleReset = () => {
    setCurrentFont('Montserrat');
    setCurrentSize('14px');
    setCurrentMenuSize('16px');
    applyTypography('Montserrat', '14px', '16px');
  };

  if (!isOpen && !isInline) return null;

  const content = (
    <div className={`flex flex-col gap-6 ${isInline ? 'bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-base tracking-wide">
              Display & Typography Settings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize system font family, central menu headings, and general screen text scaling
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors border border-slate-600/50"
            title="Reset to default Montserrat 14px and 16px headings"
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

      {/* Central Menu Headings Section */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-amber-400 tracking-wide flex items-center gap-2">
            <Heading size={14} />
            <span>Central Menu Headings Style & Size</span>
            <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
              Default: 16px Bold Title Case
            </span>
          </label>
        </div>
        <p className="text-[11px] text-slate-400 mb-2.5">
          Controls the header typography across all admin sub-menus (Manage Expenses, Area Creation, Users, Products, DCS, Approvals, Leave, Lists, etc.)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {MENU_HEADING_SIZES.map((item) => {
            const isSelected = currentMenuSize === item.scale;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectMenuSize(item.scale)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-[#151c2c] border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                    {item.name}
                  </span>
                  {isSelected && <Check size={14} className="text-amber-400" />}
                </div>
                <span className="text-[10px] text-slate-400">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Font Size / Scale Selection */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-sky-400 tracking-wide flex items-center gap-2">
            <span>Base UI Font Size & Scale</span>
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
        <label className="text-xs font-bold text-emerald-400 tracking-wide block mb-2.5">
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
        <div className="text-[11px] font-bold text-slate-400 tracking-wide mb-3 flex items-center justify-between">
          <span>Live Preview (Applied Instantly Across All Pages)</span>
          <span className="text-sky-400 font-bold">{currentFont} @ {currentSize} (Headings: {currentMenuSize})</span>
        </div>
        <div className="space-y-3">
          {/* Central Menu Heading Preview */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Central Menu Heading Preview:</span>
              <h2 className="text-white font-bold tracking-wide" style={{ fontSize: currentMenuSize }}>
                Manage Expenses
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              {currentMenuSize} Bold Title Case
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
            <h4 className="text-sm font-bold text-white tracking-wide">
              Create State & Headquarters
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
