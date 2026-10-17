import axios from 'axios';

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
  { id: '14px', name: 'Standard (Default)', scale: '14px', desc: 'Balanced standard UI scale (Recommended)' },
  { id: '15px', name: 'Comfortable', scale: '15px', desc: 'Enhanced clarity & comfortable reading' },
  { id: '16px', name: 'Large', scale: '16px', desc: 'High visibility & readability for all screens' }
];

export const MENU_HEADING_SIZES: FontSizeOption[] = [
  { id: '14px', name: 'Compact 14px', scale: '14px', desc: '14px Bold, Title Case for smaller screens' },
  { id: '16px', name: 'Standard 16px (Default)', scale: '16px', desc: 'Default Benchmark — 16px Bold, Title Case (Recommended)' },
  { id: '18px', name: 'Large 18px', scale: '18px', desc: '18px Bold, Title Case for high visibility' },
  { id: '20px', name: 'Ex. Large 20px', scale: '20px', desc: '20px Bold, Title Case — High prominence & enhanced readability' },
  { id: '22px', name: 'Huge 22px', scale: '22px', desc: '22px Bold, Title Case — Maximum impact' }
];

export function getSavedTypography() {
  return {
    fontFamily: localStorage.getItem('xla_font_family') || 'Montserrat',
    fontSize: localStorage.getItem('xla_font_size') || '14px',
    menuHeadingSize: localStorage.getItem('xla_menu_heading_size') || '16px'
  };
}

export function applyTypography(fontFamily: string, fontSize: string, menuHeadingSize: string = '16px', syncRemote: boolean = true) {
  try {
    localStorage.setItem('xla_font_family', fontFamily);
    localStorage.setItem('xla_font_size', fontSize);
    localStorage.setItem('xla_menu_heading_size', menuHeadingSize);

    const fontValue = fontFamily === 'system-ui'
      ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      : `'${fontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

    document.documentElement.style.setProperty('--font-sans', fontValue);
    document.documentElement.style.setProperty('--app-font-size', fontSize);
    document.documentElement.style.setProperty('--menu-heading-size', menuHeadingSize);
    document.documentElement.style.fontSize = fontSize;
    document.body.style.fontFamily = fontValue;

    window.dispatchEvent(new CustomEvent('xla_typography_changed', { 
      detail: { fontFamily, fontSize, menuHeadingSize } 
    }));

    if (syncRemote) {
      axios.post('/api/xl/admin/settings/typography', {
        fontFamily,
        fontSize,
        menuHeadingSize
      }).catch(e => console.warn('Could not persist typography to server', e.message));
    }
  } catch (e) {
    console.error('Failed to apply typography', e);
  }
}

export function initializeTypography() {
  // Step 1: Immediately apply locally saved preferences for instant render
  const local = getSavedTypography();
  applyTypography(local.fontFamily, local.fontSize, local.menuHeadingSize, false);

  // Step 2: Sync with database so settings persist across new logins and devices
  axios.get('/api/xl/admin/settings/typography').then(res => {
    if (res.data?.success && res.data.data) {
      const { fontFamily, fontSize, menuHeadingSize } = res.data.data;
      if (fontFamily && fontSize && menuHeadingSize) {
        applyTypography(fontFamily, fontSize, menuHeadingSize, false);
      }
    }
  }).catch(() => {});
}
