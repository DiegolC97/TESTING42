"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COLUMNS,
  chooseComputerColumn,
  createEmptyBoard,
  dropPiece,
  getOutcome,
  isColumnPlayable,
  type Board,
  type Cell,
  type Outcome,
  type Piece,
} from "@/lib/connect-four";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/button-styles";

/** Small pause before the computer moves so its turn is visible. */
const COMPUTER_DELAY_MS = 400;

type GameState = {
  board: Board;
  turn: Piece;
  outcome: Outcome;
};

function newGame(): GameState {
  return {
    board: createEmptyBoard(),
    turn: "player",
    outcome: { status: "playing" },
  };
}

const PIECE_LABEL: Record<Piece, string> = {
  player: "You",
  computer: "Computer",
};

const PIECE_COLOR: Record<Piece, string> = {
  player: "bg-red-500",
  computer: "bg-yellow-400",
};

function cellClass(cell: Cell): string {
  return cell === null ? "bg-blue-950/80" : PIECE_COLOR[cell];
}

export default function ConnectFour() {
  const [game, setGame] = useState<GameState>(newGame);
  const { board, turn, outcome } = game;
  const isPlaying = outcome.status === "playing";
  const isPlayerTurn = isPlaying && turn === "player";

  // The computer moves once, after a short delay, whenever it is its turn.
  // The cleanup cancels the pending move if the game state changes first
  // (for example "New game" is clicked), and the updater only applies the
  // move to the exact board it was computed for, so it can never fire twice.
  useEffect(() => {
    if (!isPlaying || turn !== "computer") return;
    const timer = setTimeout(() => {
      const col = chooseComputerColumn(board);
      const next = col === -1 ? null : dropPiece(board, col, "computer");
      if (!next) return;
      setGame((current) =>
        current.board === board
          ? { board: next, turn: "player", outcome: getOutcome(next) }
          : current,
      );
    }, COMPUTER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [board, turn, isPlaying]);

  function handleColumnClick(col: number) {
    if (!isPlayerTurn) return;
    const next = dropPiece(board, col, "player");
    if (!next) return;
    setGame({ board: next, turn: "computer", outcome: getOutcome(next) });
  }

  const winningCells = new Set(
    outcome.status === "won" ? outcome.line.map(([r, c]) => `${r}-${c}`) : [],
  );

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-8 sm:py-16">
      <section className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Connect Four
        </h1>
        <p className="max-w-prose text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
          Line up four of your pieces before the computer does. Tap a column
          to drop a piece.
        </p>

        <Status outcome={outcome} turn={turn} />

        <div
          role="grid"
          aria-label="Connect Four board"
          className="grid w-full max-w-sm grid-cols-7 gap-1 rounded-2xl bg-blue-700 p-2 shadow-lg sm:gap-2 sm:p-3"
        >
          {Array.from({ length: COLUMNS }, (_, col) => {
            const playable = isPlayerTurn && isColumnPlayable(board, col);
            return (
              <button
                key={col}
                type="button"
                role="gridcell"
                aria-label={`Drop a piece in column ${col + 1}`}
                aria-disabled={!playable}
                data-column={col}
                onClick={() => handleColumnClick(col)}
                className={`flex flex-col gap-1 rounded-lg p-0.5 transition-colors sm:gap-2 ${
                  playable
                    ? "cursor-pointer hover:bg-blue-600 focus-visible:bg-blue-600"
                    : "cursor-default"
                }`}
              >
                {board.map((row, r) => {
                  const cell = row[col];
                  const isWinning = winningCells.has(`${r}-${col}`);
                  return (
                    <span
                      key={r}
                      data-row={r}
                      data-col={col}
                      data-piece={cell ?? "empty"}
                      className={`block aspect-square w-full rounded-full ${cellClass(cell)} ${
                        isWinning ? "ring-4 ring-white" : ""
                      }`}
                    />
                  );
                })}
              </button>
            );
          })}
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={() => setGame(newGame())}
            className={primaryButtonClass}
          >
            New game
          </button>
          <Link href="/" className={secondaryButtonClass}>
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}

function Status({ outcome, turn }: { outcome: Outcome; turn: Piece }) {
  let text: string;
  let swatch: Piece | null = null;

  if (outcome.status === "won") {
    text = outcome.winner === "player" ? "You won!" : "The computer won.";
    swatch = outcome.winner;
  } else if (outcome.status === "draw") {
    text = "It's a draw.";
  } else if (turn === "player") {
    text = "Your turn";
    swatch = "player";
  } else {
    text = "Computer is thinking…";
    swatch = "computer";
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-lg font-medium sm:text-xl"
    >
      {swatch && (
        <span
          aria-hidden="true"
          className={`inline-block size-4 rounded-full ${PIECE_COLOR[swatch]}`}
        />
      )}
      {swatch && outcome.status === "playing" && (
        <span className="sr-only">{PIECE_LABEL[swatch]}:</span>
      )}
      {text}
    </p>
  );
}
