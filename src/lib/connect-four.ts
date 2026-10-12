/**
 * Pure Connect Four game logic. No React, no DOM: every function takes a
 * board and returns a value or a new board, so the rules can be checked by
 * hand (or in a script) independently of the UI.
 *
 * Coordinates: `board[row][col]`, row 0 is the TOP of the board and
 * row ROWS - 1 is the bottom. Pieces "fall" to the highest row index that
 * is still empty in their column.
 */

export const COLUMNS = 7;
export const ROWS = 6;
export const WIN_LENGTH = 4;

/** Columns the computer prefers when it has no tactical move (0-based). */
export const CENTER_COLUMNS = [2, 3, 4] as const;

export type Piece = "player" | "computer";
export type Cell = Piece | null;
export type Board = readonly (readonly Cell[])[];

export type Outcome =
  | { status: "playing" }
  | { status: "won"; winner: Piece; line: readonly [number, number][] }
  | { status: "draw" };

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLUMNS }, (): Cell => null),
  );
}

/** Lowest empty row in a column, or -1 when the column is full. */
export function getDropRow(board: Board, col: number): number {
  if (col < 0 || col >= COLUMNS) return -1;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) return row;
  }
  return -1;
}

export function isColumnPlayable(board: Board, col: number): boolean {
  return getDropRow(board, col) !== -1;
}

export function getPlayableColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let col = 0; col < COLUMNS; col++) {
    if (isColumnPlayable(board, col)) cols.push(col);
  }
  return cols;
}

/**
 * Returns a new board with `piece` dropped into `col`, or `null` when the
 * column is full or out of range. The input board is never mutated.
 */
export function dropPiece(board: Board, col: number, piece: Piece): Board | null {
  const row = getDropRow(board, col);
  if (row === -1) return null;
  return board.map((cells, r) =>
    r === row ? cells.map((cell, c) => (c === col ? piece : cell)) : cells,
  );
}

export function isBoardFull(board: Board): boolean {
  return board[0].every((cell) => cell !== null);
}

const DIRECTIONS: readonly [number, number][] = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
];

/**
 * Finds four in a line for either piece. Scans every cell as a potential
 * start of a line in each of the four directions.
 */
export function findWinningLine(
  board: Board,
): { winner: Piece; line: readonly [number, number][] } | null {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      const piece = board[row][col];
      if (piece === null) continue;
      for (const [dr, dc] of DIRECTIONS) {
        const line: [number, number][] = [[row, col]];
        for (let step = 1; step < WIN_LENGTH; step++) {
          const r = row + dr * step;
          const c = col + dc * step;
          if (r < 0 || r >= ROWS || c < 0 || c >= COLUMNS) break;
          if (board[r][c] !== piece) break;
          line.push([r, c]);
        }
        if (line.length === WIN_LENGTH) return { winner: piece, line };
      }
    }
  }
  return null;
}

export function getOutcome(board: Board): Outcome {
  const win = findWinningLine(board);
  if (win) return { status: "won", winner: win.winner, line: win.line };
  if (isBoardFull(board)) return { status: "draw" };
  return { status: "playing" };
}

/** First playable column where dropping `piece` wins immediately, or -1. */
export function findWinningColumn(board: Board, piece: Piece): number {
  for (const col of getPlayableColumns(board)) {
    const next = dropPiece(board, col, piece);
    if (next && findWinningLine(next)?.winner === piece) return col;
  }
  return -1;
}

function pickRandom(columns: readonly number[], random: () => number): number {
  const index = Math.floor(random() * columns.length);
  return columns[Math.min(index, columns.length - 1)];
}

/**
 * The computer's move, following the Work Order's rule order:
 *  1. win in one move if possible;
 *  2. otherwise block the player's immediate win;
 *  3. otherwise a random non-full centre column (3–5 in 1-based numbering);
 *  4. otherwise a random valid column.
 * Returns -1 only when the board is full.
 */
export function chooseComputerColumn(
  board: Board,
  random: () => number = Math.random,
): number {
  const playable = getPlayableColumns(board);
  if (playable.length === 0) return -1;

  const winNow = findWinningColumn(board, "computer");
  if (winNow !== -1) return winNow;

  const block = findWinningColumn(board, "player");
  if (block !== -1) return block;

  const center = CENTER_COLUMNS.filter((col) => playable.includes(col));
  if (center.length > 0) return pickRandom(center, random);

  return pickRandom(playable, random);
}
