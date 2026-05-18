import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-7 px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-800">
        Product Dashboard
      </p>
      <h1 className="text-4xl font-black text-slate-900 sm:text-5xl">
        Zarzadzaj produktami i monitoruj statystyki API w jednym miejscu.
      </h1>
      <p className="max-w-2xl text-lg leading-relaxed text-slate-700">
        Ta aplikacja posiada routing po stronie klienta, liste produktow z formularzem
        dodawania oraz widok statystyk backendu.
      </p>

      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/products"
          className="rounded-lg bg-sky-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-800"
        >
          Przejdz do listy produktow
        </Link>
        <Link
          href="/stats"
          className="rounded-lg border border-sky-200 bg-white px-5 py-3 font-semibold text-slate-800 shadow-sm transition hover:bg-sky-50"
        >
          Zobacz statystyki
        </Link>
      </div>
    </section>
  );
}
