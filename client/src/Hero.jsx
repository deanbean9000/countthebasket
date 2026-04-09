import { useState, useRef } from 'react';
import './Hero.css';
import './GameGrid.css';
import {
  THEMES, WIDGET_META, SLOTS,
  DEFAULT_LAYOUT, DEFAULT_VISIBLE, DEFAULT_THEME, DEFAULT_CUSTOM, EXTRA_STATS,
} from './gameSettings';

function Hero({
  league, onCreateRoster, onNewGame, onViewHistory, onViewStandings,
  onViewLeaderboard, onLeaveLeague,
  enabledStats = {}, onEnabledStatsChange,
  layout, visible, theme, custom,
  onLayoutChange, onVisibleChange, onThemeChange, onCustomChange,
}) {
  const [open, setOpen] = useState(false);

  const [draftLayout,      setDraftLayout]      = useState(DEFAULT_LAYOUT);
  const [draftVisible,     setDraftVisible]     = useState(DEFAULT_VISIBLE);
  const [draftTheme,       setDraftTheme]       = useState(DEFAULT_THEME);
  const [draftCustom,      setDraftCustom]      = useState(DEFAULT_CUSTOM);
  const [draftEnabledStats, setDraftEnabledStats] = useState({ assists: false, steals: false, blocks: false });

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

  const openCustomize = () => {
    setDraftLayout({ ...(layout ?? DEFAULT_LAYOUT) });
    setDraftVisible({ ...(visible ?? DEFAULT_VISIBLE) });
    setDraftTheme(theme ?? DEFAULT_THEME);
    setDraftCustom({ ...(custom ?? DEFAULT_CUSTOM) });
    setDraftEnabledStats({ ...enabledStats });
    setOpen(true);
  };

  const applyCustomize = () => {
    onLayoutChange?.({ ...draftLayout });
    onVisibleChange?.({ ...draftVisible });
    onThemeChange?.(draftTheme);
    onCustomChange?.({ ...draftCustom });
    onEnabledStatsChange?.({ ...draftEnabledStats });
    setOpen(false);
  };

  const resetToDefaults = () => {
    setDraftLayout({ ...DEFAULT_LAYOUT });
    setDraftVisible({ ...DEFAULT_VISIBLE });
    setDraftTheme(DEFAULT_THEME);
    setDraftCustom({ ...DEFAULT_CUSTOM });
    setDraftEnabledStats({ assists: false, steals: false, blocks: false });
  };

  return (
    <div className="hero">
      <div className="hero-content">
        <h1 className="hero-title">Count The Basket</h1>
        {league && (
          <div className="hero-league-badge">
            <span className="hero-league-name">🏆 {league.name}</span>
            <button className="btn-leave-league" onClick={onLeaveLeague}>Leave League</button>
          </div>
        )}
        <p className="hero-subtitle">Basketball Stats Tracker</p>

        <div className="hero-buttons">
          <button className="hero-btn hero-btn-primary" onClick={onCreateRoster}>
            ➕ Create New Roster
          </button>
          <button className="hero-btn hero-btn-success" onClick={onNewGame}>
            🏀 New Game
          </button>
          {league && (
            <button className="hero-btn hero-btn-history" onClick={onViewHistory}>
              📋 Past Games
            </button>
          )}
          {league && (
            <button className="hero-btn hero-btn-standings" onClick={onViewStandings}>
              🏆 Standings
            </button>
          )}
          {league && (
            <button className="hero-btn hero-btn-leaderboard" onClick={onViewLeaderboard}>
              📈 Leaderboard
            </button>
          )}
          <button className="hero-btn hero-btn-customize" onClick={openCustomize}>
            ⚙ Customize
          </button>
        </div>
      </div>

      {/* ── Full settings modal ──────────────────────────────────────── */}
      {open && (
        <div className="settings-overlay" onClick={() => setOpen(false)}>
          <div className="settings-panel" onClick={e => e.stopPropagation()}>

            <div className="settings-header">
              <h2 className="settings-title">⚙ Customize</h2>
              <button className="settings-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>

            {/* Show / Hide */}
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

            {/* Arrange */}
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
                {EXTRA_STATS.map(({ key, label }) => (
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
                <button
                  className={`settings-theme-btn${draftTheme === 'custom' ? ' settings-theme-btn--active' : ''}`}
                  onClick={() => setDraftTheme('custom')}
                >
                  <span className="settings-theme-swatch settings-theme-swatch--rainbow" />
                  <span>Custom</span>
                </button>
              </div>

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
                <button className="btn-settings-cancel" onClick={() => setOpen(false)}>Cancel</button>
                <button className="btn-settings-apply"  onClick={applyCustomize}>Apply</button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Hero;
