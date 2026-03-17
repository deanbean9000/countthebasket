import Widget from './Widget';

/**
 * ScoreboardWidget — live team scores + End Game control.
 */
function ScoreboardWidget({ homeTeamName, awayTeamName, homeStats, awayStats, onEndGame }) {
  return (
    <Widget id="scoreboard" title="Scoreboard">
      <div className="scoreboard-layout">
        <div className="team-score">
          <h2>{homeTeamName}</h2>
          <div className="score">{homeStats.points}</div>
        </div>

        <div className="game-title">
          <h1>🏀 Count The Basket</h1>
          <button onClick={onEndGame} className="btn-end-game">End Game</button>
        </div>

        <div className="team-score">
          <h2>{awayTeamName}</h2>
          <div className="score">{awayStats.points}</div>
        </div>
      </div>
    </Widget>
  );
}

export default ScoreboardWidget;
