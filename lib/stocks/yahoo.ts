import yahooFinance from "yahoo-finance2";

type ChartQuote = {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};
type ChartArrayResult = { quotes: ChartQuote[] };

export type DailyBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export function normalizeTicker(input: string): string {
  const t = input.trim().toUpperCase();
  if (!t) return t;
  if (t.includes(".")) return t;
  return `${t}.BK`;
}

export async function fetchHistorical(
  ticker: string,
  yearsBack: number,
): Promise<DailyBar[]> {
  const symbol = normalizeTicker(ticker);
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - yearsBack);

  const result = (await yahooFinance.chart(symbol, {
    period1: start,
    period2: end,
    interval: "1d",
  })) as ChartArrayResult;

  const quotes = result.quotes ?? [];
  const bars: DailyBar[] = [];
  for (const q of quotes) {
    if (
      q.close == null ||
      q.open == null ||
      q.high == null ||
      q.low == null ||
      q.date == null
    )
      continue;
    bars.push({
      date: new Date(q.date).toISOString().slice(0, 10),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume ?? 0,
    });
  }
  return bars;
}
