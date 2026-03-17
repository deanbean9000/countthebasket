import Widget from './Widget';

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
        {teamPlayers.map(player => (
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
              {(player.fouls || 0) > 0 && (
                <span className="stat-badge fouls">{player.fouls} FOULS</span>
              )}
            </div>
          </div>
        ))}
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
