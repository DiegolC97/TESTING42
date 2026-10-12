import Link from "next/link";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/button-styles";

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
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Link href="/counter" className={primaryButtonClass}>
            Go to the counter
          </Link>
          <Link href="/connect-four" className={secondaryButtonClass}>
            Play Connect Four
          </Link>
        </div>
      </section>
    </main>
  );
}
