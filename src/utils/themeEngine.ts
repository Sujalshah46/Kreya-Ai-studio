// Exact Theme Engine replicating original KreyaJewel360
// Extracted directly from production runtime

export interface ThemePreset {
  key: string;
  name: string;
  note: string;
  primary: string;
  secondary: string;
  accent: string;
  gold: string;
  sidebarStyle: 'dark' | 'light' | 'brand';
  sidebarBg: string;
  buttonStyle: 'solid' | 'gradient';
}

export interface ThemeConfig {
  preset: string;
  mode: 'light' | 'dark' | 'system';
  primary: string;
  secondary: string;
  accent: string;
  gold: string;
  sidebarStyle: 'dark' | 'light' | 'brand';
  sidebarBg: string;
  buttonStyle: 'solid' | 'gradient';
  fontScale: number;
  density: 'comfortable' | 'compact';
  radius: 'sharp' | 'rounded' | 'pill';
  navLayout: 'sidebar' | 'top';
  sidebarCollapsed: boolean;
  tableZebra: boolean;
  fontFamily: 'inter' | 'jakarta' | 'dm_sans' | 'poppins' | 'system';
  dashboardTiles?: string[];
}

export const THEME_STORAGE_KEY = 'kj_theme_v1';

export const DEFAULT_THEME: ThemeConfig = {
  preset: 'graphite_emerald',
  mode: 'light',
  primary: '#237a57',
  secondary: '#202522',
  accent: '#c5a46d',
  gold: '#c5a46d',
  sidebarStyle: 'dark',
  sidebarBg: '#171c19',
  buttonStyle: 'solid',
  fontScale: 1,
  density: 'comfortable',
  radius: 'rounded',
  navLayout: 'sidebar',
  sidebarCollapsed: false,
  tableZebra: false,
  fontFamily: 'inter',
  dashboardTiles: ['today_sales', 'today_collections', 'outstanding', 'open_repairs', 'active_loans', 'low_stock']
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: 'graphite_emerald',
    name: 'Graphite Emerald',
    note: 'Graphite, ivory, emerald and champagne gold (default)',
    primary: '#237a57',
    secondary: '#202522',
    accent: '#c5a46d',
    gold: '#c5a46d',
    sidebarStyle: 'dark',
    sidebarBg: '#171c19',
    buttonStyle: 'solid'
  },
  {
    key: 'deep_graphite',
    name: 'Deep Graphite',
    note: 'Graphite throughout, gold details',
    primary: '#202522',
    secondary: '#171c19',
    accent: '#c5a46d',
    gold: '#c5a46d',
    sidebarStyle: 'dark',
    sidebarBg: '#101411',
    buttonStyle: 'solid'
  },
  {
    key: 'royal_gold',
    name: 'Royal Gold',
    note: 'Muted gold actions on graphite',
    primary: '#8a6d3b',
    secondary: '#202522',
    accent: '#c5a46d',
    gold: '#c5a46d',
    sidebarStyle: 'dark',
    sidebarBg: '#1c1a16',
    buttonStyle: 'solid'
  },
  {
    key: 'classic_light',
    name: 'Classic Light',
    note: 'White navigation, emerald accents',
    primary: '#237a57',
    secondary: '#202522',
    accent: '#c5a46d',
    gold: '#c5a46d',
    sidebarStyle: 'light',
    sidebarBg: '#ffffff',
    buttonStyle: 'solid'
  },
  {
    key: 'sapphire',
    name: 'Sapphire',
    note: 'Steel blue, high contrast',
    primary: '#2f5f80',
    secondary: '#1d2a33',
    accent: '#c5a46d',
    gold: '#c5a46d',
    sidebarStyle: 'dark',
    sidebarBg: '#141c22',
    buttonStyle: 'solid'
  },
  {
    key: 'rose_gold',
    name: 'Rose Gold',
    note: 'Soft rose for bridal boutiques',
    primary: '#a2475e',
    secondary: '#2a1d21',
    accent: '#c5a46d',
    gold: '#c5a46d',
    sidebarStyle: 'dark',
    sidebarBg: '#221a1d',
    buttonStyle: 'solid'
  },
  {
    key: 'kreya_violet_classic',
    name: 'Kreya Violet',
    note: 'The earlier violet look (until 3.12)',
    primary: '#6d28d9',
    secondary: '#4f46e5',
    accent: '#c026d3',
    gold: '#d97706',
    sidebarStyle: 'brand',
    sidebarBg: '#1e1b4b',
    buttonStyle: 'gradient'
  }
];

export const FONTS: Record<string, { label: string; css: string; google: string | null }> = {
  inter: {
    label: 'Inter',
    css: "'Inter', system-ui, sans-serif",
    google: 'Inter:wght@400;500;600;700;800'
  },
  jakarta: {
    label: 'Plus Jakarta Sans',
    css: "'Plus Jakarta Sans', system-ui, sans-serif",
    google: 'Plus+Jakarta+Sans:wght@400;500;600;700;800'
  },
  dm_sans: {
    label: 'DM Sans',
    css: "'DM Sans', system-ui, sans-serif",
    google: 'DM+Sans:wght@400;500;600;700'
  },
  poppins: {
    label: 'Poppins',
    css: "'Poppins', system-ui, sans-serif",
    google: 'Poppins:wght@400;500;600;700'
  },
  system: {
    label: 'Device font',
    css: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    google: null
  }
};

