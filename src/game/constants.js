export const DIRECTIONS = [
  { symbol: '↑', dr: -1, dc: 0, name: '위' },
  { symbol: '↗', dr: -1, dc: 1, name: '오른쪽 위' },
  { symbol: '→', dr: 0, dc: 1, name: '오른쪽' },
  { symbol: '↘', dr: 1, dc: 1, name: '오른쪽 아래' },
  { symbol: '↓', dr: 1, dc: 0, name: '아래' },
  { symbol: '↙', dr: 1, dc: -1, name: '왼쪽 아래' },
  { symbol: '←', dr: 0, dc: -1, name: '왼쪽' },
  { symbol: '↖', dr: -1, dc: -1, name: '왼쪽 위' },
];

export const PLAYERS = {
  B: { key: 'B', label: '흑' },
  W: { key: 'W', label: '백' },
};

export const PHASES = {
  PLACE: 'place',
  ROTATE: 'rotate',
  GAME_OVER: 'gameOver',
};

export const DEFAULT_SIZE = 13;
export const DEFAULT_WIN_LENGTH = 7;
export const DEFAULT_DIRECTION_INDEX = 4; // ↓
