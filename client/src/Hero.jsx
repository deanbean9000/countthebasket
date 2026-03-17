import './Hero.css';

function Hero({ league, onCreateRoster, onNewGame, onViewHistory, onViewStandings, onViewLeaderboard, onLeaveLeague }) {
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
        </div>
      </div>
    </div>
  );
}

export default Hero;
