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
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Draft copies — only committed to real state on Apply
  const [draftLayout,  setDraftLayout]  = useState(DEFAULT_LAYOUT);
  const [draftVisible, setDraftVisible] = useState(DEFAULT_VISIBLE);

  // Persist layout + visibility to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout, visible }));
  }, [layout, visible]);

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
    setSettingsOpen(true);
  };
  const applySettings = () => {
    setLayout({ ...draftLayout });
    setVisible({ ...draftVisible });
    setSettingsOpen(false);
  };
  const resetToDefaults = () => {
    setDraftLayout({ ...DEFAULT_LAYOUT });
    setDraftVisible({ ...DEFAULT_VISIBLE });
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
