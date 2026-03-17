import Widget from './Widget';

/**
 * RosterWidget — compact player list (number + name) for one team.
 * Used as a sidebar quick-reference during entry.
 *
 * @param {string} teamName  - Display name for the team
 * @param {array}  players   - Full players array (component filters by team prop)
 * @param {string} team      - 'Home' | 'Away' — which team to show
 */
function RosterWidget({ teamName, players, team }) {
  const teamPlayers = players.filter(p => p.team === team);

  return (
    <Widget id={`roster-${team.toLowerCase()}`} title={`${teamName} Roster`}>
      <div className="roster-list">
        {teamPlayers.map(player => (
          <div key={player._id} className="roster-item">
            <span className="roster-number">#{player.number}</span>
            <span className="roster-name">{player.name}</span>
          </div>
        ))}
        {teamPlayers.length === 0 && (
          <p className="roster-empty">No players loaded</p>
        )}
      </div>
    </Widget>
  );
}

export default RosterWidget;
