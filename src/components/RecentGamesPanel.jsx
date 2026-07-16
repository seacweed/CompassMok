export function RecentGamesPanel({ rows }) {
  return (
    <aside className="rules-card recent-games-card">
      <h2>최근 대국</h2>
      {rows.length === 0 ? (
        <p>아직 기록된 대국이 없습니다.</p>
      ) : (
        <ol className="recent-games-list">
          {rows.map((row) => (
            <li key={row.roomCode ?? row.id}>
              <div>
                <strong>{formatWinner(row.winner)}</strong>
                <span>{row.size}×{row.size} / {row.winLength}목 / {row.moveCount ?? 0}수</span>
              </div>
              <a href={`/replay/${row.roomCode ?? row.id}`}>리플레이</a>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function formatWinner(winner) {
  if (winner === 'B') return '흑 승';
  if (winner === 'W') return '백 승';
  if (winner === 'BOTH') return '동시 승리';
  return '무승부';
}
