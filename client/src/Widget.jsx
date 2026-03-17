import './Widget.css';

/**
 * Generic Widget shell.
 * Renders a titled card container for any feature panel.
 * @param {string}  id       - Unique widget identifier (used for data attr)
 * @param {string}  title    - Label shown in the widget header strip
 * @param {node}    children - Widget body content
 * @param {string}  className - Optional extra class on the outer element
 */
function Widget({ id, title, children, className = '' }) {
  return (
    <div className={`widget ${className}`} data-widget-id={id}>
      {title && (
        <div className="widget-header">
          <span className="widget-title">{title}</span>
        </div>
      )}
      <div className="widget-body">{children}</div>
    </div>
  );
}

export default Widget;
