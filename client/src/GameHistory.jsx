import { useState, useEffect } from 'react';
import './GameHistory.css';

function GameHistory({ leagueId, leagueName, apiUrl, onBack }) {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/game-summaries?leagueId=${leagueId}`);
        const data = await res.json();
        setSummaries(data);
      } catch (err) {
        console.error('Failed to load game summaries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummaries();
  }, [leagueId, apiUrl]);

  if (selected) {
    const homeP = selected.players.filter(p => p.team === 'Home');
    const awayP = selected.players.filter(p => p.team === 'Away');
    const date = new Date(selected.playedAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    return (
      <div className="app">
        <div className="gh-container">
          <button className="gh-back-btn" onClick={() => setSelected(null)}>← Back to Games</button>
          <div className="gh-detail-date">{date}</div>
          <h1 className="summary-title">🏀 Game Summary</h1>
          <div className="summary-scoreboard">
            <div className="summary-team-score">
              <div className="summary-team-name">{selected.homeTeamName}</div>
              <div className="summary-score">{selected.homeScore}</div>
            </div>
            <div className="summary-vs">
              {selected.winner ? `${selected.winner} Won` : 'Tie'}
            </div>
            <div className="summary-team-score">
              <div className="summary-team-name">{selected.awayTeamName}</div>
              <div className="summary-score">{selected.awayScore}</div>
            </div>
          </div>
          <div className="summary-teams">
            {[
              { label: selected.homeTeamName, pList: homeP },
              { label: selected.awayTeamName, pList: awayP }
            ].map(({ label, pList }) => {
              const totals = {
                points: pList.reduce((s, p) => s + p.points, 0),
                rebounds: pList.reduce((s, p) => s + p.rebounds, 0),
                offensive: pList.reduce((s, p) => s + (p.offensiveRebounds || 0), 0),
                defensive: pList.reduce((s, p) => s + (p.defensiveRebounds || 0), 0),
                fouls: pList.reduce((s, p) => s + (p.fouls || 0), 0),
              };
              return (
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
                        <th>FOULS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pList.map((p, i) => (
                        <tr key={i}>
                          <td>{p.number}</td>
                          <td>{p.name}</td>
                          <td>{p.points}</td>
                          <td>{p.rebounds} ({p.offensiveRebounds || 0}O/{p.defensiveRebounds || 0}D)</td>
                          <td>{p.fouls || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
          <button className="btn-back-home" onClick={() => setSelected(null)}>Back to Games List</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="gh-container">
        <button className="gh-back-btn" onClick={onBack}>← Back to Home</button>
        <h1 className="gh-title">📋 Past Games</h1>
        {leagueName && <div className="gh-league-name">🏆 {leagueName}</div>}

        {loading && <div className="gh-loading">Loading games...</div>}

        {!loading && summaries.length === 0 && (
          <div className="gh-empty">No games recorded yet. Play a game to see it here!</div>
        )}

        {!loading && summaries.length > 0 && (
          <div className="gh-list">
            {summaries.map((s) => {
              const date = new Date(s.playedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
              });
              const time = new Date(s.playedAt).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit'
              });
              return (
                <button key={s._id} className="gh-game-card" onClick={() => setSelected(s)}>
                  <div className="gh-game-date">{date} · {time}</div>
                  <div className="gh-game-scoreline">
                    <span className={`gh-team ${s.winner === s.homeTeamName ? 'gh-winner' : ''}`}>
                      {s.homeTeamName}
                    </span>
                    <span className="gh-scores">
                      <span className={s.winner === s.homeTeamName ? 'gh-winning-score' : ''}>{s.homeScore}</span>
                      <span className="gh-dash">–</span>
                      <span className={s.winner === s.awayTeamName ? 'gh-winning-score' : ''}>{s.awayScore}</span>
                    </span>
                    <span className={`gh-team ${s.winner === s.awayTeamName ? 'gh-winner' : ''}`}>
                      {s.awayTeamName}
                    </span>
                  </div>
                  {s.winner
                    ? <div className="gh-result">🏆 {s.winner} won</div>
                    : <div className="gh-result">Tie game</div>
                  }
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default GameHistory;
