"use client";

import { useState } from "react";
import StockChart, { ChartPoint } from "../stocks/StockChart";

const PRESETS: { label: string; symbol: string; desc: string }[] = [
  { label: "Gold Futures", symbol: "GC=F", desc: "ทองคำล่วงหน้า (COMEX)" },
  { label: "Spot XAU/USD", symbol: "XAUUSD=X", desc: "ราคาทอง Spot" },
  { label: "GLD ETF", symbol: "GLD", desc: "SPDR Gold Trust ETF" },
  { label: "IAU ETF", symbol: "IAU", desc: "iShares Gold Trust" },
  { label: "USD/THB", symbol: "THB=X", desc: "อัตราแลกเปลี่ยน" },
];

const METHOD_LABELS: Record<string, string> = {
  historical: "Historical Frequency",
  montecarlo: "Monte Carlo (10,000 trials)",
  lognormal: "Log-normal CDF",
};

type ApiResponse = {
  symbol: string;
  lastPrice: number;
  lastDate: string;
  probabilities: Record<string, number>;
  signals: {
    trend: string;
    rsi: string;
    rsiValue: number | null;
    macd: string;
    cross: string;
  };
  indicators: Record<string, number | null>;
  chart: ChartPoint[];
  error?: string;
};

// 1 baht-weight Thai gold = 15.244 g of 96.5% pure
// Pure ounces in 1 baht-weight = 15.244 * 0.965 / 31.1035
const BAHT_WEIGHT_OZ = (15.244 * 0.965) / 31.1035;

export default function GoldPage() {
  const [ticker, setTicker] = useState("GC=F");
  const [days, setDays] = useState("30");
  const [targetPct, setTargetPct] = useState("3");
  const [yearsBack, setYearsBack] = useState("3");
  const [methods, setMethods] = useState<string[]>([
    "historical",
    "montecarlo",
    "lognormal",
  ]);
  const [usdThb, setUsdThb] = useState("36");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const toggleMethod = (m: string) => {
    setMethods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/stocks/probability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          days: Number(days),
          targetPct: Number(targetPct),
          yearsBack: Number(yearsBack),
          methods,
        }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError(json.error ?? "เกิดข้อผิดพลาด");
      } else {
        setData(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  // ราคาทองไทย 1 บาท = USD spot/oz × 0.473 × USD/THB
  const thaiGoldPerBaht =
    data && /XAUUSD|GC=F/i.test(data.symbol)
      ? data.lastPrice * BAHT_WEIGHT_OZ * Number(usdThb)
      : null;

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              คำนวณความน่าจะเป็นของทองคำ
            </h1>
            <p className="mt-1 text-slate-600">
              วิเคราะห์โอกาสที่ราคาทองจะถึงเป้าหมาย พร้อมสัญญาณเทคนิค
            </p>
          </div>
          <nav className="flex gap-2 text-sm">
            <a
              href="/stocks"
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50"
            >
              หุ้นไทย
            </a>
            <a
              href="/gold"
              className="rounded-md border border-amber-400 bg-amber-100 px-3 py-1.5 font-medium text-amber-800"
            >
              ทองคำ
            </a>
          </nav>
        </header>

        <form
          onSubmit={onSubmit}
          className="mb-8 rounded-xl bg-white p-6 shadow ring-1 ring-amber-200"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Symbol
              </label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="เช่น GC=F"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                จำนวนวัน (1-3650)
              </label>
              <input
                type="number"
                min={1}
                max={3650}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                เป้าหมาย % (ลบ = โอกาสร่วงถึง/เกินค่านี้)
              </label>
              <input
                type="number"
                step="0.1"
                value={targetPct}
                onChange={(e) => setTargetPct(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                ปีย้อนหลัง (1-10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={yearsBack}
                onChange={(e) => setYearsBack(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                USD/THB (สำหรับแปลงราคาทองไทย)
              </label>
              <input
                type="number"
                step="0.01"
                value={usdThb}
                onChange={(e) => setUsdThb(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm font-medium text-slate-700">
              สัญลักษณ์ที่ใช้บ่อย
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.symbol}
                  type="button"
                  onClick={() => setTicker(p.symbol)}
                  title={p.desc}
                  className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm text-amber-800 hover:bg-amber-200"
                >
                  {p.label} ({p.symbol})
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm font-medium text-slate-700">
              วิธีคำนวณ (เลือกได้หลายอย่าง)
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(METHOD_LABELS).map(([k, label]) => (
                <label
                  key={k}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={methods.includes(k)}
                    onChange={() => toggleMethod(k)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading || methods.length === 0}
              className="rounded-md bg-amber-600 px-6 py-2 font-medium text-white shadow hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "กำลังคำนวณ..." : "คำนวณ"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow ring-1 ring-amber-200">
              <div className="flex flex-wrap items-baseline gap-4">
                <div className="text-2xl font-bold text-slate-900">
                  {data.symbol}
                </div>
                <div className="text-lg text-slate-600">
                  ราคาล่าสุด {data.lastPrice.toFixed(2)}
                </div>
                <div className="text-sm text-slate-500">{data.lastDate}</div>
              </div>
              {thaiGoldPerBaht != null && (
                <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
                  ประมาณการราคาทองไทย 96.5% (น้ำหนักบาท): ~
                  <span className="font-bold">
                    {thaiGoldPerBaht.toLocaleString("th-TH", {
                      maximumFractionDigits: 0,
                    })}
                  </span>{" "}
                  บาท/บาททอง
                  <span className="ml-2 text-xs text-amber-700">
                    (จาก spot × 0.473 oz × USD/THB {usdThb})
                  </span>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {Object.entries(data.probabilities).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-6 text-white shadow"
                >
                  <div className="text-sm uppercase tracking-wide opacity-90">
                    {METHOD_LABELS[k]}
                  </div>
                  <div className="mt-2 text-5xl font-bold">
                    {(v * 100).toFixed(2)}%
                  </div>
                  <div className="mt-2 text-sm opacity-90">
                    โอกาสที่ผลตอบแทน{Number(targetPct) < 0 ? " ≤ " : " ≥ "}
                    {targetPct}% ใน {days} วัน
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-white p-6 shadow ring-1 ring-amber-200">
              <h2 className="mb-3 text-lg font-semibold text-slate-800">
                สัญญาณเทคนิค
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SignalCard
                  label="แนวโน้ม (SMA50 vs 200)"
                  value={data.signals.trend}
                />
                <SignalCard
                  label="RSI(14)"
                  value={`${data.signals.rsi}${
                    data.signals.rsiValue != null
                      ? ` (${data.signals.rsiValue.toFixed(1)})`
                      : ""
                  }`}
                />
                <SignalCard label="MACD" value={data.signals.macd} />
                <SignalCard label="Cross" value={data.signals.cross} />
              </div>
            </div>

            <StockChart data={data.chart} />
          </div>
        )}

        <div className="mt-10 rounded-md bg-amber-100 p-4 text-sm text-amber-900 ring-1 ring-amber-300">
          ⚠️ คำเตือน: ข้อมูลและการคำนวณบนเว็บนี้เป็นการวิเคราะห์เชิงสถิติจากข้อมูลย้อนหลัง
          ไม่ใช่คำแนะนำการลงทุน ราคาทองไทยที่แสดงเป็นการประมาณการจาก spot
          ไม่รวมส่วนต่าง/ค่ากำเหน็จของร้านทอง
        </div>
      </div>
    </main>
  );
}

function SignalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-800">{value}</div>
    </div>
  );
}
