export function LeaderboardPanel({ rows }) {
  return (
    <aside className="rules-card leaderboard-card">
      <h2>랭킹</h2>
      {rows.length === 0 ? (
        <p>아직 랭킹 데이터가 없습니다.</p>
      ) : (
        <ol className="leaderboard-list">
          {rows.map((row, index) => (
            <li key={row.uid ?? row.id}>
              <span className="rank-no">#{index + 1}</span>
              <span className="rank-name">{row.displayName ?? 'Player'}</span>
              <strong>{row.rating ?? 1500}</strong>
              <small>{row.rankedWins ?? 0}-{row.rankedLosses ?? 0}-{row.rankedDraws ?? 0}</small>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
