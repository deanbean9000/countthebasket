// ─── Shared game settings constants ──────────────────────────────────────────

export const WIDGET_META = {
  scoreboard:  { label: '📊 Scoreboard' },
  homeRoster:  { label: '🏠 Home Roster' },
  quickEntry:  { label: '⌨️ Quick Entry' },
  awayRoster:  { label: '✈️ Away Roster' },
  playerCards: { label: '🃏 Player Stats' },
};

export const SLOTS = [
  { id: 'top',        cls: 'slot-top'        },
  { id: 'left-mid',   cls: 'slot-left-mid'   },
  { id: 'center-mid', cls: 'slot-center-mid' },
  { id: 'right-mid',  cls: 'slot-right-mid'  },
  { id: 'left-bot',   cls: 'slot-left-bot'   },
  { id: 'center-bot', cls: 'slot-center-bot' },
  { id: 'right-bot',  cls: 'slot-right-bot'  },
];

export const DEFAULT_LAYOUT = {
  'top':        'scoreboard',
  'left-mid':   'homeRoster',
  'center-mid': 'quickEntry',
  'right-mid':  'awayRoster',
  'left-bot':   null,
  'center-bot': 'playerCards',
  'right-bot':  null,
};

export const DEFAULT_VISIBLE = Object.fromEntries(
  Object.keys(WIDGET_META).map(k => [k, true])
);

export const DEFAULT_THEME  = 'blue';
export const DEFAULT_CUSTOM = { bg: '#1a2d5a', accent: '#ffd700', text: '#ffffff' };

