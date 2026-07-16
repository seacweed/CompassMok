import { PHASES, PLAYERS } from '../game/constants';
import { directionAt } from '../game/engine';

export function GameStatus({ game, role, onlineStatus }) {
  const direction = directionAt(game.directionIndex);

  return (
    <section className="status-panel" aria-live="polite">
      <div className={`status-card turn-card ${game.currentPlayer === 'B' ? 'black-turn' : 'white-turn'}`}>
        <span className="label">현재 차례</span>
        <strong>{PLAYERS[game.currentPlayer].label}</strong>
      </div>
      <div className="status-card">
        <span className="label">그림자 방향</span>
        <strong>{direction.symbol} {direction.name}</strong>
      </div>
      <div className="status-card">
        <span className="label">상태</span>
        <strong>{phaseLabel(game.phase)}</strong>
      </div>
      <div className="status-card">
        <span className="label">승리 조건</span>
        <strong>{game.winLength}목</strong>
        {role && <small className="status-small">내 역할: {role === 'spectator' ? '관전' : PLAYERS[role].label}</small>}
        {onlineStatus && <small className="status-small">{onlineStatus}</small>}
      </div>
    </section>
  );
}

function phaseLabel(phase) {
  if (phase === PHASES.PLACE) return '돌 놓기';
  if (phase === PHASES.ROTATE) return '방향 조정';
  if (phase === PHASES.GAME_OVER) return '게임 종료';
  return phase;
}
