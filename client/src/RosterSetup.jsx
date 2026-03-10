import { useState } from 'react';
import './RosterSetup.css';

function RosterSetup({ onBack }) {
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || window.location.origin.replace('-5173', '-3001');

  const addPlayer = () => {
    if (!playerName.trim() || !playerNumber) {
      alert('Please enter both a player name and number.');
      return;
    }
    const num = parseInt(playerNumber);
    if (players.some(p => p.number === num)) {
      alert('A player with that number already exists on this roster.');
      return;
    }
    setPlayers([...players, { name: playerName.trim(), number: num }]);
    setPlayerName('');
    setPlayerNumber('');
  };

  const removePlayer = (number) => {
    setPlayers(players.filter(p => p.number !== number));
  };

  const handlePlayerKeyDown = (e) => {
    if (e.key === 'Enter') addPlayer();
  };

  const saveRoster = async () => {
    if (!teamName.trim()) {
      alert('Please enter a team name.');
      return;
    }
    if (players.length === 0) {
      alert('Please add at least one player.');
      return;
    }

    try {
      setSaveStatus('saving');
      const rosterData = {
        name: teamName.trim(),
        homeTeamName: teamName.trim(),
        awayTeamName: teamName.trim(),
        players: players.map(p => ({ ...p, team: 'Home' })),
      };

      const response = await fetch(`${API_URL}/api/rosters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rosterData),
      });

      if (response.ok) {
        setSaveStatus('saved');
        setTeamName('');
        setPlayers([]);
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        const data = await response.json();
        alert(`Error saving: ${data.message || 'Unknown error'}`);
        setSaveStatus('');
      }
    } catch {
      alert('Connection refused!\n1. Go to the "Ports" tab in your terminal.\n2. Ensure port 3001 is set to PUBLIC.\n3. Ensure your backend terminal says "Server running".');
      setSaveStatus('');
    }
  };

  return (
    <div className="roster-setup">
      <div className="roster-setup-header">
        <button onClick={onBack} className="btn-back-roster">← Back</button>
        <h1>➕ Create New Roster</h1>
        <div />
      </div>

      <div className="create-team-container">
        <div className="create-team-form">
          <div className="form-group">
            <label>Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="e.g., Golden State Warriors"
            />
          </div>

          <div className="add-player-form">
            <h3>Add Player</h3>
            <div className="form-row-simple">
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={handlePlayerKeyDown}
                placeholder="Player Name"
              />
              <input
                type="number"
                value={playerNumber}
                onChange={e => setPlayerNumber(e.target.value)}
                onKeyDown={handlePlayerKeyDown}
                placeholder="#"
                min="0"
                max="99"
              />
              <button onClick={addPlayer} className="btn-add">Add</button>
            </div>
          </div>

          <div className="players-list-section">
            <h3>{teamName || 'Team'} Roster ({players.length})</h3>
            {players.length === 0 ? (
              <p className="no-players-yet">No players added yet.</p>
            ) : (
              <div className="players-list">
                {players
                  .slice()
                  .sort((a, b) => a.number - b.number)
                  .map(p => (
                    <div key={p.number} className="player-item">
                      <span>#{p.number} {p.name}</span>
                      <button onClick={() => removePlayer(p.number)}>×</button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="save-section">
            {saveStatus === 'saved' && (
              <p className="save-success">✅ Roster saved to team list!</p>
            )}
            <button
              onClick={saveRoster}
              className="btn-save-team"
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving...' : '💾 Save to Team List'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RosterSetup;
