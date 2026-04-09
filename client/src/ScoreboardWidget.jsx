import Widget from './Widget';

/**
 * ScoreboardWidget — live team scores + period indicator + End Period / End Game controls.
 */
function ScoreboardWidget({ homeTeamName, awayTeamName, homeStats, awayStats, onEndGame, currentPeriod, totalPeriods, periodType, onEndPeriod }) {
  const hasPeriods = totalPeriods > 0;
  const periodLabel = periodType === 'halves'
    ? (currentPeriod === 1 ? '1st Half' : '2nd Half')
    : periodType === 'quarters'
    ? `Q${currentPeriod}`
    : '';
  const isLastPeriod = currentPeriod >= totalPeriods;

  return (
    <Widget id="scoreboard" title="Scoreboard">
      <div className="scoreboard-layout">
        <div className="team-score">
          <h2>{homeTeamName}</h2>
          <div className="score">{homeStats.points}</div>
          {hasPeriods && (
            <div className="period-fouls-badge">
              {homeStats.periodFouls} {homeStats.periodFouls === 1 ? 'foul' : 'fouls'} this {periodType === 'halves' ? 'half' : 'qtr'}
            </div>
          )}
        </div>

        <div className="game-title">
          <h1>🏀 Count The Basket</h1>
          {hasPeriods && (
            <div className="period-badge">{periodLabel}</div>
          )}
          <div className="scoreboard-actions">
            {hasPeriods && (
              <button
                onClick={onEndPeriod}
                className={`btn-end-period${isLastPeriod ? ' btn-end-period--last' : ''}`}
              >
                {isLastPeriod ? `End ${periodLabel} & Finish` : `End ${periodLabel}`}
              </button>
            )}
            <button
              onClick={onEndGame}
              className={`btn-end-game${hasPeriods ? ' btn-end-game--secondary' : ''}`}
            >
              {hasPeriods ? 'End Game Early' : 'End Game'}
            </button>
          </div>
        </div>

        <div className="team-score">
          <h2>{awayTeamName}</h2>
          <div className="score">{awayStats.points}</div>
          {hasPeriods && (
            <div className="period-fouls-badge">
              {awayStats.periodFouls} {awayStats.periodFouls === 1 ? 'foul' : 'fouls'} this {periodType === 'halves' ? 'half' : 'qtr'}
            </div>
          )}
        </div>
      </div>
    </Widget>
  );
}

export default ScoreboardWidget;
