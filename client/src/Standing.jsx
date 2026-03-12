import { useState, useEffect } from 'react';
import './Standing.css';

function Standing({ leagueId, leagueName, apiUrl, onBack }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('wins');

  useEffect(() => {
    const buildStandings = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/game-summaries?leagueId=${leagueId}`);
        const games = await res.json();

        const map = {};

        const getTeam = (name) => {
          if (!map[name]) {
            map[name] = { team: name, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, games: 0 };
          }
          return map[name];
        };

        games.forEach((g) => {
          const home = getTeam(g.homeTeamName);
          const away = getTeam(g.awayTeamName);

          home.pf += g.homeScore;
          home.pa += g.awayScore;
          home.games += 1;

          away.pf += g.awayScore;
          away.pa += g.homeScore;
          away.games += 1;

          if (!g.winner) {
            home.ties += 1;
            away.ties += 1;
          } else if (g.winner === g.homeTeamName) {
            home.wins += 1;
            away.losses += 1;
          } else {
            away.wins += 1;
            home.losses += 1;
          }
        });

        setStandings(Object.values(map));
      } catch (err) {
        console.error('Failed to load standings:', err);
      } finally {
        setLoading(false);
      }
    };
    buildStandings();
  }, [leagueId, apiUrl]);

  const sorted = [...standings].sort((a, b) => {
    if (sortKey === 'wins') {
      if (b.wins !== a.wins) return b.wins - a.wins;
      // tiebreak: point differential
      return (b.pf - b.pa) - (a.pf - a.pa);
    }
    if (sortKey === 'pct') {
      const pctA = a.games ? (a.wins + 0.5 * a.ties) / a.games : 0;
      const pctB = b.games ? (b.wins + 0.5 * b.ties) / b.games : 0;
      return pctB - pctA;
    }
    if (sortKey === 'pf') return b.pf - a.pf;
    if (sortKey === 'diff') return (b.pf - b.pa) - (a.pf - a.pa);
    return 0;
  });

  const pct = (t) => {
    if (!t.games) return '.000';
    const val = (t.wins + 0.5 * t.ties) / t.games;
    return val.toFixed(3).replace(/^0/, '');
  };

  const SortBtn = ({ k, label }) => (
    <button
      className={`st-sort-btn${sortKey === k ? ' active' : ''}`}
      onClick={() => setSortKey(k)}
    >
      {label}
    </button>
  );

  return (
    <div className="app">
      <div className="st-container">
        <button className="st-back-btn" onClick={onBack}>← Back to Home</button>
        <h1 className="st-title">🏆 Standings</h1>
        {leagueName && <div className="st-league-name">League: {leagueName}</div>}

        {loading && <div className="st-loading">Loading standings...</div>}

        {!loading && standings.length === 0 && (
          <div className="st-empty">No games recorded yet. Play a game to see standings!</div>
        )}

        {!loading && standings.length > 0 && (
          <>
            <div className="st-sort-row">
              <span className="st-sort-label">Sort by:</span>
              <SortBtn k="wins" label="Wins" />
              <SortBtn k="pct" label="Win %" />
              <SortBtn k="pf" label="Pts For" />
              <SortBtn k="diff" label="+/-" />
            </div>
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th className="st-rank">#</th>
                    <th className="st-team-col">Team</th>
                    <th>GP</th>
                    <th>W</th>
                    <th>L</th>
                    <th>T</th>
                    <th>PCT</th>
                    <th>PF</th>
                    <th>PA</th>
                    <th>+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t, i) => {
                    const diff = t.pf - t.pa;
                    const isTop = i === 0;
                    return (
                      <tr key={t.team} className={isTop ? 'st-leader' : ''}>
                        <td className="st-rank">{i + 1}</td>
                        <td className="st-team-col">
                          {isTop && <span className="st-crown">👑</span>}
                          {t.team}
                        </td>
                        <td>{t.games}</td>
                        <td className="st-w">{t.wins}</td>
                        <td className="st-l">{t.losses}</td>
                        <td>{t.ties}</td>
                        <td>{pct(t)}</td>
                        <td>{t.pf}</td>
                        <td>{t.pa}</td>
                        <td className={diff > 0 ? 'st-pos' : diff < 0 ? 'st-neg' : ''}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Standing;
