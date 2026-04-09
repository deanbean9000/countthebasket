import { useState, useRef } from 'react';
import './GameGrid.css';
import ScoreboardWidget from './ScoreboardWidget';
import QuickEntryWidget from './QuickEntryWidget';
import RosterWidget from './RosterWidget';
import PlayerCardsWidget from './PlayerCardsWidget';
import {
  THEMES, WIDGET_META, SLOTS,
  DEFAULT_LAYOUT, DEFAULT_VISIBLE, DEFAULT_THEME, DEFAULT_CUSTOM,
  buildCustomVars,
} from './gameSettings';

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
  enabledStats = { assists: false, steals: false, blocks: false },
  onEnabledStatsChange,
  layout,
  visible,
  theme,
  custom,
  onLayoutChange,
  onVisibleChange,
  onThemeChange,
  onCustomChange,
  currentPeriod,
  totalPeriods,
  periodType,
  onEndPeriod,

}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Draft copies — only committed to real state on Apply
  const [draftLayout,  setDraftLayout]  = useState(DEFAULT_LAYOUT);
  const [draftVisible, setDraftVisible] = useState(DEFAULT_VISIBLE);
  const [draftTheme,   setDraftTheme]   = useState(DEFAULT_THEME);
  const [draftCustom,  setDraftCustom]  = useState(DEFAULT_CUSTOM);
  const [draftEnabledStats, setDraftEnabledStats] = useState({ assists: false, steals: false, blocks: false });

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
    onLayoutChange(prev => {
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
    setDraftEnabledStats({ ...enabledStats });
    setSettingsOpen(true);
  };
  const applySettings = () => {
    onLayoutChange({ ...draftLayout });
    onVisibleChange({ ...draftVisible });
    onThemeChange(draftTheme);
    onCustomChange({ ...draftCustom });
    onEnabledStatsChange?.({ ...draftEnabledStats });
    setSettingsOpen(false);
  };
  const resetToDefaults = () => {
    setDraftLayout({ ...DEFAULT_LAYOUT });
    setDraftVisible({ ...DEFAULT_VISIBLE });
    setDraftTheme(DEFAULT_THEME);
    setDraftCustom({ ...DEFAULT_CUSTOM });
    setDraftEnabledStats({ assists: false, steals: false, blocks: false });
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
        return <ScoreboardWidget
          homeTeamName={homeTeamName} awayTeamName={awayTeamName}
          homeStats={homeStats} awayStats={awayStats}
          onEndGame={onEndGame}
          currentPeriod={currentPeriod}
          totalPeriods={totalPeriods}
          periodType={periodType}
          onEndPeriod={onEndPeriod}
        />;
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

            {/* Stat Tracking */}
            <div className="settings-section">
              <h3 className="settings-section-title">Stat Tracking</h3>
              <p className="settings-hint" style={{ marginTop: 0 }}>Enable extra stats for the Quick Entry widget.</p>
              <div className="settings-visibility-grid">
                {[
                  { key: 'assists', label: '🤝 Assists [A]' },
                  { key: 'steals',  label: '🫳 Steals [S]'  },
                  { key: 'blocks',  label: '✋ Blocks [B]'  },
                ].map(({ key, label }) => (
                  <label key={key} className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={!!draftEnabledStats[key]}
                      onChange={() => setDraftEnabledStats(prev => ({ ...prev, [key]: !prev[key] }))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
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
