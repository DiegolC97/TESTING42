/** Shared Tailwind classes so every page's buttons look the same. */

const base =
  "inline-flex h-12 w-full items-center justify-center rounded-full px-8 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:w-auto";

export const primaryButtonClass = `${base} bg-foreground text-background hover:bg-zinc-700 dark:hover:bg-zinc-300`;

export const secondaryButtonClass = `${base} border border-zinc-300 text-foreground hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900`;
