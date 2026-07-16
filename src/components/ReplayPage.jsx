import { useEffect, useState } from 'react';
import { subscribeMoves, subscribeRoom } from '../online/rooms';
import { GameBoard } from './GameBoard';
import { SiteFooter } from './LegalPages';

export function ReplayPage({ roomCode }) {
  const [room, setRoom] = useState(null);
  const [moves, setMoves] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomCode) return undefined;

    const unsubscribeRoom = subscribeRoom(roomCode, setRoom, (err) => setError(err.message));
    const unsubscribeMoves = subscribeMoves(roomCode, setMoves, (err) => setError(err.message));

    return () => {
      unsubscribeRoom();
      unsubscribeMoves();
    };
  }, [roomCode]);

  return (
    <main className="app-shell replay-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">REPLAY</p>
          <h1>대국 기록</h1>
          <p className="subtitle">방 코드: {roomCode}</p>
        </div>
        <a className="primary-button nav-button" href="/">게임으로 돌아가기</a>
      </section>

      {error && <section className="log-card"><p className="error">{error}</p></section>}

      {room?.game ? (
        <section className="game-area replay-area">
          <GameBoard game={room.game} canPlace={false} onPlace={() => {}} />
          <aside className="rules-card">
            <h2>대국 정보</h2>
            <p><strong>유형:</strong> {room.ranked ? '랭크' : '친선'}</p>
            <p><strong>상태:</strong> {room.status}</p>
            <p><strong>승자:</strong> {formatWinner(room.verifiedWinner ?? room.game.winner)}</p>
            {room.ratingChange && (
              <p className="rating-result">
                레이팅 변동 — 흑 {formatDelta(room.ratingChange.B.delta)} / 백 {formatDelta(room.ratingChange.W.delta)}
              </p>
            )}

            <h2>수순</h2>
            {moves.length === 0 ? (
              <p>저장된 수순이 없습니다.</p>
            ) : (
              <ol className="move-list">
                {moves.map((move) => (
                  <li key={move.id}>
                    <strong>{move.moveNo}.</strong> {move.player} · {formatAction(move.action)}
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </section>
      ) : (
        <section className="log-card">
          <p>대국을 불러오는 중입니다.</p>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}

function formatAction(action) {
  if (!action) return '알 수 없음';
  if (action.type === 'PLACE_STONE') return `착수 (${action.row}, ${action.col})`;
  if (action.type === 'ROTATE_DIRECTION') return `방향 ${action.steps}칸`;
  if (action.type === 'FORFEIT') return '기권';
  return action.type;
}

function formatWinner(winner) {
  if (winner === 'B') return '흑';
  if (winner === 'W') return '백';
  if (winner === 'BOTH') return '동시 승리';
  if (winner === 'DRAW' || winner == null) return '무승부';
  return winner;
}

function formatDelta(delta) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}
