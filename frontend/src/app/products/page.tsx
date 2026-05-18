'use client';

import { FormEvent, useEffect, useState } from 'react';

type Item = {
  id: number;
  name: string;
  price: number;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export default function ProductsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/items`);
      if (!response.ok) {
        throw new Error('Nie udalo sie pobrac listy produktow.');
      }
      const data = (await response.json()) as Item[];
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystapil nieoczekiwany blad.');
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          price: Number(price),
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || 'Nie udalo sie dodac produktu.');
      }

      setName('');
      setPrice('');
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystapil nieoczekiwany blad.');
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-black text-slate-900">Lista produktow</h1>

      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-xl border border-sky-200 bg-white/95 p-4 shadow-sm sm:grid-cols-[1fr_180px_auto]"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nazwa produktu"
          className="rounded border border-sky-200 bg-sky-50/40 px-3 py-2 text-slate-900 placeholder:text-slate-500"
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Cena"
          className="rounded border border-sky-200 bg-sky-50/40 px-3 py-2 text-slate-900 placeholder:text-slate-500"
          required
        />
        <button
          type="submit"
          className="rounded bg-sky-700 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-sky-800"
        >
          Dodaj
        </button>
      </form>

      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="grid gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-sky-100 bg-white/95 p-4 shadow-sm"
          >
            <h2 className="font-semibold text-slate-900">{item.name}</h2>
            <p className="font-mono text-sky-900">{item.price.toFixed(2)} PLN</p>
          </article>
        ))}
      </div>
    </section>
  );
}
