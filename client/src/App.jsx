import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import './App.css';
import {
  THEMES, DEFAULT_LAYOUT, DEFAULT_VISIBLE, DEFAULT_THEME, DEFAULT_CUSTOM,
  buildCustomVars, STORAGE_KEY, loadSaved,
} from './gameSettings';
import Auth from './Auth';
import LeagueGate from './LeagueGate';
import Hero from './Hero';
import RosterSetup from './RosterSetup';
import NewGame from './NewGame';
import GameHistory from './GameHistory';
import Standing from './Standing';
import GameGrid from './GameGrid';
import Leaderboard from './Leaderboard';

function App() {
  // view: 'leagueGate' | 'hero' | 'createRoster' | 'newGame' | 'game'
  const [view, setView] = useState('leagueGate');
  const [league, setLeague] = useState(null); // { _id, name }
  const [players, setPlayers] = useState([]);
  const [summaryPlayers, setSummaryPlayers] = useState([]);
  const [homeTeamName, setHomeTeamName] = useState('Home');
  const [awayTeamName, setAwayTeamName] = useState('Away');
  const [step, setStep] = useState('number');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [foulTeam, setFoulTeam] = useState(null);
  const [prompt, setPrompt] = useState('Enter number + team (e.g. 5h or 12g) or [F]oul:');
  const [actionHistory, setActionHistory] = useState([]); // stack of undoable actions
  const [foulWarning, setFoulWarning] = useState(null); // { playerName, foulCount }
  const [enabledStats, setEnabledStats] = useState(() => {
    try {
      const s = localStorage.getItem('ctb_enabled_stats');
      return s ? JSON.parse(s) : { assists: false, steals: false, blocks: false };
    } catch { return { assists: false, steals: false, blocks: false }; }
  });

  // ── Period tracking ───────────────────────────────────────────────────────
  const [periodType, setPeriodType] = useState('none'); // 'quarters' | 'halves' | 'none'
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [totalPeriods, setTotalPeriods] = useState(0);
  const [periodSnapshots, setPeriodSnapshots] = useState([]);
  const [periodStartStats, setPeriodStartStats] = useState(null);
  const [periodBreakData, setPeriodBreakData] = useState(null); // { snapshot, nextPeriod }
  const [summaryPeriods, setSummaryPeriods] = useState([]);

  // ── Lifted game settings (shared with GameGrid + Hero) ────────────────────
  const [layout,  setLayout]  = useState(() => loadSaved()?.layout  ?? DEFAULT_LAYOUT);
  const [visible, setVisible] = useState(() => loadSaved()?.visible ?? DEFAULT_VISIBLE);
  const [theme,   setTheme]   = useState(() => loadSaved()?.theme   ?? DEFAULT_THEME);
  const [custom,  setCustom]  = useState(() => loadSaved()?.custom  ?? DEFAULT_CUSTOM);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const inputRef = useRef(null);
  const submitting = useRef(false);

  const pushHistory = (entry) =>
    setActionHistory(prev => [...prev.slice(-19), entry]); // keep last 20

  useEffect(() => {
    localStorage.setItem('ctb_enabled_stats', JSON.stringify(enabledStats));
  }, [enabledStats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout, visible, theme, custom }));
  }, [layout, visible, theme, custom]);

  useEffect(() => {
    const vars = theme === 'custom'
      ? buildCustomVars(custom)
      : (THEMES[theme]?.vars ?? THEMES[DEFAULT_THEME].vars);
    const root = document.documentElement;
    Object.entries(vars).forEach(([prop, val]) => root.style.setProperty(prop, val));
  }, [theme, custom]);

  // Build the action-step prompt based on which extra stats are on
  const buildActionPrompt = (player, teamLabel) => {
    const extras = [
      enabledStats.assists && '[A]ssist',
      enabledStats.steals  && '[S]teal',
      enabledStats.blocks  && '[B]lock',
    ].filter(Boolean);
    const base = `${player.name} (#${player.number} ${teamLabel}) — [P]oints, [R]ebounds, [F]oul`;
    return extras.length ? `${base}, ${extras.join(', ')}?` : `${base}?`;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- CODESPACES CONNECTION FIX ---
  // This detects your current URL and forces it to point to the backend port 3001
  const API_URL = import.meta.env.VITE_API_URL || window.location.origin.replace('-5173', '-3001');

  useEffect(() => {
    if (view === 'game') {
      fetchPlayers();
    }
  }, [view]);

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
    setSelectedPlayer(null);
    setFoulTeam(null);
    setPrompt('Enter number + team (e.g. 5h or 12g) or [F]oul:');
  };

  const handlePlayerSelect = (player) => {
    if (submitting.current) return;
    const teamLabel = player.team === 'Home' ? homeTeamName : awayTeamName;
    setSelectedPlayer(player);
    setStep('action');
    setPrompt(buildActionPrompt(player, teamLabel));
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  const handleKeyPress = async (e) => {
    if (submitting.current) return;
    const input = e.target.value.trim().toLowerCase();

    if (e.key === 'Enter') {
      if (step === 'number') {
        // Start foul flow
        if (input === 'f') {
          setPrompt('Foul — [H]ome or [G]uest?');
          setStep('foulTeam');
          e.target.value = '';
          return;
        }
        // Parse format: number + team suffix (h or g), e.g. "5h" or "12g"
        const match = input.match(/^(\d+)([hg])$/);
        if (!match) {
          alert('Format: number + h or g\nExamples: 5h (home), 12g (guest)\nOr type f for a foul');
          e.target.value = '';
        } else {
          const num = parseInt(match[1]);
          const teamSuffix = match[2];
          const team = teamSuffix === 'h' ? 'Home' : 'Away';
          const player = players.find(p => p.number === num && p.team === team);
          if (player) {
            setSelectedPlayer(player);
            setPrompt(buildActionPrompt(player, team === 'Home' ? homeTeamName : awayTeamName));
            setStep('action');
            e.target.value = '';
          } else {
            alert(`No #${num} found on ${team === 'Home' ? homeTeamName : awayTeamName}. Try again.`);
            e.target.value = '';
          }
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
        } else if (input === 'f') {
          submitting.current = true;
          await addFoul(selectedPlayer._id, selectedPlayer.name);
          e.target.value = '';
          resetFlow();
          submitting.current = false;
        } else if (input === 'a' && enabledStats.assists) {
          submitting.current = true;
          await addQuickStat(selectedPlayer._id, 'assist', selectedPlayer.name, 'ast');
          e.target.value = '';
          resetFlow();
          submitting.current = false;
        } else if (input === 's' && enabledStats.steals) {
          submitting.current = true;
          await addQuickStat(selectedPlayer._id, 'steal', selectedPlayer.name, 'stl');
          e.target.value = '';
          resetFlow();
          submitting.current = false;
        } else if (input === 'b' && enabledStats.blocks) {
          submitting.current = true;
          await addQuickStat(selectedPlayer._id, 'block', selectedPlayer.name, 'blk');
          e.target.value = '';
          resetFlow();
          submitting.current = false;
        } else {
          const extras = [
            enabledStats.assists && 'A=Assist',
            enabledStats.steals  && 'S=Steal',
            enabledStats.blocks  && 'B=Block',
          ].filter(Boolean);
          alert(`Press P=Points, R=Rebounds, F=Foul${extras.length ? ', ' + extras.join(', ') : ''}`);
          e.target.value = '';
        }
      } else if (step === 'points') {
        const points = parseInt(input);
        if ([1, 2, 3].includes(points)) {
          submitting.current = true;
          await addPoints(selectedPlayer._id, points, selectedPlayer.name);
          e.target.value = '';
          resetFlow();
          submitting.current = false;
        } else {
          alert('Enter 1, 2, or 3 points');
          e.target.value = '';
        }
      } else if (step === 'rebounds') {
        if (input === 'o') {
          submitting.current = true;
          await addRebound(selectedPlayer._id, 'offensive', selectedPlayer.name);
          e.target.value = '';
          resetFlow();
          submitting.current = false;
        } else if (input === 'd') {
          submitting.current = true;
          await addRebound(selectedPlayer._id, 'defensive', selectedPlayer.name);
          e.target.value = '';
          resetFlow();
          submitting.current = false;
        } else {
          alert('Press O for Offensive or D for Defensive');
          e.target.value = '';
        }
      } else if (step === 'foulTeam') {
        if (input === 'h' || input === 'g') {
          const team = input === 'h' ? 'Home' : 'Away';
          const teamLabel = input === 'h' ? homeTeamName : awayTeamName;
          setFoulTeam(team);
          setPrompt(`Foul — ${teamLabel} player number:`);
          setStep('foulNumber');
          e.target.value = '';
        } else {
          alert('Press H for Home or G for Guest');
          e.target.value = '';
        }
      } else if (step === 'foulNumber') {
        const num = parseInt(input);
        if (isNaN(num)) {
          alert('Enter a valid player number');
          e.target.value = '';
        } else {
          const player = players.find(p => p.number === num && p.team === foulTeam);
          if (player) {
            submitting.current = true;
            await addFoul(player._id, player.name);
            e.target.value = '';
            resetFlow();
            submitting.current = false;
          } else {
            const teamLabel = foulTeam === 'Home' ? homeTeamName : awayTeamName;
            alert(`No #${num} found on ${teamLabel}. Try again.`);
            e.target.value = '';
          }
        }
      }
    }

    // ESC to cancel/reset
    if (e.key === 'Escape') {
      e.target.value = '';
      resetFlow();
    }
  };

  const addPoints = async (playerId, pointsToAdd, playerName) => {
    try {
      await fetch(`${API_URL}/api/players/${playerId}/score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsToAdd })
      });
      await fetchPlayers();
      pushHistory({ type: 'points', playerId, value: pointsToAdd, label: `${playerName} +${pointsToAdd}pts` });
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const addRebound = async (playerId, type, playerName) => {
    try {
      await fetch(`${API_URL}/api/players/${playerId}/rebound`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      await fetchPlayers();
      pushHistory({ type: 'rebound', playerId, reboundType: type, label: `${playerName} +1 ${type.slice(0,3)} reb` });
    } catch (error) {
      console.error('Error adding rebound:', error);
    }
  };

  const addFoul = async (playerId, playerName) => {
    try {
      const currentPlayer = players.find(p => p._id === playerId);
      const newFouls = (currentPlayer?.fouls || 0) + 1;
      await fetch(`${API_URL}/api/players/${playerId}/foul`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      await fetchPlayers();
      pushHistory({ type: 'foul', playerId, label: `${playerName} +1 foul` });
      if (newFouls >= 3) {
        setFoulWarning({ playerName, foulCount: newFouls });
        // Foul-outs require manual dismiss — player must be removed from the game
        if (newFouls < 5) {
          setTimeout(() => setFoulWarning(null), 5000);
        }
      }
    } catch (error) {
      console.error('Error adding foul:', error);
    }
  };

  const addQuickStat = async (playerId, statType, playerName, shortLabel) => {
    try {
      await fetch(`${API_URL}/api/players/${playerId}/${statType}`, { method: 'PATCH' });
      await fetchPlayers();
      pushHistory({ type: statType, playerId, label: `${playerName} +1 ${shortLabel}` });
    } catch (error) {
      console.error(`Error adding ${statType}:`, error);
    }
  };

  const undoLast = async () => {
    if (actionHistory.length === 0) return;
    const last = actionHistory[actionHistory.length - 1];
    try {
      if (last.type === 'points') {
        await fetch(`${API_URL}/api/players/${last.playerId}/undo-score`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pointsToRemove: last.value })
        });
      } else if (last.type === 'rebound') {
        await fetch(`${API_URL}/api/players/${last.playerId}/undo-rebound`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: last.reboundType })
        });
      } else if (last.type === 'foul') {
        await fetch(`${API_URL}/api/players/${last.playerId}/undo-foul`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (['assist', 'steal', 'block'].includes(last.type)) {
        await fetch(`${API_URL}/api/players/${last.playerId}/undo-${last.type}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      await fetchPlayers();
      setActionHistory(prev => prev.slice(0, -1));
    } catch (err) {
      console.error('Undo failed:', err);
    }
  };

  const getTeamStats = (team) => {
    const teamPlayers = players.filter(p => p.team === team);
    const startPlayers = (periodStartStats || []).filter(p => p.team === team);
    return {
      points: teamPlayers.reduce((sum, p) => sum + p.points, 0),
      rebounds: teamPlayers.reduce((sum, p) => sum + p.rebounds, 0),
      offensive: teamPlayers.reduce((sum, p) => sum + (p.offensiveRebounds || 0), 0),
      defensive: teamPlayers.reduce((sum, p) => sum + (p.defensiveRebounds || 0), 0),
      fouls: teamPlayers.reduce((sum, p) => sum + (p.fouls || 0), 0),
      periodFouls: teamPlayers.reduce((sum, p) => {
        const start = startPlayers.find(s => s._id === p._id);
        return sum + (p.fouls || 0) - (start?.fouls || 0);
      }, 0),
    };
  };

  const homeStats = getTeamStats('Home');
  const awayStats = getTeamStats('Away');

  const endGame = async (snapshotsOverride) => {
    const snap = [...players];
    const finalPeriods = snapshotsOverride !== undefined ? snapshotsOverride : periodSnapshots;
    setSummaryPlayers(snap);
    setSummaryPeriods(finalPeriods);
    // Save game summary to DB
    if (league) {
      const homeP = snap.filter(p => p.team === 'Home');
      const awayP = snap.filter(p => p.team === 'Away');
      const homeScore = homeP.reduce((s, p) => s + p.points, 0);
      const awayScore = awayP.reduce((s, p) => s + p.points, 0);
      const winner = homeScore > awayScore ? homeTeamName : awayScore > homeScore ? awayTeamName : null;
      try {
        await fetch(`${API_URL}/api/game-summaries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leagueId: league._id,
            homeTeamName,
            awayTeamName,
            homeScore,
            awayScore,
            winner,
            periodType,
            periods: finalPeriods.map(s => ({
              period: s.period,
              label: s.label,
              homeScore: s.homeScore,
              awayScore: s.awayScore,
              players: s.players,
            })),
            players: snap.map(p => ({
              name: p.name,
              number: p.number,
              team: p.team,
              points: p.points,
              rebounds: p.rebounds,
              offensiveRebounds: p.offensiveRebounds || 0,
              defensiveRebounds: p.defensiveRebounds || 0,
              fouls: p.fouls || 0,
              assists: p.assists || 0,
              steals: p.steals || 0,
              blocks: p.blocks || 0,
            }))
          })
        });
      } catch (err) {
        console.error('Failed to save game summary:', err);
      }
    }
    setView('summary');
    setPlayers([]);
    setPeriodSnapshots([]);
    setPeriodStartStats(null);
    setPeriodBreakData(null);
    setCurrentPeriod(1);
    resetFlow();
  };

  const getPeriodLabel = (n, type) => {
    if (type === 'halves') return n === 1 ? '1st Half' : '2nd Half';
    if (type === 'quarters') return `Q${n}`;
    return '';
  };

  const endPeriod = async () => {
    const startStats = periodStartStats || [];
    const periodPlayers = players.map(p => {
      const start = startStats.find(s => s._id === p._id) || {};
      return {
        name: p.name,
        number: p.number,
        team: p.team,
        points: p.points - (start.points || 0),
        rebounds: p.rebounds - (start.rebounds || 0),
        offensiveRebounds: (p.offensiveRebounds || 0) - (start.offensiveRebounds || 0),
        defensiveRebounds: (p.defensiveRebounds || 0) - (start.defensiveRebounds || 0),
        fouls: (p.fouls || 0) - (start.fouls || 0),
        assists: (p.assists || 0) - (start.assists || 0),
        steals: (p.steals || 0) - (start.steals || 0),
        blocks: (p.blocks || 0) - (start.blocks || 0),
      };
    });
    const homeScore = periodPlayers.filter(p => p.team === 'Home').reduce((s, p) => s + p.points, 0);
    const awayScore = periodPlayers.filter(p => p.team === 'Away').reduce((s, p) => s + p.points, 0);
    const snapshot = {
      period: currentPeriod,
      label: getPeriodLabel(currentPeriod, periodType),
      homeScore,
      awayScore,
      players: periodPlayers,
    };
    const newSnapshots = [...periodSnapshots, snapshot];
    setPeriodSnapshots(newSnapshots);
    setPeriodStartStats([...players]);

    if (currentPeriod >= totalPeriods) {
      await endGame(newSnapshots);
    } else {
      setPeriodBreakData({ snapshot, nextPeriod: currentPeriod + 1 });
      setCurrentPeriod(prev => prev + 1);
    }
  };

  const handleStartGame = (config = {}) => {
    setHomeTeamName(config.homeTeamName || 'Home');
    setAwayTeamName(config.awayTeamName || 'Away');
    const pt = config.periodType || 'none';
    const total = pt === 'halves' ? 2 : pt === 'quarters' ? 4 : 0;
    setPeriodType(pt);
    setTotalPeriods(total);
    setCurrentPeriod(1);
    setPeriodSnapshots([]);
    setPeriodStartStats(null);
    setPeriodBreakData(null);
    setView('game');
  };

  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#ffd700', fontSize: '1.5rem' }}>Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  const handleLogout = () => signOut(auth);

  // Show end-of-game summary
  if (view === 'summary') {
    const homeP = summaryPlayers.filter(p => p.team === 'Home');
    const awayP = summaryPlayers.filter(p => p.team === 'Away');
    const calcTotals = (pList) => ({
      points: pList.reduce((s, p) => s + p.points, 0),
      rebounds: pList.reduce((s, p) => s + p.rebounds, 0),
      offensive: pList.reduce((s, p) => s + (p.offensiveRebounds || 0), 0),
      defensive: pList.reduce((s, p) => s + (p.defensiveRebounds || 0), 0),
      fouls: pList.reduce((s, p) => s + (p.fouls || 0), 0),
    });
    const homeTotals = calcTotals(homeP);
    const awayTotals = calcTotals(awayP);
    const winner = homeTotals.points > awayTotals.points
      ? homeTeamName
      : awayTotals.points > homeTotals.points
      ? awayTeamName
      : null;
    const allPlayers = [...homeP, ...awayP];
    const showAssists = allPlayers.some(p => (p.assists || 0) > 0);
    const showSteals  = allPlayers.some(p => (p.steals  || 0) > 0);
    const showBlocks  = allPlayers.some(p => (p.blocks  || 0) > 0);
    return (
      <div className="app">
        <div className="summary-container">
          <h1 className="summary-title">🏀 Final Score</h1>
          <div className="summary-scoreboard">
            <div className="summary-team-score">
              <div className="summary-team-name">{homeTeamName}</div>
              <div className="summary-score">{homeTotals.points}</div>
            </div>
            <div className="summary-vs">{winner ? `${winner} Wins!` : 'Tie Game!'}</div>
            <div className="summary-team-score">
              <div className="summary-team-name">{awayTeamName}</div>
              <div className="summary-score">{awayTotals.points}</div>
            </div>
          </div>
          {summaryPeriods.length > 0 && (
            <div className="summary-periods">
              <h2 className="summary-section-title">Period Breakdown</h2>
              <table className="summary-periods-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>{homeTeamName}</th>
                    <th>{awayTeamName}</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryPeriods.map((s, i) => (
                    <tr key={i}>
                      <td>{s.label}</td>
                      <td>{s.homeScore}</td>
                      <td>{s.awayScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="summary-teams">
            {[{ label: homeTeamName, pList: homeP, totals: homeTotals }, { label: awayTeamName, pList: awayP, totals: awayTotals }].map(({ label, pList, totals }) => (
              <div key={label} className="summary-team-block">
                <h2 className="summary-team-header">{label}</h2>
                <div className="summary-totals">
                  <span className="summary-total-badge">{totals.points} PTS</span>
                  <span className="summary-total-badge">{totals.rebounds} REB ({totals.offensive}O/{totals.defensive}D)</span>
                  <span className="summary-total-badge fouls">{totals.fouls} FOULS</span>
                </div>
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>PTS</th>
                      <th>REB</th>
                      {showAssists && <th>AST</th>}
                      {showSteals  && <th>STL</th>}
                      {showBlocks  && <th>BLK</th>}
                      <th>FOULS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pList.map(p => (
                      <tr key={p._id}>
                        <td>{p.number}</td>
                        <td>{p.name}</td>
                        <td>{p.points}</td>
                        <td>{p.rebounds} ({p.offensiveRebounds || 0}O/{p.defensiveRebounds || 0}D)</td>
                        {showAssists && <td>{p.assists || 0}</td>}
                        {showSteals  && <td>{p.steals  || 0}</td>}
                        {showBlocks  && <td>{p.blocks  || 0}</td>}
                        <td>{p.fouls || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <button
            className="btn-back-home"
            onClick={() => {
              setView('hero');
              setSummaryPlayers([]);
              setHomeTeamName('Home');
              setAwayTeamName('Away');
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // League gate — must enter a league first
  if (view === 'leagueGate') {
    return (
      <>
        <button
          onClick={handleLogout}
          style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, padding: '8px 18px', background: '#ffd700', color: '#1e3c72', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
        >
          Logout
        </button>
        <LeagueGate
          onEnterLeague={(l) => { setLeague(l); setView('hero'); }}
        />
      </>
    );
  }

  // Show hero page
  if (view === 'hero') {
    return (
      <>
        <button onClick={handleLogout} style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, padding: '8px 18px', background: '#ffd700', color: '#1e3c72', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
        <Hero
          league={league}
          onCreateRoster={() => setView('createRoster')}
          onNewGame={() => setView('newGame')}
          onViewHistory={() => setView('gameHistory')}
          onViewStandings={() => setView('standings')}
          onViewLeaderboard={() => setView('leaderboard')}
          onLeaveLeague={() => { setLeague(null); setView('leagueGate'); }}
          enabledStats={enabledStats}
          onEnabledStatsChange={setEnabledStats}
          layout={layout}
          visible={visible}
          theme={theme}
          custom={custom}
          onLayoutChange={setLayout}
          onVisibleChange={setVisible}
          onThemeChange={setTheme}
          onCustomChange={setCustom}
        />
      </>
    );
  }

  // Show create roster page
  if (view === 'createRoster') {
    return (
      <>
        <button onClick={handleLogout} style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, padding: '8px 18px', background: '#ffd700', color: '#1e3c72', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
        <RosterSetup leagueId={league._id} onBack={() => setView('hero')} />
      </>
    );
  }

  // Show leaderboard
  if (view === 'leaderboard') {
    return (
      <>
        <button onClick={handleLogout} style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, padding: '8px 18px', background: '#ffd700', color: '#1e3c72', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
        <Leaderboard
          leagueId={league._id}
          leagueName={league.name}
          apiUrl={API_URL}
          onBack={() => setView('hero')}
        />
      </>
    );
  }

  // Show standings
  if (view === 'standings') {
    return (
      <>
        <button onClick={handleLogout} style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, padding: '8px 18px', background: '#ffd700', color: '#1e3c72', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
        <Standing
          leagueId={league._id}
          leagueName={league.name}
          apiUrl={API_URL}
          onBack={() => setView('hero')}
        />
      </>
    );
  }

  // Show game history
  if (view === 'gameHistory') {
    return (
      <>
        <button onClick={handleLogout} style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, padding: '8px 18px', background: '#ffd700', color: '#1e3c72', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
        <GameHistory
          leagueId={league._id}
          leagueName={league.name}
          apiUrl={API_URL}
          onBack={() => setView('hero')}
        />
      </>
    );
  }

  // Show new game setup
  if (view === 'newGame') {
    return (
      <>
        <button onClick={handleLogout} style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, padding: '8px 18px', background: '#ffd700', color: '#1e3c72', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
        <NewGame
          leagueId={league._id}
          onStartGame={handleStartGame}
          onBack={() => setView('hero')}
        />
      </>
    );
  }

  return (
    <div className="app">
      <button onClick={handleLogout} style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, padding: '8px 18px', background: '#ffd700', color: '#1e3c72', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      {foulWarning && (
        <div
          className={`foul-warning-toast foul-warning-toast--${foulWarning.foulCount >= 5 ? 'out' : foulWarning.foulCount === 4 ? 'danger' : 'warn'}`}
          onClick={() => setFoulWarning(null)}
        >
          <span className="foul-warning-icon">{foulWarning.foulCount >= 5 ? '🚨' : foulWarning.foulCount === 4 ? '⚠️' : '⚡'}</span>
          <div className="foul-warning-body">
            <strong>{foulWarning.playerName}</strong> — {foulWarning.foulCount} Fouls
            <div className="foul-warning-msg">
              {foulWarning.foulCount >= 5
                ? '🚫 FOUL OUT — Remove this player from the game!'
                : foulWarning.foulCount === 4
                ? 'Danger zone — one more and they\'re out!'
                : 'In foul trouble — 3 fouls!'}
            </div>
            {foulWarning.foulCount >= 5 && (
              <div className="foul-warning-msg" style={{ marginTop: 4, fontStyle: 'italic', opacity: 0.7 }}>
                Tap to dismiss
              </div>
            )}
          </div>
          <button className="foul-warning-dismiss" aria-label="Dismiss">✕</button>
        </div>
      )}
      {periodBreakData && (
        <div className="period-break-overlay">
          <div className="period-break-panel">
            <div className="period-break-badge">{periodBreakData.snapshot.label} Complete</div>
            <div className="period-break-scores">
              <div className="period-break-team">
                <div className="period-break-team-name">{homeTeamName}</div>
                <div className="period-break-score">{periodBreakData.snapshot.homeScore}</div>
              </div>
              <div className="period-break-dash">–</div>
              <div className="period-break-team">
                <div className="period-break-team-name">{awayTeamName}</div>
                <div className="period-break-score">{periodBreakData.snapshot.awayScore}</div>
              </div>
            </div>
            <div className="period-break-running">
              Running total — {homeTeamName}: {homeStats.points} · {awayTeamName}: {awayStats.points}
            </div>
            <button
              className="btn-start-period"
              onClick={() => setPeriodBreakData(null)}
            >
              Start {getPeriodLabel(periodBreakData.nextPeriod, periodType)} →
            </button>
          </div>
        </div>
      )}
      <GameGrid
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        players={players}
        homeStats={homeStats}
        awayStats={awayStats}
        prompt={prompt}
        inputRef={inputRef}
        onKeyPress={handleKeyPress}
        onEndGame={endGame}
        onPlayerSelect={handlePlayerSelect}
        actionHistory={actionHistory}
        onUndo={undoLast}
        enabledStats={enabledStats}
        onEnabledStatsChange={setEnabledStats}
        currentPeriod={currentPeriod}
        totalPeriods={totalPeriods}
        periodType={periodType}
        onEndPeriod={endPeriod}
        layout={layout}
        visible={visible}
        theme={theme}
        custom={custom}
        onLayoutChange={setLayout}
        onVisibleChange={setVisible}
        onThemeChange={setTheme}
        onCustomChange={setCustom}
      />
    </div>
  );
}

export default App;