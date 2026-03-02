import { useState, useEffect } from 'react';
import './RosterSetup.css';

function RosterSetup({ onStartGame }) {
  const [rosterName, setRosterName] = useState('');
  const [homeTeamName, setHomeTeamName] = useState('Home');
  const [awayTeamName, setAwayTeamName] = useState('Away');
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [savedRosters, setSavedRosters] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('Home');

  useEffect(() => {
    fetchSavedRosters();
  }, []);

  const fetchSavedRosters = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/rosters');
      const data = await response.json();
      setSavedRosters(data);
    } catch (error) {
      console.error('Error fetching rosters:', error);
    }
  };

  const addPlayer = () => {
    if (!playerName || !playerNumber) {
      alert('Please enter both name and number');
      return;
    }

    const newPlayer = {
      name: playerName,
      number: parseInt(playerNumber),
      team: selectedTeam
    };

    if (selectedTeam === 'Home') {
      if (homePlayers.some(p => p.number === newPlayer.number)) {
        alert('Number already exists on Home team!');
        return;
      }
      setHomePlayers([...homePlayers, newPlayer]);
    } else {
      if (awayPlayers.some(p => p.number === newPlayer.number)) {
        alert('Number already exists on Away team!');
        return;
      }
      setAwayPlayers([...awayPlayers, newPlayer]);
    }

    setPlayerName('');
    setPlayerNumber('');
  };

  const removePlayer = (team, number) => {
    if (team === 'Home') {
      setHomePlayers(homePlayers.filter(p => p.number !== number));
    } else {
      setAwayPlayers(awayPlayers.filter(p => p.number !== number));
    }
  };

  const saveRoster = async () => {
    if (!rosterName) {
      alert('Please enter a roster name');
      return;
    }

    if (homePlayers.length === 0 && awayPlayers.length === 0) {
      alert('Please add at least one player');
      return;
    }

    try {
      const rosterData = {
        name: rosterName,
        homeTeamName,
        awayTeamName,
        players: [...homePlayers, ...awayPlayers]
      };
      console.log('Saving roster:', rosterData);

      const response = await fetch('http://localhost:3001/api/rosters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rosterData)
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (response.ok) {
        alert('Roster saved successfully!');
        fetchSavedRosters();
      } else {
        alert(`Error saving roster: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving roster:', error);
      alert(`Error saving roster: ${error.message}. Make sure the server is running!`);
    }
  };

  const loadRoster = async (rosterId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/rosters/${rosterId}`);
      const roster = await response.json();
      
      setRosterName(roster.name);
      setHomeTeamName(roster.homeTeamName);
      setAwayTeamName(roster.awayTeamName);
      setHomePlayers(roster.players.filter(p => p.team === 'Home'));
      setAwayPlayers(roster.players.filter(p => p.team === 'Away'));
    } catch (error) {
      console.error('Error loading roster:', error);
    }
  };

  const deleteRoster = async (rosterId) => {
    if (!confirm('Are you sure you want to delete this roster?')) return;

    try {
      await fetch(`http://localhost:3001/api/rosters/${rosterId}`, {
        method: 'DELETE'
      });
      fetchSavedRosters();
    } catch (error) {
      console.error('Error deleting roster:', error);
    }
  };

  const startGame = async () => {
    if (homePlayers.length === 0 || awayPlayers.length === 0) {
      alert('Both teams need at least one player!');
      return;
    }

    try {
      // Load players into the game
      const allPlayers = [...homePlayers, ...awayPlayers].map(p => ({
        ...p,
        points: 0,
        rebounds: 0,
        offensiveRebounds: 0,
        defensiveRebounds: 0
      }));

      const response = await fetch('http://localhost:3001/api/players/load-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: allPlayers })
      });

      if (response.ok) {
        onStartGame();
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Error starting game');
    }
  };

  return (
    <div className="roster-setup">
      <h1>🏀 Roster Setup</h1>

      <div className="setup-container">
        {/* Left: Add Players */}
        <div className="setup-section">
          <h2>Create Roster</h2>
          
          <div className="form-group">
            <label>Roster Name:</label>
            <input
              type="text"
              value={rosterName}
              onChange={(e) => setRosterName(e.target.value)}
              placeholder="e.g., Warriors vs Lakers"
            />
          </div>

          <div className="team-names">
            <div className="form-group">
              <label>Home Team:</label>
              <input
                type="text"
                value={homeTeamName}
                onChange={(e) => setHomeTeamName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Away Team:</label>
              <input
                type="text"
                value={awayTeamName}
                onChange={(e) => setAwayTeamName(e.target.value)}
              />
            </div>
          </div>

          <div className="add-player-form">
            <h3>Add Player</h3>
            <div className="form-row">
              <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                <option value="Home">{homeTeamName}</option>
                <option value="Away">{awayTeamName}</option>
              </select>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Player Name"
              />
              <input
                type="number"
                value={playerNumber}
                onChange={(e) => setPlayerNumber(e.target.value)}
                placeholder="#"
                min="0"
                max="99"
              />
              <button onClick={addPlayer} className="btn-add">Add</button>
            </div>
          </div>

          {/* Display Current Roster */}
          <div className="current-roster">
            <div className="team-roster">
              <h3>{homeTeamName} ({homePlayers.length})</h3>
              {homePlayers.sort((a, b) => a.number - b.number).map(player => (
                <div key={player.number} className="player-item">
                  <span>#{player.number} {player.name}</span>
                  <button onClick={() => removePlayer('Home', player.number)}>×</button>
                </div>
              ))}
            </div>
            <div className="team-roster">
              <h3>{awayTeamName} ({awayPlayers.length})</h3>
              {awayPlayers.sort((a, b) => a.number - b.number).map(player => (
                <div key={player.number} className="player-item">
                  <span>#{player.number} {player.name}</span>
                  <button onClick={() => removePlayer('Away', player.number)}>×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={saveRoster} className="btn-save">Save Roster</button>
            <button onClick={startGame} className="btn-start">Start Game</button>
          </div>
        </div>

        {/* Right: Saved Rosters */}
        <div className="setup-section">
          <h2>Saved Rosters</h2>
          <div className="saved-rosters-list">
            {savedRosters.length === 0 ? (
              <p className="empty-message">No saved rosters yet</p>
            ) : (
              savedRosters.map(roster => (
                <div key={roster._id} className="saved-roster-item">
                  <div className="roster-info">
                    <h4>{roster.name}</h4>
                    <p>{roster.players.length} players</p>
                  </div>
                  <div className="roster-actions">
                    <button onClick={() => loadRoster(roster._id)} className="btn-load">Load</button>
                    <button onClick={() => deleteRoster(roster._id)} className="btn-delete">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RosterSetup;
