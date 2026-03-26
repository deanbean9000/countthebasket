import Widget from './Widget';

/**
 * QuickEntryWidget — keyboard-driven stat entry + undo history.
 */
function QuickEntryWidget({ prompt, inputRef, onKeyPress, actionHistory = [], onUndo }) {
  return (
    <Widget id="quick-entry" title="Quick Entry">
      <div className="quick-entry-content">
        <div className="prompt">{prompt}</div>
        <input
          ref={inputRef}
          type="text"
          className="stat-input"
          onKeyDown={onKeyPress}
          placeholder="Type here..."
          autoFocus
        />
        <div className="hint">Press ESC to cancel</div>

        {/* ── Undo panel ──────────────────────────────────────────── */}
        {actionHistory.length > 0 && (
          <div className="undo-panel">
            <div className="undo-history">
              {[...actionHistory].reverse().slice(0, 5).map((entry, i) => (
                <span
                  key={i}
                  className={`undo-entry${i === 0 ? ' undo-entry--last' : ''}`}
                >
                  {entry.label}
                </span>
              ))}
            </div>
            <button
              className="btn-undo"
              onClick={onUndo}
              title={`Undo: ${actionHistory[actionHistory.length - 1]?.label}`}
            >
              ↩ Undo last
            </button>
          </div>
        )}
      </div>
    </Widget>
  );
}

export default QuickEntryWidget;
