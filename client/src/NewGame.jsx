import { useState, useEffect } from 'react';
import './NewGame.css';

function NewGame({ leagueId, onStartGame, onBack }) {
  const [rosters, setRosters] = useState([]);
  const [homeRoster, setHomeRoster] = useState(null);
  const [guestRoster, setGuestRoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || window.location.origin.replace('-5173', '-3001');

  useEffect(() => {
    fetchRosters();
  }, []);

  const fetchRosters = async () => {
    try {
      setError('');
      const res = await fetch(`${API_URL}/api/rosters?leagueId=${leagueId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRosters(data);
    } catch {
      setError('Could not load rosters. Make sure the backend is running on port 3001.');
    }
  };

  const startGame = async () => {
    if (!homeRoster || !guestRoster) {
      alert('Please select both a Home team and a Guest team.');
      return;
    }
    if (homeRoster._id === guestRoster._id) {
      alert('Home and Guest teams must be different rosters.');
      return;
    }
    setLoading(true);
    try {
      // Use all players from homeRoster labeled as 'Home'
      const homePlayers = homeRoster.players.map(p => ({
        name: p.name,
        number: p.number,
        team: 'Home',
        points: 0,
        rebounds: 0,
        offensiveRebounds: 0,
        defensiveRebounds: 0,
      }));

      // Use all players from guestRoster labeled as 'Away'
      const guestPlayers = guestRoster.players.map(p => ({
        name: p.name,
        number: p.number,
        team: 'Away',
        points: 0,
        rebounds: 0,
        offensiveRebounds: 0,
        defensiveRebounds: 0,
      }));

      const response = await fetch(`${API_URL}/api/players/load-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: [...homePlayers, ...guestPlayers] }),
      });

      if (response.ok) {
        onStartGame({
          homeTeamName: homeRoster.homeTeamName || homeRoster.name,
          awayTeamName: guestRoster.homeTeamName || guestRoster.name,
        });
      } else {
        alert('Failed to load roster data. Please try again.');
      }
    } catch {
      alert('Server connection failed. Check your Backend terminal.');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (roster) => roster.homeTeamName || roster.name;

  return (
    <div className="new-game">
      <div className="new-game-header">
        <button onClick={onBack} className="btn-back">← Back</button>
        <h1>🏀 New Game</h1>
        <div />
      </div>

      <div className="new-game-body">
        <div className="team-selection-row">
          <div className="team-slot home-slot">
            <h2 className="slot-label home-label">🏠 Home Team</h2>
            {homeRoster ? (
              <div className="selected-team">
                <div className="selected-team-name">{getDisplayName(homeRoster)}</div>
                <div className="selected-team-count">{homeRoster.players.length} players</div>
                <button className="btn-clear" onClick={() => setHomeRoster(null)}>Change</button>
              </div>
            ) : (
              <div className="empty-slot">Select from list below</div>
            )}
          </div>

          <div className="vs-divider">VS</div>

          <div className="team-slot guest-slot">
            <h2 className="slot-label guest-label">✈️ Guest Team</h2>
            {guestRoster ? (
              <div className="selected-team">
                <div className="selected-team-name">{getDisplayName(guestRoster)}</div>
                <div className="selected-team-count">{guestRoster.players.length} players</div>
                <button className="btn-clear" onClick={() => setGuestRoster(null)}>Change</button>
              </div>
            ) : (
              <div className="empty-slot">Select from list below</div>
            )}
          </div>
        </div>

        {homeRoster && guestRoster && (
          <div className="start-row">
            <button
              className="btn-start-game"
              onClick={startGame}
              disabled={loading}
            >
              {loading ? 'Starting...' : '▶ Start Game'}
            </button>
          </div>
        )}

        <div className="roster-list-section">
          <div className="roster-list-header">
            <h3>Saved Rosters</h3>
            <button onClick={fetchRosters} className="btn-refresh">Refresh</button>
          </div>
          {error && <p className="error-msg">{error}</p>}
          {rosters.length === 0 && !error && (
            <p className="no-rosters">No saved rosters yet. Create one first!</p>
          )}
          <div className="roster-cards">
            {rosters.map(r => (
              <div
                key={r._id}
                className={`roster-card ${homeRoster?._id === r._id ? 'selected-home' : ''} ${guestRoster?._id === r._id ? 'selected-guest' : ''}`}
              >
                <div className="roster-card-info">
                  <h4>{getDisplayName(r)}</h4>
                  <p>{r.players.length} players</p>
                </div>
                <div className="roster-card-actions">
                  <button
                    className={`btn-set-home ${homeRoster?._id === r._id ? 'active' : ''}`}
                    onClick={() => setHomeRoster(r)}
                    disabled={guestRoster?._id === r._id}
                  >
                    Set Home
                  </button>
                  <button
                    className={`btn-set-guest ${guestRoster?._id === r._id ? 'active' : ''}`}
                    onClick={() => setGuestRoster(r)}
                    disabled={homeRoster?._id === r._id}
                  >
                    Set Guest
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewGame;
