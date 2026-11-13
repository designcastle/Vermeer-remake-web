# Vermeer (1887–1914) — Web Remake

A modernized, browser-based TypeScript + Vite remake of the 1987 Commodore 64 economic and art-trading strategy game **Vermeer**, built from a 6502 disassembly of the original mechanics.

**Play Live:** https://designcastle.github.io/Vermeer-remake-web/

---

## Game Instructions

### Objective
Acquire the target number of **authentic** Old Master paintings (and reach the net-worth goal) before the final reckoning, while competing against three AI rivals (**Gerd**, **Kurt**, and **Baron von Stahl**). Falling below **−12,000 G** net worth with negative cash results in bankruptcy.

### Core Loop
1. **Travel & Currency Exchange (`1`–`4` or click cities on the map):**
   - **London** (`1.00×`): Low-interest bank (`1.8%/mo`) and Royal Academy appraiser.
   - **Paris** (`0.85×`): Lowest exchange index (cheapest art purchases) and sharpest Louvre appraiser.
   - **Berlin** (`1.15×`): Home of the **Plantation Agency** (hire worker brigades and buy hardy seeds) and strong crop prices.
   - **New York** (`1.40×`): Highest crop sale prices and largest credit limit (`90%` of net worth), reached via 6-day transatlantic steamship (`1,800 G`).
2. **Colonial Plantations & Commodity Trade (`Estates` & `Trade` tabs):**
   - Buy acres of **Tea**, **Coffee**, **Tobacco**, and **Cocoa** in Berlin, hire workers (`1 brigade/acre` for full yield), and upgrade to **Hardy Seeds** to reduce weather/pest losses by 70%.
   - Harvests arrive monthly (peaking during each crop's optimal harvest months). Sell stock in high-index cities like Berlin or New York.
3. **Live Auctions & Forgeries (`Enter Salon`):**
   - Bid against AI rivals before the gavel falls three times (*Going once… Going twice… Sold!*).
   - Beware of **forgeries**—unverified paintings may be fakes worth `0 G` at the final reckoning. Have paintings **appraised** by experts in Paris or London, and **loan authentic works to museums** for steady monthly royalties.

### Controls & Shortcuts
- `1`–`4`: Inspect London / Paris / Berlin / New York
- `Space`: Pause / Resume simulation clock
- `B` / `E` / `M` / `P`: Switch between City & Travel / Estates / Trade / Collection tabs
- `H`: Open the Imperial Encyclopedia & Rules
- `F5` / `F9`: Quick Save / Quick Load (browser `localStorage`)

---

## Local Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```
