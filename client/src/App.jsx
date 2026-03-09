import { useState, useEffect, useRef } from 'react';
import './App.css';
import RosterSetup from './RosterSetup';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [homeTeamName, setHomeTeamName] = useState('Home');
  const [awayTeamName, setAwayTeamName] = useState('Away');
  const [step, setStep] = useState('number'); 
  const [playerNumber, setPlayerNumber] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [prompt, setPrompt] = useState('Enter player number:');
  const inputRef = useRef(null);

  // --- CODESPACES CONNECTION FIX ---
  // This detects your current URL and forces it to point to the backend port 3001
 const API_URL = import.meta.env.VITE_API_URL || window.location.origin.replace('-5173', '-3001');

  useEffect(() => {
    if (gameStarted) {
      fetchPlayers();
    }
  }, [gameStarted]);

  useEffect(() => {
    // Auto-focus input on every step change
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/players`);
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const resetFlow = () => {
    setStep('number');
    setPlayerNumber('');
    setSelectedPlayer(null);
    setPrompt('Enter player number:');
  };

  const handleKeyPress = async (e) => {
    const input = e.target.value.trim().toLowerCase();

    if (e.key === 'Enter') {
      if (step === 'number') {
        // Find player by number
        const player = players.find(p => p.number === parseInt(input));
        if (player) {
          setSelectedPlayer(player);
          setPlayerNumber(input);
          setPrompt(`${player.name} (#${player.number}) - [P]oints or [R]ebounds?`);
          setStep('action');
          e.target.value = '';
        } else {
          alert('Player not found! Try again.');
          e.target.value = '';
        }
      } else if (step === 'action') {
        if (input === 'p') {
          setPrompt(`${selectedPlayer.name} - Enter points: [1], [2], or [3]`);
          setStep('points');
          e.target.value = '';
        } else if (input === 'r') {
          setPrompt(`${selectedPlayer.name} - [O]ffensive or [D]efensive rebound?`);
          setStep('rebounds');
          e.target.value = '';
        } else {
          alert('Press P for Points or R for Rebounds');
          e.target.value = '';
        }
      } else if (step === 'points') {
        const points = parseInt(input);
        if ([1, 2, 3].includes(points)) {
          await addPoints(selectedPlayer._id, points);
          e.target.value = '';
          resetFlow();
        } else {
          alert('Enter 1, 2, or 3 points');
          e.target.value = '';
        }
      } else if (step === 'rebounds') {
        if (input === 'o') {
          await addRebound(selectedPlayer._id, 'offensive');
          e.target.value = '';
          resetFlow();
        } else if (input === 'd') {
          await addRebound(selectedPlayer._id, 'defensive');
          e.target.value = '';
          resetFlow();
        } else {
          alert('Press O for Offensive or D for Defensive');
          e.target.value = '';
        }
      }
    }

    // ESC to cancel/reset
    if (e.key === 'Escape') {
      e.target.value = '';
      resetFlow();
    }
  };

  const addPoints = async (playerId, pointsToAdd) => {
    try {
      await fetch(`${API_URL}/api/players/${playerId}/score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsToAdd })
      });
      await fetchPlayers();
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const addRebound = async (playerId, type) => {
    try {
      await fetch(`${API_URL}/api/players/${playerId}/rebound`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      await fetchPlayers();
    } catch (error) {
      console.error('Error adding rebound:', error);
    }
  };

  const getTeamStats = (team) => {
    const teamPlayers = players.filter(p => p.team === team);
    return {
      points: teamPlayers.reduce((sum, p) => sum + p.points, 0),
      rebounds: teamPlayers.reduce((sum, p) => sum + p.rebounds, 0),
      offensive: teamPlayers.reduce((sum, p) => sum + (p.offensiveRebounds || 0), 0),
      defensive: teamPlayers.reduce((sum, p) => sum + (p.defensiveRebounds || 0), 0)
    };
  };

  const homeStats = getTeamStats('Home');
  const awayStats = getTeamStats('Away');

  const endGame = () => {
    setGameStarted(false);
    setPlayers([]);
    setHomeTeamName('Home');
    setAwayTeamName('Away');
    resetFlow();
  };

  const handleStartGame = (config = {}) => {
    setHomeTeamName(config.homeTeamName || 'Home');
    setAwayTeamName(config.awayTeamName || 'Away');
    setGameStarted(true);
  };

  // Show roster setup screen if game hasn't started
  if (!gameStarted) {
    return <RosterSetup onStartGame={handleStartGame} />;
  }

  return (
    <div className="app">
      <header className="scoreboard-header">
        <div className="team-score">
          <h2>{homeTeamName}</h2>
          <div className="score">{homeStats.points}</div>
        </div>
        <div className="game-title">
          <h1>🏀 Count The Basket</h1>
          <button onClick={endGame} className="btn-end-game">End Game</button>
        </div>
        <div className="team-score">
          <h2>{awayTeamName}</h2>
          <div className="score">{awayStats.points}</div>
        </div>
      </header>

      <div className="main-layout">
        <aside className="roster-sidebar">
          <div className="roster-section">
            <h3 className="roster-title">{homeTeamName} Roster</h3>
            <div className="roster-list">
              {players
                .filter(p => p.team === 'Home')
                .map(player => (
                  <div key={player._id} className="roster-item">
                    <span className="roster-number">#{player.number}</span>
                    <span className="roster-name">{player.name}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="roster-section">
            <h3 className="roster-title">{awayTeamName} Roster</h3>
            <div className="roster-list">
              {players
                .filter(p => p.team === 'Away')
                .map(player => (
                  <div key={player._id} className="roster-item">
                    <span className="roster-number">#{player.number}</span>
                    <span className="roster-name">{player.name}</span>
                  </div>
                ))}
            </div>
          </div>
        </aside>

        <div className="main-content">
          <div className="quick-entry">
            <div className="prompt">{prompt}</div>
            <input
              ref={inputRef}
              type="text"
              className="stat-input"
              onKeyDown={handleKeyPress}
              placeholder="Type here..."
              autoFocus
            />
            <div className="hint">Press ESC to cancel</div>
          </div>

          <div className="teams-container">
            <div className="team-column">
              <h2 className="team-header">
                {homeTeamName}
                <span className="team-stats">
                  {homeStats.points} pts | {homeStats.rebounds} reb ({homeStats.offensive}O/{homeStats.defensive}D)
                </span>
              </h2>
              {players
                .filter(p => p.team === 'Home')
                .map(player => (
                  <div key={player._id} className="player-card">
                    <div className="player-info">
                      <span className="player-number">#{player.number}</span>
                      <span className="player-name">{player.name}</span>
                    </div>
                    <div className="player-stats">
                      <span className="stat-badge points">{player.points} PTS</span>
                      <span className="stat-badge rebounds">
                        {player.rebounds} REB ({player.offensiveRebounds || 0}O/{player.defensiveRebounds || 0}D)
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="team-column">
              <h2 className="team-header">
                {awayTeamName}
                <span className="team-stats">
                  {awayStats.points} pts | {awayStats.rebounds} reb ({awayStats.offensive}O/{awayStats.defensive}D)
                </span>
              </h2>
              {players
                .filter(p => p.team === 'Away')
                .map(player => (
                  <div key={player._id} className="player-card">
                    <div className="player-info">
                      <span className="player-number">#{player.number}</span>
                      <span className="player-name">{player.name}</span>
                    </div>
                    <div className="player-stats">
                      <span className="stat-badge points">{player.points} PTS</span>
                      <span className="stat-badge rebounds">
                        {player.rebounds} REB ({player.offensiveRebounds || 0}O/{player.defensiveRebounds || 0}D)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;