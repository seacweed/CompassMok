export const DEFAULT_RATING = 1500;
export const DEFAULT_K_FACTOR = 32;

export function expectedScore(playerRating, opponentRating) {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

export function calculateElo({ playerRating, opponentRating, score, kFactor = DEFAULT_K_FACTOR }) {
  const expected = expectedScore(playerRating, opponentRating);
  return Math.round(playerRating + kFactor * (score - expected));
}

export function calculateRatingChange({ blackRating, whiteRating, result, kFactor = DEFAULT_K_FACTOR }) {
  const blackScore = result === 'B' ? 1 : result === 'W' ? 0 : 0.5;
  const whiteScore = result === 'W' ? 1 : result === 'B' ? 0 : 0.5;

  const nextBlack = calculateElo({
    playerRating: blackRating,
    opponentRating: whiteRating,
    score: blackScore,
    kFactor,
  });

  const nextWhite = calculateElo({
    playerRating: whiteRating,
    opponentRating: blackRating,
    score: whiteScore,
    kFactor,
  });

  return {
    B: {
      before: blackRating,
      after: nextBlack,
      delta: nextBlack - blackRating,
    },
    W: {
      before: whiteRating,
      after: nextWhite,
      delta: nextWhite - whiteRating,
    },
  };
}

export function resultForPlayer(result, player) {
  if (result === 'BOTH' || result === null || result === 'DRAW') return 'draw';
  return result === player ? 'win' : 'loss';
}
