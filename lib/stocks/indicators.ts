export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = 0;
  for (let i = 0; i < period; i++) prev += values[i];
  prev /= period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const ch = values[i] - values[i - 1];
    if (ch >= 0) gains += ch;
    else losses -= ch;
  }
  let avgG = gains / period;
  let avgL = losses / period;
  out[period] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  for (let i = period + 1; i < values.length; i++) {
    const ch = values[i] - values[i - 1];
    const g = ch > 0 ? ch : 0;
    const l = ch < 0 ? -ch : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
}

export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signal = 9,
): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const fastE = ema(values, fast);
  const slowE = ema(values, slow);
  const macdLine: (number | null)[] = values.map((_, i) => {
    const a = fastE[i];
    const b = slowE[i];
    return a != null && b != null ? a - b : null;
  });
  const cleanIdx = macdLine.findIndex((x) => x != null);
  const cleanArr: number[] =
    cleanIdx >= 0 ? (macdLine.slice(cleanIdx) as number[]).map((v) => v ?? 0) : [];
  const sigE = ema(cleanArr, signal);
  const signalLine: (number | null)[] = new Array(values.length).fill(null);
  if (cleanIdx >= 0) {
    for (let i = 0; i < sigE.length; i++) signalLine[cleanIdx + i] = sigE[i];
  }
  const histogram: (number | null)[] = values.map((_, i) => {
    const m = macdLine[i];
    const s = signalLine[i];
    return m != null && s != null ? m - s : null;
  });
  return { macd: macdLine, signal: signalLine, histogram };
}

export function bollinger(
  values: number[],
  period = 20,
  mult = 2,
): {
  middle: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
} {
  const middle = sma(values, period);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const m = middle[i]!;
    let v = 0;
    for (let j = i - period + 1; j <= i; j++) v += (values[j] - m) ** 2;
    const sd = Math.sqrt(v / period);
    upper[i] = m + mult * sd;
    lower[i] = m - mult * sd;
  }
  return { middle, upper, lower };
}

export type Signals = {
  trend: "ขาขึ้น" | "ขาลง" | "ไม่ชัดเจน";
  rsi: "Overbought" | "Oversold" | "ปกติ";
  rsiValue: number | null;
  macd: "Bullish" | "Bearish" | "เป็นกลาง";
  cross: "Golden Cross" | "Death Cross" | "ไม่มี";
};

export function summarize(closes: number[]): Signals {
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const r = rsi(closes, 14);
  const m = macd(closes);
  const last = closes.length - 1;

  const s50 = sma50[last];
  const s200 = sma200[last];
  const trend: Signals["trend"] =
    s50 != null && s200 != null
      ? s50 > s200
        ? "ขาขึ้น"
        : s50 < s200
          ? "ขาลง"
          : "ไม่ชัดเจน"
      : "ไม่ชัดเจน";

  const rv = r[last];
  const rsiSig: Signals["rsi"] =
    rv == null ? "ปกติ" : rv >= 70 ? "Overbought" : rv <= 30 ? "Oversold" : "ปกติ";

  const ml = m.macd[last];
  const sl = m.signal[last];
  const macdSig: Signals["macd"] =
    ml != null && sl != null
      ? ml > sl
        ? "Bullish"
        : ml < sl
          ? "Bearish"
          : "เป็นกลาง"
      : "เป็นกลาง";

  let cross: Signals["cross"] = "ไม่มี";
  // detect cross within last 5 bars
  for (let i = Math.max(1, last - 5); i <= last; i++) {
    const a = sma50[i];
    const b = sma200[i];
    const a1 = sma50[i - 1];
    const b1 = sma200[i - 1];
    if (a != null && b != null && a1 != null && b1 != null) {
      if (a1 <= b1 && a > b) cross = "Golden Cross";
      else if (a1 >= b1 && a < b) cross = "Death Cross";
    }
  }

  return { trend, rsi: rsiSig, rsiValue: rv ?? null, macd: macdSig, cross };
}
