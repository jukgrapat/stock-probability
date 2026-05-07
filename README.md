# คำนวณความน่าจะเป็นของหุ้นไทย

เว็บแอป Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
สำหรับคำนวณความน่าจะเป็นที่ราคาหุ้นไทยจะถึงเป้าหมายที่กำหนด
พร้อมแสดงสัญญาณเทคนิคและกราฟ

## ฟีเจอร์

- รับ ticker หุ้นไทย (เติม `.BK` ให้อัตโนมัติ) และปุ่มลัดหุ้นยอดนิยม 10 ตัว
- คำนวณความน่าจะเป็น 3 วิธี (เลือกพร้อมกันได้):
  - Historical frequency (rolling window)
  - Monte Carlo (10,000 trials, Box-Muller)
  - Log-normal CDF
- Technical indicators: SMA 20/50/200, EMA20, RSI(14), MACD(12,26,9), Bollinger Bands(20,2)
- สรุปสัญญาณ: trend, RSI overbought/oversold, MACD bullish/bearish, golden/death cross
- กราฟ recharts 3 ส่วน: ราคา+BB+SMA, RSI, MACD

## การใช้งาน

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 (จะ redirect ไป `/stocks`)

## Build

```bash
npm run build
npm start
```

## Deploy บน Vercel

1. Push repo ขึ้น GitHub
2. Import โปรเจกต์ที่ https://vercel.com/new
3. กด Deploy ได้ทันที (ไม่ต้องตั้ง environment variables)

API route `/api/stocks/probability` ใช้ `runtime = 'nodejs'` และ `dynamic = 'force-dynamic'`

## โครงสร้างไฟล์

- `app/stocks/page.tsx` — หน้าฟอร์มและแสดงผล
- `app/stocks/StockChart.tsx` — กราฟ (client component)
- `app/api/stocks/probability/route.ts` — API คำนวณ
- `lib/stocks/yahoo.ts` — ดึงข้อมูลจาก Yahoo Finance
- `lib/stocks/probability.ts` — สูตรคำนวณ probability
- `lib/stocks/indicators.ts` — สูตร technical indicators

## ⚠️ Disclaimer

ข้อมูลและการคำนวณบนเว็บนี้เป็นการวิเคราะห์เชิงสถิติเท่านั้น
ไม่ใช่คำแนะนำการลงทุน การลงทุนมีความเสี่ยง
