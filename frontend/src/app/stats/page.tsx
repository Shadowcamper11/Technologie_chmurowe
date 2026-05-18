'use client';

import { useEffect, useState } from 'react';

type StatsResponse = {
  totalItems: number;
  instanceId: string;
  serverTime: string;
  uptime: number;
  requestCount: number;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/stats`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error('Nie udalo sie pobrac statystyk.');
      }
      const data = (await response.json()) as StatsResponse;
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystapil nieoczekiwany blad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, []);

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-black text-slate-900">Statystyki</h1>

      <button
        type="button"
        onClick={() => {
          void fetchStats();
        }}
        className="w-fit rounded-lg border border-sky-200 bg-white px-4 py-2 font-semibold text-slate-800 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
      >
        {loading ? 'Odswiezanie...' : 'Odswiez statystyki'}
      </button>

      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-sky-100 bg-white/95 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-800">
              Liczba wszystkich produktow
            </h2>
            <p className="mt-3 text-4xl font-extrabold text-slate-900">{stats.totalItems}</p>
          </article>

          <article className="rounded-xl border border-sky-100 bg-white/95 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-800">
              Czas pracy serwera (s)
            </h2>
            <p className="mt-3 text-4xl font-extrabold text-slate-900">{stats.uptime.toFixed(0)}</p>
          </article>

          <article className="rounded-xl border border-sky-100 bg-white/95 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-800">
              Liczba obsluzonych zadan
            </h2>
            <p className="mt-3 text-4xl font-extrabold text-slate-900">{stats.requestCount}</p>
          </article>

          <article className="rounded-xl border border-sky-100 bg-white/95 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-800">
              Identyfikator instancji backendu
            </h2>
            <p className="mt-3 break-all rounded border border-sky-100 bg-sky-50/60 p-3 font-mono text-sm text-slate-900">
              {stats.instanceId}
            </p>
            <p className="mt-2 text-xs text-slate-600">Czas serwera: {new Date(stats.serverTime).toLocaleString()}</p>
          </article>
        </div>
      )}
    </section>
  );
}
