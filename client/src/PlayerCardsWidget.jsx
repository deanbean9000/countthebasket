import Widget from './Widget';

// Returns extra class + label for foul threshold milestones
function foulMeta(count) {
  if (count >= 5) return { cls: 'fouls--out',    label: 'FOUL OUT' };
  if (count === 4) return { cls: 'fouls--danger', label: '4 FOULS — 1 left!' };
  if (count === 3) return { cls: 'fouls--warn',   label: '3 FOULS' };
  return { cls: '', label: `${count} FOULS` };
}

/**
 * PlayerCardsWidget — full stat cards (points, rebounds, fouls) for both teams.
 */
function PlayerCardsWidget({ homeTeamName, awayTeamName, homeStats, awayStats, players }) {
  const renderTeamColumn = (team, teamName, stats) => {
    const teamPlayers = players.filter(p => p.team === team);
    return (
      <div className="team-column">
        <h2 className="team-header">
          {teamName}
          <span className="team-stats">
            {stats.points} pts | {stats.rebounds} reb ({stats.offensive}O/{stats.defensive}D) | {stats.fouls} fouls
          </span>
        </h2>
        {teamPlayers.map(player => {
          const fouls = player.fouls || 0;
          const { cls, label } = foulMeta(fouls);
          return (
            <div key={player._id} className={`player-card${fouls >= 3 ? ` player-card--foul-${fouls >= 5 ? 'out' : fouls === 4 ? 'danger' : 'warn'}` : ''}`}>
              <div className="player-info">
                <span className="player-number">#{player.number}</span>
                <span className="player-name">{player.name}</span>
              </div>
              <div className="player-stats">
                <span className="stat-badge points">{player.points} PTS</span>
                <span className="stat-badge rebounds">
                  {player.rebounds} REB ({player.offensiveRebounds || 0}O/{player.defensiveRebounds || 0}D)
                </span>
                {(player.assists || 0) > 0 && (
                  <span className="stat-badge">{player.assists} AST</span>
                )}
                {(player.steals || 0) > 0 && (
                  <span className="stat-badge">{player.steals} STL</span>
                )}
                {(player.blocks || 0) > 0 && (
                  <span className="stat-badge">{player.blocks} BLK</span>
                )}
                {fouls > 0 && (
                  <span className={`stat-badge fouls ${cls}`}>{label}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Widget id="player-cards" title="Player Stats">
      <div className="teams-layout">
        {renderTeamColumn('Home', homeTeamName, homeStats)}
        {renderTeamColumn('Away', awayTeamName, awayStats)}
      </div>
    </Widget>
  );
}

export default PlayerCardsWidget;
