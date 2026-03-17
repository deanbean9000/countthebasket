import Widget from './Widget';

/**
 * QuickEntryWidget — keyboard-driven stat entry prompt + input.
 */
function QuickEntryWidget({ prompt, inputRef, onKeyPress }) {
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
      </div>
    </Widget>
  );
}

export default QuickEntryWidget;
