import { useState, useRef, useEffect } from 'react';
import './GameGrid.css';
import ScoreboardWidget from './ScoreboardWidget';
import QuickEntryWidget from './QuickEntryWidget';
import RosterWidget from './RosterWidget';
import PlayerCardsWidget from './PlayerCardsWidget';

// ─── Widget metadata ──────────────────────────────────────────────────────────
const WIDGET_META = {
  scoreboard:  { label: '📊 Scoreboard' },
  homeRoster:  { label: '🏠 Home Roster' },
  quickEntry:  { label: '⌨️ Quick Entry' },
  awayRoster:  { label: '✈️ Away Roster' },
  playerCards: { label: '🃏 Player Stats' },
};

// ─── Fixed grid slots ─────────────────────────────────────────────────────────
// There are always 7 slots: 1 full-width top row + 3-column × 2 rows below.
// Widgets are assigned to slots; dragging a widget swaps its slot with another.
const SLOTS = [
  { id: 'top',        cls: 'slot-top'        },
  { id: 'left-mid',   cls: 'slot-left-mid'   },
  { id: 'center-mid', cls: 'slot-center-mid' },
  { id: 'right-mid',  cls: 'slot-right-mid'  },
  { id: 'left-bot',   cls: 'slot-left-bot'   },
  { id: 'center-bot', cls: 'slot-center-bot' },
  { id: 'right-bot',  cls: 'slot-right-bot'  },
];

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_LAYOUT = {
  'top':        'scoreboard',
  'left-mid':   'homeRoster',
  'center-mid': 'quickEntry',
  'right-mid':  'awayRoster',
  'left-bot':   null,
  'center-bot': 'playerCards',
  'right-bot':  null,
};

const DEFAULT_VISIBLE = Object.fromEntries(
  Object.keys(WIDGET_META).map(k => [k, true])
);