export function hexToRgba(hex, alpha = 1) {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildCustomVars({ bg, accent, text }) {
  return {
    '--bg-gradient':          bg,
    '--text-color':           text,
    '--accent-color':         accent,
    '--accent-dim':           hexToRgba(accent, 0.65),
    '--accent-border':        hexToRgba(accent, 0.4),
    '--accent-hover-bg':      hexToRgba(accent, 0.1),
    '--accent-glow':          hexToRgba(accent, 0.25),
    '--widget-bg':            'rgba(0, 0, 0, 0.28)',
    '--widget-header-bg':     hexToRgba(accent, 0.07),
    '--widget-header-border': hexToRgba(accent, 0.18),
    '--settings-panel-bg':    'rgba(10, 10, 15, 0.97)',
  };
}

export const THEMES = {
  blue: {
    label: 'Classic Blue',
    swatchBg: 'linear-gradient(135deg, #1e3c72, #2a5298)',
    swatchAccent: '#ffd700',
    vars: {
      '--bg-gradient':          'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      '--text-color':           '#ffffff',
      '--accent-color':         '#ffd700',
      '--accent-dim':           'rgba(255, 215, 0, 0.65)',
      '--accent-border':        'rgba(255, 215, 0, 0.4)',
      '--accent-hover-bg':      'rgba(255, 215, 0, 0.1)',
      '--accent-glow':          'rgba(255, 215, 0, 0.25)',
      '--widget-bg':            'rgba(0, 0, 0, 0.28)',
      '--widget-header-bg':     'rgba(255, 215, 0, 0.07)',
      '--widget-header-border': 'rgba(255, 215, 0, 0.18)',
      '--settings-panel-bg':    'linear-gradient(145deg, #1a2d5a, #0f1e3e)',
    },
  },
  dark: {
    label: 'Dark Court',
    swatchBg: 'linear-gradient(135deg, #0a0a0a, #1c1c1c)',
    swatchAccent: '#ff6b35',
    vars: {
      '--bg-gradient':          'linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 100%)',
      '--text-color':           '#ffffff',
      '--accent-color':         '#ff6b35',
      '--accent-dim':           'rgba(255, 107, 53, 0.65)',
      '--accent-border':        'rgba(255, 107, 53, 0.4)',
      '--accent-hover-bg':      'rgba(255, 107, 53, 0.1)',
      '--accent-glow':          'rgba(255, 107, 53, 0.25)',
      '--widget-bg':            'rgba(255, 255, 255, 0.04)',
      '--widget-header-bg':     'rgba(255, 107, 53, 0.07)',
      '--widget-header-border': 'rgba(255, 107, 53, 0.18)',
      '--settings-panel-bg':    'linear-gradient(145deg, #1a1a1a, #0d0d0d)',
    },
  },
  green: {
    label: 'Forest Green',
    swatchBg: 'linear-gradient(135deg, #0d3320, #145a32)',
    swatchAccent: '#69f0ae',
    vars: {
      '--bg-gradient':          'linear-gradient(135deg, #0d3320 0%, #145a32 100%)',
      '--text-color':           '#ffffff',
      '--accent-color':         '#69f0ae',
      '--accent-dim':           'rgba(105, 240, 174, 0.65)',
      '--accent-border':        'rgba(105, 240, 174, 0.4)',
      '--accent-hover-bg':      'rgba(105, 240, 174, 0.1)',
      '--accent-glow':          'rgba(105, 240, 174, 0.25)',
      '--widget-bg':            'rgba(0, 0, 0, 0.3)',
      '--widget-header-bg':     'rgba(105, 240, 174, 0.07)',
      '--widget-header-border': 'rgba(105, 240, 174, 0.18)',
      '--settings-panel-bg':    'linear-gradient(145deg, #0d3320, #07200f)',
    },
  },
  purple: {
    label: 'Purple Rain',
    swatchBg: 'linear-gradient(135deg, #2d0b5e, #4a1080)',
    swatchAccent: '#e040fb',
    vars: {
      '--bg-gradient':          'linear-gradient(135deg, #2d0b5e 0%, #4a1080 100%)',
      '--text-color':           '#ffffff',
      '--accent-color':         '#e040fb',
      '--accent-dim':           'rgba(224, 64, 251, 0.65)',
      '--accent-border':        'rgba(224, 64, 251, 0.4)',
      '--accent-hover-bg':      'rgba(224, 64, 251, 0.1)',
      '--accent-glow':          'rgba(224, 64, 251, 0.25)',
      '--widget-bg':            'rgba(0, 0, 0, 0.3)',
      '--widget-header-bg':     'rgba(224, 64, 251, 0.07)',
      '--widget-header-border': 'rgba(224, 64, 251, 0.18)',
      '--settings-panel-bg':    'linear-gradient(145deg, #2d0b5e, #1e0840)',
    },
  },
  crimson: {
    label: 'Crimson',
    swatchBg: 'linear-gradient(135deg, #5c0a0a, #8b1a1a)',
    swatchAccent: '#ffcc02',
    vars: {
      '--bg-gradient':          'linear-gradient(135deg, #5c0a0a 0%, #8b1a1a 100%)',
      '--text-color':           '#ffffff',
      '--accent-color':         '#ffcc02',
      '--accent-dim':           'rgba(255, 204, 2, 0.65)',
      '--accent-border':        'rgba(255, 204, 2, 0.4)',
      '--accent-hover-bg':      'rgba(255, 204, 2, 0.1)',
      '--accent-glow':          'rgba(255, 204, 2, 0.25)',
      '--widget-bg':            'rgba(0, 0, 0, 0.3)',
      '--widget-header-bg':     'rgba(255, 204, 2, 0.07)',
      '--widget-header-border': 'rgba(255, 204, 2, 0.18)',
      '--settings-panel-bg':    'linear-gradient(145deg, #5c0a0a, #3d0606)',
    },
  },
  midnight: {
    label: 'Midnight',
    swatchBg: 'linear-gradient(135deg, #050a1a, #0d1b3e)',
    swatchAccent: '#40c4ff',
    vars: {
      '--bg-gradient':          'linear-gradient(135deg, #050a1a 0%, #0d1b3e 100%)',
      '--text-color':           '#ffffff',
      '--accent-color':         '#40c4ff',
      '--accent-dim':           'rgba(64, 196, 255, 0.65)',
      '--accent-border':        'rgba(64, 196, 255, 0.4)',
      '--accent-hover-bg':      'rgba(64, 196, 255, 0.1)',
      '--accent-glow':          'rgba(64, 196, 255, 0.25)',
      '--widget-bg':            'rgba(255, 255, 255, 0.04)',
      '--widget-header-bg':     'rgba(64, 196, 255, 0.07)',
      '--widget-header-border': 'rgba(64, 196, 255, 0.18)',
      '--settings-panel-bg':    'linear-gradient(145deg, #050a1a, #02071a)',
    },
  },
};

export const STORAGE_KEY = 'ctb_widget_layout_v1';

export function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export const EXTRA_STATS = [
  { key: 'assists', label: '🤝 Assists [A]' },
  { key: 'steals',  label: '🫳 Steals [S]'  },
  { key: 'blocks',  label: '✋ Blocks [B]'  },
];
