import Widget from './Widget';

/**
 * RosterWidget — compact player list (number + name) for one team.
 * Used as a sidebar quick-reference during entry.
 *
 * @param {string} teamName  - Display name for the team
 * @param {array}  players   - Full players array (component filters by team prop)
 * @param {string} team      - 'Home' | 'Away' — which team to show
 */
function RosterWidget({ teamName, players, team, onPlayerSelect }) {
  const teamPlayers = players.filter(p => p.team === team);

  return (
    <Widget id={`roster-${team.toLowerCase()}`} title={`${teamName} Roster`}>
      <div className="roster-list">
        {teamPlayers.map(player => {
          const fouls = player.fouls || 0;
          const foulCls = fouls >= 5 ? 'roster-item--foul-out'
            : fouls === 4 ? 'roster-item--foul-danger'
            : fouls === 3 ? 'roster-item--foul-warn'
            : '';
          return (
            <button
              key={player._id}
              className={`roster-item roster-item--clickable ${foulCls}`}
              onClick={() => onPlayerSelect && onPlayerSelect(player)}
              title={`Select ${player.name}${fouls > 0 ? ` (${fouls} fouls)` : ''}`}
            >
              <span className="roster-number">#{player.number}</span>
              <span className="roster-name">{player.name}</span>
              {fouls >= 3 && (
                <span className="roster-foul-pip" aria-label={`${fouls} fouls`}>
                  {fouls >= 5 ? '🚨' : fouls === 4 ? '⚠️' : '⚡'}
                  <span className="roster-foul-count">{fouls}F</span>
                </span>
              )}
            </button>
          );
        })}
        {teamPlayers.length === 0 && (
          <p className="roster-empty">No players loaded</p>
        )}
      </div>
    </Widget>
  );
}

export default RosterWidget;
