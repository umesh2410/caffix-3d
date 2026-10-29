# CAFFIX — 3D storefront

Next.js 16 (App Router) rebuild of [thecaffix.in](https://www.thecaffix.in) with a scroll-driven 3D product story.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

Copy `.env.example` to `.env.local` to enable payments, cash on delivery and newsletter sign-ups.

## What's where

| Path | What it does |
| --- | --- |
| `src/lib/catalog.ts` | All 18 products, 5 flavours and brand details, copied from the live store |
| `src/lib/pricing.ts` | Prices, ₹40 delivery under ₹349, CHILL10 / CHILL20 coupons (shared by browser and server) |
| `src/lib/info.ts` | Terms, privacy, refund, shipping, FAQ, about, contact, bulk orders, blog summaries |
| `src/components/home/Intro*` | One-per-session intro (coffee fills the screen, doors open) |
| `src/components/home/JarScene.tsx` | Hero 3D jar: entrance, exploded "what's inside" view, flavour range, label swaps |
| `src/components/home/BrewLabScene.tsx` | 3D brew lab: sachet pour, milk, frother vortex, foam, ice |
| `src/components/home/Stage.tsx` | Hero, story chapters and the flavour selector around the jar scene |
| `src/app/api/checkout/*` | Razorpay order + signature verification, cash-on-delivery, order webhook |
| `public/images`, `public/image` | Brand photography copied from thecaffix.in |

## Before launch

- Add Razorpay keys and an `ORDER_WEBHOOK_URL` (orders are not stored anywhere else yet).
- Accounts / sign-in and Delhivery shipment booking from the old site are not connected.
- Confirm ratings, review counts, "12,000+" and the nutrition values with the brand — they were copied as-is.
- Jar servings disagree on the old site (FAQ: 5 glasses per jar; combos: 25 per jar). Only the FAQ figure is shown.
- The 3D jar label is drawn in code from the real logo; swap in the printed label artwork when available.
