/**
 * Tic-tac-toe, with an opponent that plays perfectly.
 *
 * The game is trivial; the interesting part is that "perfect" is a claim you
 * can actually verify. The test suite plays *every* game a human could play
 * against this engine — both as X and as O — and asserts it never loses. That's
 * 255,168 possible games narrowed to a few thousand once one side is fixed to a
 * single best reply, and it either holds or it doesn't.
 *
 * Two details do most of the work:
 *
 *  - **Depth is in the score.** A win is `10 - depth`, a loss `depth - 10`. Miss
 *    that and every winning line looks equal, so the engine dawdles — it will
 *    take a win in three when one is available now, handing you moves you
 *    shouldn't have had. It also stops distinguishing "block this immediately"
 *    from "lose in five".
 *  - **Easy has to be genuinely beatable.** A perfect engine draws every game
 *    against competent play, and a game you cannot win is a game nobody plays
 *    twice. Easy moves at random; medium is perfect with a one-in-three lapse.
 *
 * Pure and DOM-free, and the RNG is injected so tests can pin it.
 */

export type Player = 'X' | 'O';
export type Cell = Player | null;
/** Row-major, indices 0-8. */
export type Board = Cell[];

export const EMPTY_BOARD: Board = Array(9).fill(null);

export const LINES: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export type Outcome = {
  winner: Player | null;
  /** The three indices that won, for highlighting. */
  line: readonly number[] | null;
  draw: boolean;
};

export const evaluate = (board: Board): Outcome => {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line, draw: false };
    }
  }
  return { winner: null, line: null, draw: board.every((c) => c !== null) };
};

export const legalMoves = (board: Board): number[] => {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) if (!board[i]) out.push(i);
  return out;
};

export const applyMove = (board: Board, index: number, player: Player): Board => {
  const next = board.slice();
  next[index] = player;
  return next;
};

export const other = (p: Player): Player => (p === 'X' ? 'O' : 'X');

/** Whose turn it is, derived from the board rather than tracked separately. */
export const turnOf = (board: Board): Player => {
  const x = board.filter((c) => c === 'X').length;
  const o = board.filter((c) => c === 'O').length;
  return x <= o ? 'X' : 'O';
};

/**
 * Negamax with alpha-beta.
 *
 * 3^9 states means plain minimax would be fine, but the pruning is four lines
 * and takes the worst case from ~550k nodes to ~20k, which matters when the UI
 * calls this synchronously on the click that triggers the reply.
 */
const search = (board: Board, me: Player, turn: Player, depth: number, alpha: number, beta: number): number => {
  const outcome = evaluate(board);
  if (outcome.winner) return outcome.winner === me ? 10 - depth : depth - 10;
  if (outcome.draw) return 0;

  const maximising = turn === me;
  let best = maximising ? -Infinity : Infinity;

  for (const move of legalMoves(board)) {
    const value = search(applyMove(board, move, turn), me, other(turn), depth + 1, alpha, beta);

    if (maximising) {
      if (value > best) best = value;
      if (best > alpha) alpha = best;
    } else {
      if (value < best) best = value;
      if (best < beta) beta = best;
    }
    if (alpha >= beta) break;
  }

  return best;
};

/**
 * Every move that ties for the best score.
 *
 * Returning the whole set rather than the first one lets the UI vary its play
 * without weakening it — an engine that opens in the same corner every single
 * game is perfect and also tedious.
 */
export const bestMoves = (board: Board, me: Player): number[] => {
  const moves = legalMoves(board);
  if (!moves.length) return [];

  let best = -Infinity;
  let tied: number[] = [];

  for (const move of moves) {
    const value = search(applyMove(board, move, me), me, other(me), 1, -Infinity, Infinity);
    if (value > best) {
      best = value;
      tied = [move];
    } else if (value === best) {
      tied.push(move);
    }
  }

  return tied;
};

/** The single best move. Deterministic — lowest index among the ties. */
export const bestMove = (board: Board, me: Player): number => bestMoves(board, me)[0] ?? -1;

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTIES: Array<{ id: Difficulty; label: string; note: string }> = [
  { id: 'easy', label: 'Easy', note: 'Moves at random. You should win.' },
  { id: 'medium', label: 'Medium', note: 'Plays perfectly, but slips one move in three.' },
  { id: 'hard', label: 'Hard', note: 'Solved. The best you can get is a draw.' },
];

/** Chance the medium engine throws a move away. Tuned to lose sometimes, not often. */
const MEDIUM_LAPSE = 1 / 3;

export const chooseMove = (
  board: Board,
  me: Player,
  difficulty: Difficulty,
  rng: () => number = Math.random,
): number => {
  const moves = legalMoves(board);
  if (!moves.length) return -1;

  const random = () => moves[Math.floor(rng() * moves.length)] ?? moves[0];

  if (difficulty === 'easy') return random();
  if (difficulty === 'medium' && rng() < MEDIUM_LAPSE) return random();

  // Pick among the tied-best rather than always the first, so repeat games
  // don't replay move for move.
  const tied = bestMoves(board, me);
  return tied[Math.floor(rng() * tied.length)] ?? tied[0];
};
