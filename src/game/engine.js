import { DEFAULT_DIRECTION_INDEX, DEFAULT_SIZE, DEFAULT_WIN_LENGTH, DIRECTIONS, PHASES, PLAYERS } from './constants';

export function createInitialGame({ size = DEFAULT_SIZE, winLength = DEFAULT_WIN_LENGTH } = {}) {
  return {
    size,
    winLength,
    board: Array(size * size).fill(null),
    currentPlayer: 'B',
    phase: PHASES.PLACE,
    directionIndex: DEFAULT_DIRECTION_INDEX,
    winner: null,
    winningCells: [],
    log: [`새 게임. ${size}×${size}, ${winLength}목, 초기 그림자 방향 ↓.`],
    turn: 1,
  };
}

export function cloneGame(game) {
  return {
    ...game,
    board: [...game.board],
    winningCells: game.winningCells.map((cell) => ({ ...cell })),
    log: [...game.log],
  };
}

export function directionAt(index) {
  return DIRECTIONS[((index % DIRECTIONS.length) + DIRECTIONS.length) % DIRECTIONS.length];
}

export function otherPlayer(player) {
  return player === 'B' ? 'W' : 'B';
}

export function indexOf(row, col, size) {
  return row * size + col;
}

export function rowColOf(index, size) {
  return { row: Math.floor(index / size), col: index % size };
}

export function inBounds(row, col, size) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

export function coordLabel(row, col) {
  const column = String.fromCharCode(65 + col);
  return `${column}${row + 1}`;
}

export function getStone(game, row, col) {
  if (!inBounds(row, col, game.size)) return undefined;
  return game.board[indexOf(row, col, game.size)];
}

export function getPlayerCoverage(game, player) {
  const direction = directionAt(game.directionIndex);
  const coverage = new Set();
  const shadowOrigins = new Map();

  for (let i = 0; i < game.board.length; i += 1) {
    if (game.board[i] !== player) continue;

    const { row, col } = rowColOf(i, game.size);
    const realKey = `${row},${col}`;
    coverage.add(realKey);

    const sr = row + direction.dr;
    const sc = col + direction.dc;
    if (inBounds(sr, sc, game.size) && getStone(game, sr, sc) === null) {
      const shadowKey = `${sr},${sc}`;
      coverage.add(shadowKey);
      if (!shadowOrigins.has(shadowKey)) shadowOrigins.set(shadowKey, []);
      shadowOrigins.get(shadowKey).push({ row, col });
    }
  }

  return { coverage, shadowOrigins };
}

export function getAllShadows(game) {
  return {
    B: getPlayerCoverage(game, 'B').shadowOrigins,
    W: getPlayerCoverage(game, 'W').shadowOrigins,
  };
}

export function checkWin(game, player) {
  const { coverage } = getPlayerCoverage(game, player);
  const lineDirs = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 },
  ];

  for (const key of coverage) {
    const [row, col] = key.split(',').map(Number);

    for (const lineDir of lineDirs) {
      const previousKey = `${row - lineDir.dr},${col - lineDir.dc}`;
      if (coverage.has(previousKey)) continue;

      const cells = [];
      let rr = row;
      let cc = col;

      while (inBounds(rr, cc, game.size) && coverage.has(`${rr},${cc}`)) {
        cells.push({ row: rr, col: cc });
        if (cells.length >= game.winLength) return cells.slice(0, game.winLength);
        rr += lineDir.dr;
        cc += lineDir.dc;
      }
    }
  }

  return null;
}

export function checkAllWinners(game) {
  const blackLine = checkWin(game, 'B');
  const whiteLine = checkWin(game, 'W');

  if (blackLine && whiteLine) {
    const uniqueCells = new Map();
    [...blackLine, ...whiteLine].forEach((cell) => uniqueCells.set(`${cell.row},${cell.col}`, cell));
    return { winner: 'BOTH', cells: [...uniqueCells.values()] };
  }

  if (blackLine) return { winner: 'B', cells: blackLine };
  if (whiteLine) return { winner: 'W', cells: whiteLine };
  return null;
}

