export interface FontOption {
  id: string;
  name: string;
  category: string;
  sample: string;
}

export interface FontSizeOption {
  id: string;
  name: string;
  scale: string;
  desc: string;
}

export const AVAILABLE_FONTS: FontOption[] = [
  { id: 'Montserrat', name: 'Montserrat', category: 'Geometric Sans', sample: 'The quick brown fox jumps over the lazy dog' },
  { id: 'Inter', name: 'Inter', category: 'Modern SaaS UI', sample: 'The quick brown fox jumps over the lazy dog' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', category: 'Executive Tech', sample: 'The quick brown fox jumps over the lazy dog' },
  { id: 'Poppins', name: 'Poppins', category: 'Clean & Rounded', sample: 'The quick brown fox jumps over the lazy dog' },
  { id: 'Roboto', name: 'Roboto', category: 'Neutral & Clear', sample: 'The quick brown fox jumps over the lazy dog' },
  { id: 'Outfit', name: 'Outfit', category: 'Contemporary Display', sample: 'The quick brown fox jumps over the lazy dog' },
  { id: 'system-ui', name: 'System Default', category: 'Native OS', sample: 'The quick brown fox jumps over the lazy dog' }
];

export const FONT_SIZES: FontSizeOption[] = [
  { id: '13px', name: 'Compact', scale: '13px', desc: 'Dense data grids & high information density' },
  { id: '14px', name: 'Standard', scale: '14px', desc: 'Balanced SaaS standard (Recommended)' },
  { id: '15px', name: 'Comfortable', scale: '15px', desc: 'Enhanced clarity & comfortable reading' },
  { id: '16px', name: 'Large', scale: '16px', desc: 'High visibility & readability for all screens' }
];

export function getSavedTypography() {
  return {
    fontFamily: localStorage.getItem('xla_font_family') || 'Montserrat',
    fontSize: localStorage.getItem('xla_font_size') || '14px'
  };
}

export function applyTypography(fontFamily: string, fontSize: string) {
  try {
    localStorage.setItem('xla_font_family', fontFamily);
    localStorage.setItem('xla_font_size', fontSize);

    const fontValue = fontFamily === 'system-ui'
      ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      : `'${fontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

    document.documentElement.style.setProperty('--font-sans', fontValue);
    document.documentElement.style.setProperty('--app-font-size', fontSize);
    document.documentElement.style.fontSize = fontSize;
    document.body.style.fontFamily = fontValue;

    window.dispatchEvent(new CustomEvent('xla_typography_changed', { detail: { fontFamily, fontSize } }));
  } catch (e) {
    console.error('Failed to apply typography', e);
  }
}

export function initializeTypography() {
  const { fontFamily, fontSize } = getSavedTypography();
  applyTypography(fontFamily, fontSize);
}
