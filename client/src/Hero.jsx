import './Hero.css';

function Hero({ onCreateRoster, onNewGame }) {
  return (
    <div className="hero">
      <div className="hero-content">
        <span className="hero-logo">🏀</span>
        <h1 className="hero-title">Count The Basket</h1>
        <p className="hero-subtitle">Basketball Stats Tracker</p>
        <div className="hero-buttons">
          <button className="hero-btn hero-btn-primary" onClick={onCreateRoster}>
            ➕ Create New Roster
          </button>
          <button className="hero-btn hero-btn-success" onClick={onNewGame}>
            🏀 New Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default Hero;
