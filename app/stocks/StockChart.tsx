"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";

export type ChartPoint = {
  date: string;
  close: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema20: number | null;
  rsi: number | null;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
  bbUpper: number | null;
  bbLower: number | null;
  bbMiddle: number | null;
};

export default function StockChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-4 shadow ring-1 ring-slate-200">
        <h3 className="mb-2 font-semibold text-slate-700">
          ราคา + Bollinger Bands + SMA
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={30} />
            <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="bbUpper"
              stroke="#94a3b8"
              dot={false}
              name="BB Upper"
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="bbLower"
              stroke="#94a3b8"
              dot={false}
              name="BB Lower"
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#0ea5e9"
              dot={false}
              name="ราคา"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="sma20"
              stroke="#f59e0b"
              dot={false}
              name="SMA20"
            />
            <Line
              type="monotone"
              dataKey="sma50"
              stroke="#10b981"
              dot={false}
              name="SMA50"
            />
            <Line
              type="monotone"
              dataKey="sma200"
              stroke="#ef4444"
              dot={false}
              name="SMA200"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg bg-white p-4 shadow ring-1 ring-slate-200">
        <h3 className="mb-2 font-semibold text-slate-700">RSI (14)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={30} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#6366f1"
              dot={false}
              name="RSI"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg bg-white p-4 shadow ring-1 ring-slate-200">
        <h3 className="mb-2 font-semibold text-slate-700">MACD (12,26,9)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={30} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="histogram" fill="#cbd5e1" name="Histogram" />
            <Line
              type="monotone"
              dataKey="macd"
              stroke="#0ea5e9"
              dot={false}
              name="MACD"
            />
            <Line
              type="monotone"
              dataKey="signal"
              stroke="#f97316"
              dot={false}
              name="Signal"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
