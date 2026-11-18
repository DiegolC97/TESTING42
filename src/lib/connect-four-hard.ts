/**
 * Hard computer opponent for Connect Four: negamax with alpha-beta pruning
 * and iterative deepening under a time budget. Framework-free, deterministic
 * (no randomness), so a position can be checked by hand with
 * `node src/lib/connect-four-hard.ts`-style scripts.
 *
 * Guarantees:
 *  - never misses a win it can play right away;
 *  - never fails to block the player's immediate win;
 * both are checked explicitly before any search, so they hold regardless of
 * how deep the search got within the budget.
 */

import {
  COLUMNS,
  ROWS,
  WIN_LENGTH,
  chooseEasyColumn,
  chooseMediumColumn,
  findWinningColumn,
  getPlayableColumns,
  type Board,
  type Difficulty,
  type Piece,
} from "./connect-four";

export type HardOptions = {
  /** Wall-clock budget for the search. Default 700 ms. */
  timeBudgetMs?: number;
  /** Upper bound on search depth in plies. Default 14. */
  maxDepth?: number;
  /** Clock, injectable for tests. */
  now?: () => number;
};

export const DEFAULT_TIME_BUDGET_MS = 700;
export const DEFAULT_MAX_DEPTH = 14;

/** Columns in the order the search tries them: centre first. */
const MOVE_ORDER = [3, 2, 4, 1, 5, 0, 6] as const;

const CENTER_COLUMN = Math.floor(COLUMNS / 2);

/** Score of a certain win; shrinks per ply so quicker wins score higher. */
const WIN_SCORE = 1_000_000;

// Internal representation: a flat Int8Array indexed by row * COLUMNS + col
// (row 0 = top, as in the public Board), 1 = side to move's piece ("us"),
// -1 = opponent, 0 = empty. `heights[col]` is the number of pieces in a
// column, so the next piece lands at row ROWS - 1 - heights[col].

const EMPTY = 0;
type Side = 1 | -1;

/** Every 4-cell window on the board, as flat indices. Computed once. */
const WINDOWS: readonly (readonly number[])[] = (() => {
  const out: number[][] = [];
  const dirs: readonly [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      for (const [dr, dc] of dirs) {
        const endRow = row + dr * (WIN_LENGTH - 1);
        const endCol = col + dc * (WIN_LENGTH - 1);
        if (endRow < 0 || endRow >= ROWS || endCol < 0 || endCol >= COLUMNS) {
          continue;
        }
        const window: number[] = [];
        for (let step = 0; step < WIN_LENGTH; step++) {
          window.push((row + dr * step) * COLUMNS + (col + dc * step));
        }
        out.push(window);
      }
    }
  }
  return out;
})();

/** For each cell, the windows that contain it (used for fast win checks). */
const WINDOWS_BY_CELL: readonly (readonly (readonly number[])[])[] = (() => {
  const out: (readonly number[])[][] = Array.from(
    { length: ROWS * COLUMNS },
    () => [],
  );
  for (const window of WINDOWS) {
    for (const cell of window) out[cell].push(window);
  }
  return out;
})();

class Position {
  readonly cells = new Int8Array(ROWS * COLUMNS);
  readonly heights = new Int8Array(COLUMNS);
  moves = 0;

  static fromBoard(board: Board, us: Piece): Position {
    const pos = new Position();
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        const cell = board[row][col];
        if (cell === null) continue;
        pos.cells[row * COLUMNS + col] = cell === us ? 1 : -1;
        pos.heights[col]++;
        pos.moves++;
      }
    }
    return pos;
  }

  canPlay(col: number): boolean {
    return this.heights[col] < ROWS;
  }

  /** Drops a piece and returns the flat index it landed on. */
  play(col: number, side: Side): number {
    const index = (ROWS - 1 - this.heights[col]) * COLUMNS + col;
    this.cells[index] = side;
    this.heights[col]++;
    this.moves++;
    return index;
  }

  undo(col: number): void {
    this.heights[col]--;
    this.moves--;
    this.cells[(ROWS - 1 - this.heights[col]) * COLUMNS + col] = EMPTY;
  }

  /** True when the piece just placed at `index` completes four in a line. */
  isWinAt(index: number, side: Side): boolean {
    for (const window of WINDOWS_BY_CELL[index]) {
      if (
        this.cells[window[0]] === side &&
        this.cells[window[1]] === side &&
        this.cells[window[2]] === side &&
        this.cells[window[3]] === side
      ) {
        return true;
      }
    }
    return false;
  }

  isFull(): boolean {
    return this.moves >= ROWS * COLUMNS;
  }

  /** Static evaluation from `side`'s point of view. */
  evaluate(side: Side): number {
    let score = 0;
    for (const window of WINDOWS) {
      let ours = 0;
      let theirs = 0;
      for (const cell of window) {
        const value = this.cells[cell];
        if (value === side) ours++;
        else if (value !== EMPTY) theirs++;
      }
      if (ours > 0 && theirs > 0) continue; // dead window
      if (ours === 3) score += 50;
      else if (ours === 2) score += 10;
      else if (theirs === 3) score -= 60;
      else if (theirs === 2) score -= 10;
    }
    for (let row = 0; row < ROWS; row++) {
      const value = this.cells[row * COLUMNS + CENTER_COLUMN];
      if (value === side) score += 3;
      else if (value !== EMPTY) score -= 3;
    }
    return score;
  }
}

