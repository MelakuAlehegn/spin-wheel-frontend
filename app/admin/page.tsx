"use client";

import { useEffect, useState } from "react";

type PrizeStats = {
  name: string;
  total: number;
  remaining: number;
  weight: number;
};

type InventoryStats = {
  prizes: PrizeStats[];
  total_spins: number;
  total_wins: number;
  all_prizes_gone: boolean;
};

export default function AdminPage() {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      // Use relative path so Next.js rewrites proxy to the correct backend (local or deployed)
      const res = await fetch("/api/admin/inventory");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (e) {
      setError("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  async function resetFromUI() {
    const ok = window.confirm(
      "This will delete all spins and sessions and restore inventory. Are you sure?"
    );
    if (!ok) return;
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: {
          "X-Admin-Secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "",
        },
      });
      if (!res.ok) throw new Error("Reset failed");
      await fetchStats();
    } catch (e) {
      setError("Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb]">
        <div className="rounded-lg bg-white px-6 py-4 shadow">
          <p className="text-[#079964] font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb]">
        <div className="rounded-lg bg-white px-6 py-6 shadow text-center">
          <p className="text-red-600 font-medium">{error || "No data"}</p>
          <button
            onClick={fetchStats}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-[#079964] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#057852]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] py-10 px-4">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-2xl bg-gradient-to-r from-[#079964] to-[#057852] px-8 py-6 text-white shadow-lg">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Spin Wheel Admin</h1>
              <p className="text-sm text-[#e8fdf3]">
                Monitor inventory, spins and event health in real time.
              </p>
            </div>
            <button
              onClick={fetchStats}
              className="inline-flex items-center rounded-md bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
            >
              Refresh now
            </button>
          </div>
        </header>

        <section className="mb-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e8fdf3] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#079964]/70">Total Spins</p>
            <p className="mt-2 text-3xl font-semibold text-[#079964]">
              {stats.total_spins}
            </p>
          </div>
          <div className="rounded-xl border border-[#e8fdf3] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#079964]/70">Total Wins</p>
            <p className="mt-2 text-3xl font-semibold text-[#079964]">
              {stats.total_wins}
            </p>
          </div>
          <div className="rounded-xl border border-[#e8fdf3] bg-[#e8fdf3] p-5 shadow-sm">
            <p className="text-sm font-medium text-[#079964]/70">Status</p>
            <p className="mt-2 text-2xl font-semibold">
              {stats.all_prizes_gone ? (
                <span className="text-red-600">All prizes gone</span>
              ) : (
                <span className="text-[#079964]">Active</span>
              )}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e8fdf3] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#02281c]">Inventory Breakdown</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#e8fdf3] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#079964]">
                Auto-refresh • 5s
              </span>
              <button
                onClick={resetFromUI}
                className="rounded-md bg-[#079964] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#057852]"
              >
                Reset event
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8fdf3] text-left text-xs uppercase tracking-wide text-[#079964]/70">
                  <th className="py-3">Prize</th>
                  <th className="py-3 text-right">Total</th>
                  <th className="py-3 text-right">Remaining</th>
                  <th className="py-3 text-right">Weight</th>
                  <th className="py-3 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f6f4] text-[#02281c]">
                {stats.prizes.map((prize) => {
                  const percentage = prize.total > 0
                    ? ((prize.total - prize.remaining) / prize.total) * 100
                    : 0;
                  const remainingClass = prize.remaining === 0 ? "text-red-600 font-semibold" : "";
                  return (
                    <tr key={prize.name} className="hover:bg-[#f9fafb]">
                      <td className="py-3 font-medium">{prize.name}</td>
                      <td className="py-3 text-right">{prize.total}</td>
                      <td className={`py-3 text-right ${remainingClass}`}>{prize.remaining}</td>
                      <td className="py-3 text-right">{prize.weight}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-[#e8fdf3]">
                            <div
                              className="h-full rounded-full bg-[#079964] transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-12 text-right text-xs text-[#02281c]/70">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-[#02281c]/60">
          Dashboard updates every 5 seconds. Trigger a manual refresh anytime.
        </footer>
      </div>
    </div>
  );
}