export function isBoardFull(game) {
  return game.board.every(Boolean);
}

function finishIfWinner(game, reason) {
  const result = checkAllWinners(game);
  if (!result) return game;

  const next = cloneGame(game);
  next.winner = result.winner;
  next.winningCells = result.cells;
  next.phase = PHASES.GAME_OVER;

  if (result.winner === 'BOTH') {
    next.log.unshift(`${reason}: 양쪽 모두 ${next.winLength}목. 동시 승리.`);
  } else {
    next.log.unshift(`${reason}: ${PLAYERS[result.winner].label} 승리. 실제 돌과 그림자로 ${next.winLength}목.`);
  }

  return next;
}

export function applyPlaceStone(game, { row, col, player = game.currentPlayer }) {
  if (game.phase !== PHASES.PLACE || game.winner) {
    throw new Error('지금은 돌을 놓을 수 없습니다.');
  }
  if (player !== game.currentPlayer) {
    throw new Error('현재 차례의 플레이어가 아닙니다.');
  }
  if (!inBounds(row, col, game.size)) {
    throw new Error('보드 밖 좌표입니다.');
  }

  const idx = indexOf(row, col, game.size);
  if (game.board[idx]) {
    throw new Error('이미 돌이 있는 칸입니다.');
  }

  const next = cloneGame(game);
  next.board[idx] = player;
  next.log.unshift(`${PLAYERS[player].label}: ${coordLabel(row, col)} 착수.`);

  const afterWinCheck = finishIfWinner(next, '착수 후');
  if (afterWinCheck.winner) return afterWinCheck;

  if (isBoardFull(afterWinCheck)) {
    const draw = cloneGame(afterWinCheck);
    draw.phase = PHASES.GAME_OVER;
    draw.winner = null;
    draw.log.unshift('무승부: 더 이상 둘 곳이 없습니다.');
    return draw;
  }

  afterWinCheck.phase = PHASES.ROTATE;
  return afterWinCheck;
}

export function applyRotateDirection(game, { steps, player = game.currentPlayer }) {
  if (game.phase !== PHASES.ROTATE || game.winner) {
    throw new Error('지금은 방향을 조정할 수 없습니다.');
  }
  if (player !== game.currentPlayer) {
    throw new Error('현재 차례의 플레이어가 아닙니다.');
  }
  if (![0, 1, 2].includes(steps)) {
    throw new Error('방향 조정은 0, 1, 2칸만 가능합니다.');
  }

  const next = cloneGame(game);
  const before = directionAt(next.directionIndex).symbol;
  next.directionIndex = (next.directionIndex + steps) % DIRECTIONS.length;
  const after = directionAt(next.directionIndex).symbol;
  const moveLabel = steps === 0 ? '유지' : `${steps}칸 시계방향`;
  next.log.unshift(`${PLAYERS[player].label}: 방향 ${moveLabel} (${before} → ${after}).`);

  const afterWinCheck = finishIfWinner(next, '방향 조정 후');
  if (afterWinCheck.winner) return afterWinCheck;

  afterWinCheck.currentPlayer = otherPlayer(player);
  afterWinCheck.phase = PHASES.PLACE;
  afterWinCheck.turn += 1;
  afterWinCheck.log.unshift(`${PLAYERS[player].label}: 턴 종료. ${PLAYERS[afterWinCheck.currentPlayer].label} 차례.`);
  return afterWinCheck;
}

export function applyAction(game, action) {
  if (action.type === 'PLACE_STONE') {
    return applyPlaceStone(game, action);
  }
  if (action.type === 'ROTATE_DIRECTION') {
    return applyRotateDirection(game, action);
  }
  if (action.type === 'RESET_GAME') {
    return createInitialGame({ size: action.size, winLength: action.winLength });
  }

  throw new Error(`알 수 없는 액션입니다: ${action.type}`);
}
