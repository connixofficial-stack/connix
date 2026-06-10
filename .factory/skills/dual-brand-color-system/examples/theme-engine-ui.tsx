import React from 'react';

type Palette = {
  solid: string;
  surface: string;
  textOnSolid: string;
  textInteractive: string;
};

type Props = {
  mode: 'single' | 'dual';
  primary: string;
  secondary: string;
  primaryPalette: Palette;
  secondaryPalette: Palette;
  similarity: number;
  onModeChange: (mode: 'single' | 'dual') => void;
  onPrimaryChange: (hex: string) => void;
  onSecondaryChange: (hex: string) => void;
  onHarmonyChange?: (value: 'analogous' | 'complementary' | 'triadic') => void;
};

export const ColorThemeControls = ({
  mode,
  primary,
  secondary,
  primaryPalette,
  secondaryPalette,
  similarity,
  onModeChange,
  onPrimaryChange,
  onSecondaryChange,
  onHarmonyChange,
}: Props) => {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${mode === 'single' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
          onClick={() => onModeChange('single')}
        >
          Single
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${mode === 'dual' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
          onClick={() => onModeChange('dual')}
        >
          Dual
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500">Primary</div>
          <div className="flex items-center gap-3">
            <input type="color" value={primary} onChange={(e) => onPrimaryChange(e.target.value)} />
            <PaletteStrip palette={primaryPalette} />
          </div>
        </div>

        <div className={`space-y-2 ${mode === 'dual' ? '' : 'opacity-60'}`}>
          <div className="text-xs font-semibold text-slate-500">Secondary</div>
          <div className="flex items-center gap-3">
            <input type="color" value={secondary} onChange={(e) => onSecondaryChange(e.target.value)} disabled={mode !== 'dual'} />
            <PaletteStrip palette={secondaryPalette} />
          </div>
        </div>
      </div>

      {mode === 'single' && onHarmonyChange && (
        <div className="text-xs text-slate-500">
          Harmony:
          <select className="ml-2 rounded border border-slate-200 px-2 py-1" onChange={(e) => onHarmonyChange(e.target.value as 'analogous' | 'complementary' | 'triadic')}>
            <option value="analogous">Analogous</option>
            <option value="complementary">Complementary</option>
            <option value="triadic">Triadic</option>
          </select>
        </div>
      )}

      {mode === 'dual' && similarity > 0.9 && (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Hai màu quá giống nhau (similarity &gt; 90%). Nên chọn màu tương phản hơn.
        </div>
      )}

      <div className="text-xs text-slate-500">
        60% neutral • 30% primary • 10% secondary (APCA contrast)
      </div>
    </div>
  );
};

const PaletteStrip = ({ palette }: { palette: Palette }) => (
  <div className="flex h-8 flex-1 overflow-hidden rounded-lg border border-slate-200">
    <div className="flex-1 text-[10px] flex items-center justify-center" style={{ backgroundColor: palette.surface, color: palette.textInteractive }}>
      Surface
    </div>
    <div className="flex-1 text-[10px] flex items-center justify-center" style={{ backgroundColor: palette.solid, color: palette.textOnSolid }}>
      Solid
    </div>
  </div>
);