const hexToRgb = (hex: string): [number, number, number] => {
  const t = parseInt(hex.replace('#', ''), 16);
  return [(t >> 16) & 255, (t >> 8) & 255, t & 255];
};

const mixHex = (c1: string, c2: string, weight: number): string => {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const mixed = rgb1.map((v, i) => Math.round(Math.max(0, Math.min(255, v + (rgb2[i] - v) * weight))));
  return '#' + mixed.map(v => v.toString(16).padStart(2, '0')).join('');
};

const hexToRgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
};

const luminance = (hex: string): number => {
  const rgb = hexToRgb(hex).map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
};

const isDark = (hex: string): boolean => luminance(hex) < 0.35;
const validHex = (hex: string, fallback: string): string => /^#[0-9a-fA-F]{6}$/.test(hex || '') ? hex : fallback;

export function computeThemeVars(theme: Partial<ThemeConfig> = {}) {
  const merged: ThemeConfig = { ...DEFAULT_THEME, ...theme };
  const primary = validHex(merged.primary, DEFAULT_THEME.primary);
  const secondary = validHex(merged.secondary, DEFAULT_THEME.secondary);
  const accent = validHex(merged.accent, DEFAULT_THEME.accent);
  const gold = validHex(merged.gold, DEFAULT_THEME.gold);

  const isDarkMode = merged.mode === 'dark' || (
    merged.mode === 'system' &&
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const vars: Record<string, string> = {};
  vars['--primary'] = primary;
  vars['--primary-d'] = mixHex(primary, '#000000', 0.28);
  vars['--primary-m'] = mixHex(primary, '#ffffff', 0.18);
  vars['--primary-l'] = isDarkMode ? hexToRgba(primary, 0.22) : mixHex(primary, '#ffffff', 0.86);
  vars['--primary-xl'] = isDarkMode ? hexToRgba(primary, 0.12) : mixHex(primary, '#ffffff', 0.94);
  vars['--secondary'] = secondary;
  vars['--accent'] = accent;
  vars['--gold-m'] = gold;
  vars['--gold'] = mixHex(gold, '#000000', 0.15);
  vars['--gold-d'] = mixHex(gold, '#000000', 0.45);
  vars['--gold-l'] = isDarkMode ? hexToRgba(gold, 0.18) : mixHex(gold, '#ffffff', 0.85);
  vars['--focus-ring'] = hexToRgba(primary, 0.16);
  vars['--sh-colored'] = `0 6px 18px ${hexToRgba(primary, 0.16)}`;
  vars['--champagne'] = accent;
  vars['--champagne-l'] = isDarkMode ? hexToRgba(accent, 0.14) : mixHex(accent, '#ffffff', 0.82);
  vars['--champagne-d'] = mixHex(accent, '#000000', 0.42);

  vars['--btn-bg'] = merged.buttonStyle === 'gradient'
    ? `linear-gradient(135deg, ${secondary} 0%, ${primary} 55%, ${accent} 100%)`
    : primary;
  vars['--btn-bg-hover'] = merged.buttonStyle === 'gradient'
    ? `linear-gradient(135deg, ${mixHex(secondary, '#000', 0.12)} 0%, ${mixHex(primary, '#000', 0.12)} 55%, ${mixHex(accent, '#000', 0.12)} 100%)`
    : mixHex(primary, '#000000', 0.15);
  vars['--btn-shadow'] = merged.buttonStyle === 'gradient'
    ? `0 4px 12px ${hexToRgba(primary, 0.24)}`
    : '0 1px 2px rgba(23,28,25,.10)';

  if (isDarkMode) {
    Object.assign(vars, {
      '--bg': '#111513',
      '--surface': '#1a1f1c',
      '--surface2': '#202622',
      '--border': '#2b322e',
      '--border2': '#39413c',
      '--text': '#eef0ec',
      '--text2': '#cdd2cd',
      '--muted': '#9aa29c',
      '--muted2': '#78817b',
      '--thead': '#1f2521',
      '--input-bg': '#151a17',
      '--row-hover': hexToRgba(primary, 0.12),
      '--zebra': 'rgba(255,255,255,.025)',
      '--ivory': '#1f2521',
      '--sk-base': '#232a26',
      '--sk-shine': '#2c342f',
      '--success-l': 'rgba(63,154,115,.16)',
      '--danger-l': 'rgba(185,74,72,.18)',
      '--warn-l': 'rgba(183,121,31,.18)',
      '--info-l': 'rgba(71,124,156,.18)'
    });
  } else {
    Object.assign(vars, {
      '--bg': '#f7f8f5',
      '--surface': '#ffffff',
      '--surface2': '#fbfbf9',
      '--border': '#e5e8e4',
      '--border2': '#d5dad4',
      '--text': '#202522',
      '--text2': '#3f4742',
      '--muted': '#626b65',
      '--muted2': '#89918b',
      '--thead': '#f7f6f1',
      '--input-bg': '#ffffff',
      '--row-hover': mixHex(primary, '#ffffff', 0.955),
      '--zebra': '#fafaf8',
      '--ivory': '#f5f2eb',
      '--sk-base': '#eceee9',
      '--sk-shine': '#f6f7f4',
      '--success-l': '#e8f2ec',
      '--danger-l': '#f8e9e8',
      '--warn-l': '#fbf1de',
      '--info-l': '#e8f0f5'
    });
  }

  let sbBg = validHex(merged.sidebarBg, DEFAULT_THEME.sidebarBg);
  if (merged.sidebarStyle === 'light') {
    sbBg = isDarkMode ? '#17182b' : '#ffffff';
  } else if (merged.sidebarStyle === 'dark') {
    sbBg = isDarkMode ? mixHex(sbBg, '#000000', 0.25) : sbBg;
  }

  const darkSidebar = isDark(sbBg);
  vars['--sb-bg'] = merged.sidebarStyle === 'brand'
    ? `linear-gradient(180deg, ${sbBg} 0%, ${mixHex(sbBg, primary, 0.18)} 100%)`
    : sbBg;
  vars['--sb-solid'] = sbBg;
  vars['--sb-text'] = darkSidebar ? 'rgba(255,255,255,.70)' : '#3f4742';
  vars['--sb-text-strong'] = darkSidebar ? '#ffffff' : '#202522';
  vars['--sb-label'] = darkSidebar ? 'rgba(255,255,255,.38)' : '#89918b';
  vars['--sb-hover'] = darkSidebar ? 'rgba(255,255,255,.05)' : '#f3f4f1';
  vars['--sb-active'] = darkSidebar ? 'rgba(255,255,255,.08)' : mixHex(primary, '#ffffff', 0.9);
  vars['--sb-active-text'] = darkSidebar ? '#ffffff' : primary;
  vars['--sb-border'] = darkSidebar ? 'rgba(255,255,255,.06)' : '#e5e8e4';
  vars['--sb-indicator'] = darkSidebar && isDark(primary) ? mixHex(primary, '#ffffff', 0.22) : primary;

  const font = FONTS[merged.fontFamily] || FONTS.inter;
  vars['--font'] = font.css;
  vars['--font-display'] = font.css;
  vars['--fs'] = Math.round(14 * Math.min(1.25, Math.max(0.85, Number(merged.fontScale) || 1)) * 10) / 10 + 'px';

  const isCompact = merged.density === 'compact';
  vars['--pad-cell'] = isCompact ? '8px 11px' : '12px 13px';
  vars['--pad-input'] = isCompact ? '7px 10px' : '10px 12px';
  vars['--pad-btn'] = isCompact ? '7px 12px' : '9px 16px';
  vars['--gap'] = isCompact ? '10px' : '14px';

  const radii = {
    sharp: [3, 4, 5, 6, 8, 10],
    rounded: [6, 8, 10, 14, 16, 20],
    pill: [8, 12, 14, 18, 22, 28]
  }[merged.radius] || [6, 8, 10, 14, 16, 20];

  ['--r-xs', '--r-sm', '--r', '--r-lg', '--r-xl', '--r-2xl'].forEach((key, idx) => {
    vars[key] = `${radii[idx]}px`;
  });
  vars['--btn-radius'] = merged.radius === 'pill' ? '999px' : `${radii[1] + 1}px`;

  return { vars, isDarkMode, font, theme: merged };
}

let loadedGoogleFont: string | null = null;

export function applyTheme(theme: Partial<ThemeConfig>, { persist = true } = {}): ThemeConfig {
  const { vars, isDarkMode, font, theme: finalTheme } = computeThemeVars(theme);
  
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.theme = isDarkMode ? 'dark' : 'light';
    root.dataset.density = finalTheme.density;
    root.dataset.nav = finalTheme.navLayout;
    root.dataset.zebra = finalTheme.tableZebra ? 'on' : 'off';
    root.dataset.sidebar = finalTheme.sidebarStyle;

    if (font.google && loadedGoogleFont !== font.google) {
      loadedGoogleFont = font.google;
      let link = document.getElementById('kj-font') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.id = 'kj-font';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = `https://fonts.googleapis.com/css2?family=${font.google}&family=JetBrains+Mono:wght@400;600&display=swap`;
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', vars['--sb-solid'] || '#171c19');
    }
  }

  if (persist && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(finalTheme));
    } catch {}
  }

  return finalTheme;
}

export function loadSavedTheme(): ThemeConfig {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_THEME, ...parsed };
      }
    } catch {}
  }
  return DEFAULT_THEME;
}