// ─── Color utilities ──────────────────────────────────────────────────────────
function hexToRgba(hex, alpha = 1) {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildCustomVars({ bg, accent, text }) {
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

// ─── Colour themes ─────────────────────────────────────────────────────────────
const THEMES = {
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

const DEFAULT_THEME  = 'blue';
const DEFAULT_CUSTOM = { bg: '#1a2d5a', accent: '#ffd700', text: '#ffffff' };

// ─── localStorage persistence ─────────────────────────────────────────────────
const STORAGE_KEY = 'ctb_widget_layout_v1';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Component ────────────────────────────────────────────────────────────────
function GameGrid({
  homeTeamName,
  awayTeamName,
  players,
  homeStats,
  awayStats,
  prompt,
  inputRef,
  onKeyPress,
  onEndGame,
  onPlayerSelect,
  actionHistory = [],
  onUndo,
}) {
  const [layout,  setLayout]  = useState(() => loadSaved()?.layout  ?? DEFAULT_LAYOUT);
  const [visible, setVisible] = useState(() => loadSaved()?.visible ?? DEFAULT_VISIBLE);
  const [theme,   setTheme]   = useState(() => loadSaved()?.theme   ?? DEFAULT_THEME);
  const [custom,  setCustom]  = useState(() => loadSaved()?.custom  ?? DEFAULT_CUSTOM);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Draft copies — only committed to real state on Apply
  const [draftLayout,  setDraftLayout]  = useState(DEFAULT_LAYOUT);
  const [draftVisible, setDraftVisible] = useState(DEFAULT_VISIBLE);
  const [draftTheme,   setDraftTheme]   = useState(DEFAULT_THEME);
  const [draftCustom,  setDraftCustom]  = useState(DEFAULT_CUSTOM);

  // Persist layout + visibility + theme + custom colors to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout, visible, theme, custom }));
  }, [layout, visible, theme, custom]);

  // Apply theme CSS variables to :root whenever the active theme or custom values change
  useEffect(() => {
    const vars = theme === 'custom'
      ? buildCustomVars(custom)
      : (THEMES[theme]?.vars ?? THEMES[DEFAULT_THEME].vars);
    const root = document.documentElement;
    Object.entries(vars).forEach(([prop, val]) => root.style.setProperty(prop, val));
  }, [theme, custom]);

  // ── Live grid drag-and-drop ────────────────────────────────────────────
  const liveFromSlot = useRef(null);
  const [liveOverSlot, setLiveOverSlot] = useState(null);

  const onLiveDragStart = (e, slotId) => {
    liveFromSlot.current = slotId;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onLiveDragOver = (e, slotId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (liveOverSlot !== slotId) setLiveOverSlot(slotId);
  };
  const onLiveDrop = (e, toId) => {
    e.preventDefault();
    const fromId = liveFromSlot.current;
    setLiveOverSlot(null);
    liveFromSlot.current = null;
    if (!fromId || fromId === toId) return;
    setLayout(prev => {
      const n = { ...prev };
      [n[fromId], n[toId]] = [n[toId], n[fromId]];
      return n;
    });
  };
  const onLiveDragEnd = () => { setLiveOverSlot(null); liveFromSlot.current = null; };

  // ── Settings panel ─────────────────────────────────────────────────────
  const openSettings = () => {
    setDraftLayout({ ...layout });
    setDraftVisible({ ...visible });
    setDraftTheme(theme);
    setDraftCustom({ ...custom });
    setSettingsOpen(true);
  };
  const applySettings = () => {
    setLayout({ ...draftLayout });
    setVisible({ ...draftVisible });
    setTheme(draftTheme);
    setCustom({ ...draftCustom });
    setSettingsOpen(false);
  };
  const resetToDefaults = () => {
    setDraftLayout({ ...DEFAULT_LAYOUT });
    setDraftVisible({ ...DEFAULT_VISIBLE });
    setDraftTheme(DEFAULT_THEME);
    setDraftCustom({ ...DEFAULT_CUSTOM });
  };

  // Settings panel drag-and-drop (edits draft, not live state)
  const settFromSlot = useRef(null);
  const [settOverSlot, setSettOverSlot] = useState(null);

  const onSettDragStart = (e, id) => { settFromSlot.current = id; e.dataTransfer.effectAllowed = 'move'; };
  const onSettDragOver  = (e, id) => { e.preventDefault(); if (settOverSlot !== id) setSettOverSlot(id); };
  const onSettDrop = (e, toId) => {
    e.preventDefault();
    const fromId = settFromSlot.current;
    setSettOverSlot(null);
    settFromSlot.current = null;
    if (!fromId || fromId === toId) return;
    setDraftLayout(prev => {
      const n = { ...prev };
      [n[fromId], n[toId]] = [n[toId], n[fromId]];
      return n;
    });
  };
  const onSettDragEnd = () => { setSettOverSlot(null); settFromSlot.current = null; };

  // ── Widget content renderer ────────────────────────────────────────────
  const renderWidget = (key) => {
    switch (key) {
      case 'scoreboard':
        return <ScoreboardWidget homeTeamName={homeTeamName} awayTeamName={awayTeamName} homeStats={homeStats} awayStats={awayStats} onEndGame={onEndGame} />;
      case 'homeRoster':
        return <RosterWidget teamName={homeTeamName} players={players} team="Home" onPlayerSelect={onPlayerSelect} />;
      case 'quickEntry':
        return <QuickEntryWidget prompt={prompt} inputRef={inputRef} onKeyPress={onKeyPress} actionHistory={actionHistory} onUndo={onUndo} />;
      case 'awayRoster':
        return <RosterWidget teamName={awayTeamName} players={players} team="Away" onPlayerSelect={onPlayerSelect} />;
      case 'playerCards':
        return <PlayerCardsWidget homeTeamName={homeTeamName} awayTeamName={awayTeamName} homeStats={homeStats} awayStats={awayStats} players={players} />;
      default:
        return null;
    }
  };

  return (
    <div className="game-grid-wrapper">

      {/* ── Config bar ──────────────────────────────────────────────────── */}
      <div className="widget-config-bar">
        <span className="widget-config-label">Layout</span>
        <button className="btn-layout-settings" onClick={openSettings}>
          ⚙ Customize Widgets
        </button>
      </div>

      {/* ── Live game grid ──────────────────────────────────────────────── */}
      <div className="game-grid">
        {SLOTS.map(slot => {
          const key       = layout[slot.id];
          const isVisible = !!(key && visible[key]);
          const isOver    = liveOverSlot === slot.id;
          return (
            <div
              key={slot.id}
              className={[
                'grid-slot',
                slot.cls,
                !isVisible ? 'grid-slot--empty' : '',
                isOver     ? 'grid-slot--over'  : '',
              ].filter(Boolean).join(' ')}
              draggable={isVisible}
              onDragStart={(e) => isVisible && onLiveDragStart(e, slot.id)}
              onDragOver={(e)  => onLiveDragOver(e, slot.id)}
              onDrop={(e)      => onLiveDrop(e, slot.id)}
              onDragEnd={onLiveDragEnd}
            >
              {isVisible
                ? renderWidget(key)
                : <div className="slot-drop-hint">Drop here</div>
              }
            </div>
          );
        })}
      </div>

      {/* ── Settings modal ──────────────────────────────────────────────── */}
      {settingsOpen && (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="settings-panel" onClick={e => e.stopPropagation()}>

            <div className="settings-header">
              <h2 className="settings-title">⚙ Customize Widgets</h2>
              <button className="settings-close" onClick={() => setSettingsOpen(false)} aria-label="Close">✕</button>
            </div>

            {/* Show / hide toggles */}
            <div className="settings-section">
              <h3 className="settings-section-title">Show / Hide</h3>
              <div className="settings-visibility-grid">
                {Object.entries(WIDGET_META).map(([key, meta]) => (
                  <label key={key} className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={!!draftVisible[key]}
                      onChange={() => setDraftVisible(prev => ({ ...prev, [key]: !prev[key] }))}
                    />
                    <span>{meta.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mini grid — drag tiles to rearrange */}
            <div className="settings-section">
              <h3 className="settings-section-title">Arrange — drag tiles to swap positions</h3>
              <div className="settings-grid-preview">
                {SLOTS.map(slot => {
                  const key      = draftLayout[slot.id];
                  const isHidden = !!(key && !draftVisible[key]);
                  const isOver   = settOverSlot === slot.id;
                  return (
                    <div
                      key={slot.id}
                      className={[
                        'settings-slot',
                        slot.cls,
                        !key     ? 'settings-slot--empty'  : '',
                        isHidden ? 'settings-slot--hidden' : '',
                        isOver   ? 'settings-slot--over'   : '',
                      ].filter(Boolean).join(' ')}
                      draggable={!!key}
                      onDragStart={(e) => key && onSettDragStart(e, slot.id)}
                      onDragOver={(e)  => onSettDragOver(e, slot.id)}
                      onDrop={(e)      => onSettDrop(e, slot.id)}
                      onDragEnd={onSettDragEnd}
                    >
                      {key
                        ? <span>{WIDGET_META[key].label}{isHidden ? <em> hidden</em> : ''}</span>
                        : <span className="settings-slot-empty-label">Empty</span>
                      }
                    </div>
                  );
                })}
              </div>
              <p className="settings-hint">💡 Drag-and-drop also works directly on the game screen.</p>
            </div>

            {/* Color Theme */}
            <div className="settings-section">
              <h3 className="settings-section-title">Color Theme</h3>
              <div className="settings-theme-grid">
                {Object.entries(THEMES).map(([key, meta]) => (
                  <button
                    key={key}
                    className={`settings-theme-btn${draftTheme === key ? ' settings-theme-btn--active' : ''}`}
                    onClick={() => setDraftTheme(key)}
                  >
                    <span
                      className="settings-theme-swatch"
                      style={{ background: meta.swatchBg, borderColor: meta.swatchAccent }}
                    />
                    <span>{meta.label}</span>
                  </button>
                ))}
                {/* Custom entry */}
                <button
                  className={`settings-theme-btn${draftTheme === 'custom' ? ' settings-theme-btn--active' : ''}`}
                  onClick={() => setDraftTheme('custom')}
                >
                  <span className="settings-theme-swatch settings-theme-swatch--rainbow" />
                  <span>Custom</span>
                </button>
              </div>

              {/* Color wheel pickers — only visible when Custom is selected */}
              {draftTheme === 'custom' && (
                <div className="settings-color-pickers">
                  <label className="settings-color-row">
                    <span className="settings-color-label">🎨 Background</span>
                    <input
                      type="color"
                      className="settings-color-input"
                      value={draftCustom.bg}
                      onChange={e => setDraftCustom(p => ({ ...p, bg: e.target.value }))}
                    />
                    <span className="settings-color-hex">{draftCustom.bg}</span>
                  </label>
                  <label className="settings-color-row">
                    <span className="settings-color-label">✨ Accent / Highlights</span>
                    <input
                      type="color"
                      className="settings-color-input"
                      value={draftCustom.accent}
                      onChange={e => setDraftCustom(p => ({ ...p, accent: e.target.value }))}
                    />
                    <span className="settings-color-hex">{draftCustom.accent}</span>
                  </label>
                  <label className="settings-color-row">
                    <span className="settings-color-label">🔤 Text</span>
                    <input
                      type="color"
                      className="settings-color-input"
                      value={draftCustom.text}
                      onChange={e => setDraftCustom(p => ({ ...p, text: e.target.value }))}
                    />
                    <span className="settings-color-hex">{draftCustom.text}</span>
                  </label>
                </div>
              )}
            </div>

            <div className="settings-actions">
              <button className="btn-settings-reset" onClick={resetToDefaults}>Reset to defaults</button>
              <div className="settings-actions-right">
                <button className="btn-settings-cancel" onClick={() => setSettingsOpen(false)}>Cancel</button>
                <button className="btn-settings-apply"  onClick={applySettings}>Apply</button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default GameGrid;