class SearchTimeout extends Error {}

class Searcher {
  nodes = 0;
  private readonly pos: Position;
  private readonly deadline: number;
  private readonly now: () => number;

  constructor(pos: Position, deadline: number, now: () => number) {
    this.pos = pos;
    this.deadline = deadline;
    this.now = now;
  }

  /**
   * Negamax with alpha-beta. `side` is the side to move; `ply` is the depth
   * already searched (used to prefer faster wins); `depth` is how much is
   * left. Throws SearchTimeout when the clock runs out.
   */
  negamax(
    side: Side,
    depth: number,
    ply: number,
    alpha: number,
    beta: number,
  ): number {
    this.nodes++;
    if ((this.nodes & 1023) === 0 && this.now() >= this.deadline) {
      throw new SearchTimeout();
    }
    if (this.pos.isFull()) return 0;
    if (depth === 0) return this.pos.evaluate(side);

    let best = -Infinity;
    for (const col of MOVE_ORDER) {
      if (!this.pos.canPlay(col)) continue;
      const index = this.pos.play(col, side);
      let value: number;
      if (this.pos.isWinAt(index, side)) {
        value = WIN_SCORE - ply;
      } else {
        value = -this.negamax(
          (-side) as Side,
          depth - 1,
          ply + 1,
          -beta,
          -alpha,
        );
      }
      this.pos.undo(col);
      if (value > best) best = value;
      if (value > alpha) alpha = value;
      if (alpha >= beta) break;
    }
    return best;
  }

  /** Best root move at exactly `depth` plies. Throws SearchTimeout. */
  rootSearch(depth: number): number {
    let bestCol = -1;
    let bestValue = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    for (const col of MOVE_ORDER) {
      if (!this.pos.canPlay(col)) continue;
      const index = this.pos.play(col, 1);
      let value: number;
      if (this.pos.isWinAt(index, 1)) {
        value = WIN_SCORE;
      } else {
        value = -this.negamax(-1, depth - 1, 1, -beta, -alpha);
      }
      this.pos.undo(col);
      if (value > bestValue) {
        bestValue = value;
        bestCol = col;
      }
      if (value > alpha) alpha = value;
    }
    return bestCol;
  }
}

function defaultNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Hard: the column the computer plays. Returns -1 only when the board is
 * full. Deterministic for a given board and budget outcome.
 */
export function chooseHardColumn(
  board: Board,
  options: HardOptions = {},
): number {
  const playable = getPlayableColumns(board);
  if (playable.length === 0) return -1;

  // Safety belt: these two rules hold no matter how far the search gets.
  const winNow = findWinningColumn(board, "computer");
  if (winNow !== -1) return winNow;
  const block = findWinningColumn(board, "player");
  if (block !== -1) return block;

  const now = options.now ?? defaultNow;
  const budget = options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const pos = Position.fromBoard(board, "computer");
  const searcher = new Searcher(pos, now() + budget, now);

  // Iterative deepening: keep the move from the last depth that finished.
  let best = MOVE_ORDER.find((col) => playable.includes(col)) ?? playable[0];
  const remaining = ROWS * COLUMNS - pos.moves;
  for (let depth = 1; depth <= Math.min(maxDepth, remaining); depth++) {
    try {
      best = searcher.rootSearch(depth);
    } catch (error) {
      if (error instanceof SearchTimeout) break;
      throw error;
    }
  }
  return best;
}

/** The computer's column for the given difficulty. -1 only when full. */
export function chooseColumnFor(
  difficulty: Difficulty,
  board: Board,
  options: { random?: () => number; hard?: HardOptions } = {},
): number {
  switch (difficulty) {
    case "easy":
      return chooseEasyColumn(board, options.random);
    case "medium":
      return chooseMediumColumn(board, options.random);
    case "hard":
      return chooseHardColumn(board, options.hard);
  }
}
