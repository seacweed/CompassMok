import { directionAt } from '../game/engine';

export function DirectionControl({ game, canRotate, onRotate }) {
  const current = directionAt(game.directionIndex);
  const option0 = directionAt(game.directionIndex);
  const option1 = directionAt(game.directionIndex + 1);
  const option2 = directionAt(game.directionIndex + 2);

  return (
    <aside className="control-card">
      <h2>나침반</h2>
      <p>
        현재 방향은 <strong>{current.symbol} {current.name}</strong>입니다.
        돌을 둔 뒤 0·1·2칸 시계방향으로 돌리고 턴을 넘깁니다.
      </p>

      <div className="compass" aria-hidden="true">
        <div className="compass-face">
          <span className="dir d0">↑</span>
          <span className="dir d1">↗</span>
          <span className="dir d2">→</span>
          <span className="dir d3">↘</span>
          <span className="dir d4">↓</span>
          <span className="dir d5">↙</span>
          <span className="dir d6">←</span>
          <span className="dir d7">↖</span>
          <span className="needle">{current.symbol}</span>
        </div>
      </div>

      <div className="direction-preview">
        <div className="preview-item"><span>0칸</span><strong>{option0.symbol}</strong></div>
        <div className="preview-item"><span>1칸</span><strong>{option1.symbol}</strong></div>
        <div className="preview-item"><span>2칸</span><strong>{option2.symbol}</strong></div>
      </div>

      <div className="compass-controls">
        <button className="secondary-button" type="button" disabled={!canRotate} onClick={() => onRotate(0)}>0칸 · {option0.symbol}</button>
        <button className="secondary-button" type="button" disabled={!canRotate} onClick={() => onRotate(1)}>1칸 · {option1.symbol}</button>
        <button className="secondary-button" type="button" disabled={!canRotate} onClick={() => onRotate(2)}>2칸 · {option2.symbol}</button>
      </div>

      <div className="legend">
        <div><span className="stone black-stone" /> 흑 실제 돌</div>
        <div><span className="stone white-stone" /> 백 실제 돌</div>
        <div><span className="shadow-dot black-shadow" /> 흑 그림자</div>
        <div><span className="shadow-dot white-shadow" /> 백 그림자</div>
      </div>
    </aside>
  );
}
