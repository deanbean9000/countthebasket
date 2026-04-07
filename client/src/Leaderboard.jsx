import { useState, useEffect } from 'react';
import './Leaderboard.css';

const STAT_TABS = [
  { key: 'ppg', label: 'PPG', full: 'Points Per Game',   emoji: '🔥' },
  { key: 'rpg', label: 'RPG', full: 'Rebounds Per Game', emoji: '💪' },
  { key: 'apg', label: 'APG', full: 'Assists Per Game',  emoji: '🤝' },
  { key: 'spg', label: 'SPG', full: 'Steals Per Game',   emoji: '🫳' },
  { key: 'bpg', label: 'BPG', full: 'Blocks Per Game',   emoji: '✋' },
  { key: 'fpg', label: 'FPG', full: 'Fouls Per Game',    emoji: '🚨' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

function Leaderboard({ leagueId, leagueName, apiUrl, onBack }) {
  const [stats, setStats]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('ppg');
  const [sortKey, setSortKey]     = useState('ppg');
  const [sortDir, setSortDir]     = useState('desc');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}/api/season-stats?leagueId=${leagueId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Server error ${res.status}`);
        }
        setStats(await res.json());
      } catch (err) {
        setError(`Could not load season stats: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [leagueId, apiUrl]);

  // ── Sorting ───────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...stats].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  // Top-5 leaders for the active stat tab
  const leaders = [...stats]
    .sort((a, b) => (b[activeTab] ?? 0) - (a[activeTab] ?? 0))
    .slice(0, 5);

  const SortArrow = ({ col }) => {
    if (sortKey !== col) return <span className="sort-arrow muted">↕</span>;
    return <span className="sort-arrow active">{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-topbar">
        <button className="lb-back-btn" onClick={onBack}>← Back</button>
        <div className="lb-heading">
          <h1 className="lb-title">📈 Season Leaderboard</h1>
          <p className="lb-subtitle">🏆 {leagueName}</p>
        </div>
      </div>

      {loading && <div className="lb-status">Loading stats…</div>}
      {error   && <div className="lb-status lb-error">{error}</div>}

      {!loading && !error && stats.length === 0 && (
        <div className="lb-status">No games recorded yet. Play some games first!</div>
      )}

      {!loading && !error && stats.length > 0 && (
        <>
          {/* ── Leader Cards ─────────────────────────────────────────── */}
          <div className="lb-section">
            <div className="lb-tabs" role="tablist">
              {STAT_TABS.map(tab => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={`lb-tab${activeTab === tab.key ? ' lb-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.emoji} {tab.full}
                </button>
              ))}
            </div>

            <div className="lb-leader-cards">
              {leaders.map((player, i) => (
                <div
                  key={`${player.name}-${player.number}`}
                  className={`lb-card lb-card--rank-${i + 1}`}
                >
                  <span className="lb-card-medal">{MEDALS[i] ?? `#${i + 1}`}</span>
                  <div className="lb-card-info">
                    <span className="lb-card-name">{player.name}</span>
                    <span className="lb-card-number">#{player.number}</span>
                  </div>
                  <div className="lb-card-stat">
                    <span className="lb-card-value">{(player[activeTab] ?? 0).toFixed(1)}</span>
                    <span className="lb-card-label">{activeTab.toUpperCase()}</span>
                  </div>
                  <div className="lb-card-games">{player.games}G</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Full Season Stats Table ───────────────────────────────── */}
          <div className="lb-section">
            <h2 className="lb-section-title">Full Season Stats</h2>
            <div className="lb-table-wrap">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th className="lb-th-rank">#</th>
                    <th className="lb-th-name">Player</th>
                    <th className="lb-th-num">No.</th>
                    <th className="lb-th-sortable" onClick={() => handleSort('games')}>
                      G <SortArrow col="games" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('totalPoints')}>
                      PTS <SortArrow col="totalPoints" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('ppg')}>
                      PPG <SortArrow col="ppg" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('totalRebounds')}>
                      REB <SortArrow col="totalRebounds" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('rpg')}>
                      RPG <SortArrow col="rpg" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('totalAssists')}>
                      AST <SortArrow col="totalAssists" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('apg')}>
                      APG <SortArrow col="apg" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('totalSteals')}>
                      STL <SortArrow col="totalSteals" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('spg')}>
                      SPG <SortArrow col="spg" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('totalBlocks')}>
                      BLK <SortArrow col="totalBlocks" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('bpg')}>
                      BPG <SortArrow col="bpg" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('totalFouls')}>
                      FOULS <SortArrow col="totalFouls" />
                    </th>
                    <th className="lb-th-sortable" onClick={() => handleSort('fpg')}>
                      FPG <SortArrow col="fpg" />
                    </th>
                    <th className="lb-th-offdef">OFF / DEF</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((player, i) => (
                    <tr key={`${player.name}-${player.number}`} className={i % 2 === 0 ? 'lb-row-even' : ''}>
                      <td className="lb-td-rank">{i + 1}</td>
                      <td className="lb-td-name">{player.name}</td>
                      <td className="lb-td-num">#{player.number}</td>
                      <td>{player.games}</td>
                      <td className="lb-td-pts">{player.totalPoints}</td>
                      <td className="lb-td-avg lb-td-pts">{(player.ppg ?? 0).toFixed(1)}</td>
                      <td>{player.totalRebounds}</td>
                      <td className="lb-td-avg">{(player.rpg ?? 0).toFixed(1)}</td>
                      <td>{player.totalAssists ?? 0}</td>
                      <td className="lb-td-avg">{(player.apg ?? 0).toFixed(1)}</td>
                      <td>{player.totalSteals ?? 0}</td>
                      <td className="lb-td-avg">{(player.spg ?? 0).toFixed(1)}</td>
                      <td>{player.totalBlocks ?? 0}</td>
                      <td className="lb-td-avg">{(player.bpg ?? 0).toFixed(1)}</td>
                      <td>{player.totalFouls}</td>
                      <td className="lb-td-avg lb-td-fouls">{(player.fpg ?? 0).toFixed(1)}</td>
                      <td className="lb-td-offdef">
                        {player.totalOffRebounds}O / {player.totalDefRebounds}D
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Leaderboard;
