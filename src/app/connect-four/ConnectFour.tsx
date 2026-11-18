"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  COLUMNS,
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  createEmptyBoard,
  dropPiece,
  getOutcome,
  isColumnPlayable,
  type Board,
  type Cell,
  type Difficulty,
  type Outcome,
  type Piece,
} from "@/lib/connect-four";
import { chooseColumnFor } from "@/lib/connect-four-hard";
import type {
  HardRequest,
  HardResponse,
} from "@/lib/connect-four-hard.worker";
import {
  optionButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectedOptionButtonClass,
} from "@/components/button-styles";

/** Small pause before the computer moves so its turn is visible. */
const COMPUTER_DELAY_MS = 400;

/** Search budget when Hard has to run on the main thread (no Worker). */
const HARD_FALLBACK_BUDGET_MS = 300;

export type Settings = {
  difficulty: Difficulty;
  first: Piece;
};

/** The settings every page load starts with. Never read from storage. */
export const DEFAULT_SETTINGS: Settings = {
  difficulty: "medium",
  first: "player",
};

type Phase = "setup" | "playing";

type GameState = {
  board: Board;
  turn: Piece;
  outcome: Outcome;
  starter: Piece;
};

function newGame(settings: Settings): GameState {
  return {
    board: createEmptyBoard(),
    turn: settings.first,
    outcome: { status: "playing" },
    starter: settings.first,
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

const FIRST_OPTIONS: readonly Piece[] = ["player", "computer"];

const FIRST_LABEL: Record<Piece, string> = {
  player: "Player",
  computer: "Computer",
};

function cellClass(cell: Cell): string {
  return cell === null ? "bg-blue-950/80" : PIECE_COLOR[cell];
}

export default function ConnectFour() {
  // `settings` are the settings of the match in progress (or just finished);
  // `draft` is what the setup step shows and is only copied into `settings`
  // when the player starts a game.
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<Settings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<Phase>("setup");
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const [game, setGame] = useState<GameState>(() => newGame(DEFAULT_SETTINGS));

  const { board, turn, outcome, starter } = game;
  const { difficulty } = settings;
  const isPlaying = phase === "playing" && outcome.status === "playing";
  const isPlayerTurn = isPlaying && turn === "player";
  const isOver = phase === "playing" && outcome.status !== "playing";

  // One Worker for the Hard search, created on first use and terminated when
  // the page unmounts. Each request carries an id so late replies are ignored.
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // The computer moves once whenever it is its turn. Easy and Medium are
  // computed after a short delay; Hard starts thinking in the Worker right
  // away and its answer is applied once the delay has also passed. The
  // cleanup cancels everything, and the updater only applies the move to the
  // exact board it was computed for, so it can never fire twice.
  useEffect(() => {
    if (!isPlaying || turn !== "computer") return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const startedAt = Date.now();

    const apply = (col: number) => {
      if (cancelled) return;
      const next = col === -1 ? null : dropPiece(board, col, "computer");
      if (!next) return;
      setGame((current) =>
        current.board === board
          ? { ...current, board: next, turn: "player", outcome: getOutcome(next) }
          : current,
      );
    };

    const applyAfterDelay = (col: number) => {
      const wait = Math.max(0, COMPUTER_DELAY_MS - (Date.now() - startedAt));
      timers.push(setTimeout(() => apply(col), wait));
    };

    let worker: Worker | null = null;
    let onMessage: ((event: MessageEvent<HardResponse>) => void) | null = null;

    if (difficulty === "hard" && typeof Worker !== "undefined") {
      worker = workerRef.current ??= new Worker(
        new URL("../../lib/connect-four-hard.worker.ts", import.meta.url),
      );
      const id = ++requestIdRef.current;
      onMessage = (event) => {
        if (event.data.id !== id) return;
        applyAfterDelay(event.data.col);
      };
      worker.addEventListener("message", onMessage);
      const request: HardRequest = { id, board };
      worker.postMessage(request);
    } else {
      timers.push(
        setTimeout(() => {
          apply(
            chooseColumnFor(difficulty, board, {
              hard: { timeBudgetMs: HARD_FALLBACK_BUDGET_MS },
            }),
          );
        }, COMPUTER_DELAY_MS),
      );
    }

    return () => {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
      if (worker && onMessage) worker.removeEventListener("message", onMessage);
    };
  }, [board, turn, isPlaying, difficulty]);

  function handleColumnClick(col: number) {
    if (!isPlayerTurn) return;
    const next = dropPiece(board, col, "player");
    if (!next) return;
    setGame({ ...game, board: next, turn: "computer", outcome: getOutcome(next) });
  }

  function startGame() {
    setSettings(draft);
    setGame(newGame(draft));
    setConfirmingRestart(false);
    setPhase("playing");
  }

  // Ends the current match (the board is cleared) and reopens the setup
  // step with the current settings preselected.
  function openSetup() {
    setDraft(settings);
    setGame(newGame(settings));
    setConfirmingRestart(false);
    setPhase("setup");
  }

  function handleChangeSettings() {
    if (isPlaying) setConfirmingRestart(true);
    else openSetup();
  }

  const winningCells = new Set(
    outcome.status === "won" ? outcome.line.map(([r, c]) => `${r}-${c}`) : [],
  );

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 sm:py-16">
      <section className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Connect Four
        </h1>
        <p className="max-w-prose text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
          Line up four of your pieces before the computer does. Tap a column
          to drop a piece.
        </p>

        {phase === "setup" ? (
          <Setup draft={draft} onChange={setDraft} onStart={startGame} />
        ) : (
          <>
            <p
              data-testid="settings-summary"
              className="text-sm text-zinc-600 dark:text-zinc-400"
            >
              <span data-testid="current-difficulty">
                {DIFFICULTY_LABEL[difficulty]}
              </span>
              {" · "}
              <span data-testid="current-starter">
                {starter === "player" ? "You started" : "Computer started"}
              </span>
            </p>
            <Status outcome={outcome} turn={turn} />
          </>
        )}

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

        {confirmingRestart ? (
          <div
            role="group"
            aria-labelledby="restart-question"
            className="flex w-full flex-col items-center gap-3 rounded-2xl border border-zinc-300 p-4 sm:w-auto sm:p-6 dark:border-zinc-700"
          >
            <p id="restart-question" className="text-lg font-medium">
              Restart the match?
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              The current game will be lost.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={openSetup}
                className={primaryButtonClass}
              >
                Restart
              </button>
              <button
                type="button"
                onClick={() => setConfirmingRestart(false)}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
            {isOver && (
              <button
                type="button"
                onClick={openSetup}
                className={primaryButtonClass}
              >
                New game
              </button>
            )}
            {phase === "playing" && !isOver && (
              <button
                type="button"
                onClick={handleChangeSettings}
                className={secondaryButtonClass}
              >
                Change settings
              </button>
            )}
            <Link href="/" className={secondaryButtonClass}>
              Back to home
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function Setup({
  draft,
  onChange,
  onStart,
}: {
  draft: Settings;
  onChange: (next: Settings) => void;
  onStart: () => void;
}) {
  return (
    <div
      data-testid="setup"
      className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-zinc-300 p-4 sm:p-6 dark:border-zinc-700"
    >
      <OptionGroup
        label="Difficulty"
        options={DIFFICULTIES}
        value={draft.difficulty}
        getLabel={(d) => DIFFICULTY_LABEL[d]}
        onChange={(difficulty) => onChange({ ...draft, difficulty })}
      />
      <OptionGroup
        label="Who moves first"
        options={FIRST_OPTIONS}
        value={draft.first}
        getLabel={(p) => FIRST_LABEL[p]}
        onChange={(first) => onChange({ ...draft, first })}
      />
      <button type="button" onClick={onStart} className={primaryButtonClass}>
        Start game
      </button>
    </div>
  );
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  getLabel,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  getLabel: (option: T) => string;
  onChange: (option: T) => void;
}) {
  const labelId = useId();
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="flex w-full gap-2 sm:w-auto"
      >
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              data-option={option}
              onClick={() => onChange(option)}
              className={selected ? selectedOptionButtonClass : optionButtonClass}
            >
              {getLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
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
