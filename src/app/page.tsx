import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16 sm:px-8">
      <section className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Welcome to Testing42
        </h1>
        <p className="max-w-prose text-lg text-zinc-600 sm:text-xl dark:text-zinc-400">
          A small, predictable web app for testing the platform.
        </p>
        <Link
          href="/counter"
          className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-base font-medium text-background transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:hover:bg-zinc-300"
        >
          Go to the counter
        </Link>
      </section>
    </main>
  );
}
