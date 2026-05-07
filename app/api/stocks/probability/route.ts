import { NextRequest, NextResponse } from "next/server";
import { fetchHistorical, normalizeTicker } from "@/lib/stocks/yahoo";
import {
  historicalFrequency,
  monteCarlo,
  logNormalProbability,
} from "@/lib/stocks/probability";
import {
  sma,
  ema,
  rsi,
  macd,
  bollinger,
  summarize,
} from "@/lib/stocks/indicators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ticker = String(body.ticker ?? "").trim();
    const days = Math.max(1, Math.min(3650, Number(body.days) || 0));
    const targetPct = Number(body.targetPct);
    const yearsBack = Math.max(1, Math.min(10, Number(body.yearsBack) || 1));
    const methods: string[] = Array.isArray(body.methods) ? body.methods : [];

    if (!ticker) {
      return NextResponse.json({ error: "กรุณาระบุ ticker" }, { status: 400 });
    }
    if (!Number.isFinite(targetPct)) {
      return NextResponse.json({ error: "เป้าหมาย % ไม่ถูกต้อง" }, { status: 400 });
    }

    const symbol = normalizeTicker(ticker);
    const bars = await fetchHistorical(ticker, yearsBack);
    if (bars.length < 30) {
      return NextResponse.json(
        { error: "ข้อมูลย้อนหลังไม่เพียงพอ หรือไม่พบ ticker" },
        { status: 404 },
      );
    }

    const closes = bars.map((b) => b.close);
    const probInput = { closes, days, targetPct };
    const probabilities: Record<string, number> = {};
    if (methods.includes("historical"))
      probabilities.historical = historicalFrequency(probInput);
    if (methods.includes("montecarlo"))
      probabilities.montecarlo = monteCarlo(probInput);
    if (methods.includes("lognormal"))
      probabilities.lognormal = logNormalProbability(probInput);

    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    const sma200 = sma(closes, 200);
    const ema20 = ema(closes, 20);
    const rsi14 = rsi(closes, 14);
    const m = macd(closes);
    const bb = bollinger(closes, 20, 2);
    const signals = summarize(closes);

    const sliceN = Math.min(250, bars.length);
    const start = bars.length - sliceN;
    const chart = bars.slice(start).map((b, i) => {
      const idx = start + i;
      return {
        date: b.date,
        close: b.close,
        sma20: sma20[idx],
        sma50: sma50[idx],
        sma200: sma200[idx],
        ema20: ema20[idx],
        rsi: rsi14[idx],
        macd: m.macd[idx],
        signal: m.signal[idx],
        histogram: m.histogram[idx],
        bbUpper: bb.upper[idx],
        bbLower: bb.lower[idx],
        bbMiddle: bb.middle[idx],
      };
    });

    const last = bars.length - 1;
    return NextResponse.json({
      symbol,
      lastPrice: closes[last],
      lastDate: bars[last].date,
      probabilities,
      signals,
      indicators: {
        sma20: sma20[last],
        sma50: sma50[last],
        sma200: sma200[last],
        ema20: ema20[last],
        rsi: rsi14[last],
        macd: m.macd[last],
        macdSignal: m.signal[last],
        macdHistogram: m.histogram[last],
        bbUpper: bb.upper[last],
        bbLower: bb.lower[last],
      },
      chart,
    });
  } catch (e) {
    console.error("probability API error:", e);
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
