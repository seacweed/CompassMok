import { getAllShadows, indexOf } from '../game/engine';

function cellKey(row, col) {
  return `${row},${col}`;
}

function isStarPoint(row, col, size) {
  const mid = Math.floor(size / 2);
  const points = {
    11: [2, mid, 8],
    13: [3, mid, 9],
    15: [3, mid, 11],
  }[size] ?? [mid];

  return points.includes(row) && points.includes(col);
}

export function GameBoard({ game, canPlace, onPlace }) {
  const shadows = getAllShadows(game);
  const winSet = new Set(game.winningCells.map((cell) => cellKey(cell.row, cell.col)));

  return (
    <section className="board-wrap" aria-label="나침반목 보드">
      <div className="board" style={{ '--size': game.size }}>
        {Array.from({ length: game.size * game.size }, (_, index) => {
          const row = Math.floor(index / game.size);
          const col = index % game.size;
          const occupant = game.board[indexOf(row, col, game.size)];
          const key = cellKey(row, col);
          const hasBlackShadow = shadows.B.has(key);
          const hasWhiteShadow = shadows.W.has(key);
          const hasAnyShadow = hasBlackShadow || hasWhiteShadow;

          return (
            <button
              key={key}
              className={[
                'cell',
                occupant ? 'occupied' : '',
                isStarPoint(row, col, game.size) ? 'star' : '',
                winSet.has(key) ? 'win' : '',
                hasBlackShadow && hasWhiteShadow ? 'dual-shadow' : '',
              ].filter(Boolean).join(' ')}
              type="button"
              disabled={!canPlace || Boolean(occupant)}
              onClick={() => onPlace(row, col)}
              aria-label={`${String.fromCharCode(65 + col)}${row + 1}`}
            >
              {hasAnyShadow && (
                <span className="shadow-layer">
                  <span
                    className={[
                      'shadow-dot',
                      hasBlackShadow && !hasWhiteShadow ? 'black-shadow' : '',
                      hasWhiteShadow && !hasBlackShadow ? 'white-shadow' : '',
                    ].filter(Boolean).join(' ')}
                  />
                </span>
              )}
              {occupant && <span className={`stone ${occupant === 'B' ? 'black-stone' : 'white-stone'}`} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
