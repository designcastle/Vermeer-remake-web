// src/sim/economy.ts — player actions, monthly resolution, end conditions (pure state logic, no DOM)
import { cityById, getRoute } from '../data/cities';
import { COMMODITIES, commodityByKey, isOptimalMonth, type CommodityKey } from '../data/commodities';
import { artworkById, isAuthentic } from '../data/artworks';
import { PLANTATION_RISKS, WORLD_EVENTS, type RiskEvent } from '../data/events';
import {
  type GameState, type Player, MONTHS, addTelegram, artStats, maxCredit, netWorth, random, randomInt, refreshLots, totalAcres,
} from './gameState';
import { aiDailyTurn } from './aiRivals';

export interface ActionResult { ok: boolean; msg: string }
const ok = (msg: string): ActionResult => ({ ok: true, msg });
const fail = (msg: string): ActionResult => ({ ok: false, msg });
const G = (n: number): string => `${Math.round(n).toLocaleString('en-GB')} G`;

const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const localPrice = (s: GameState, key: CommodityKey, cityId: number): number =>
  Math.max(1, Math.round(s.prices[key] * cityById(cityId).exchangeIndex));

export const acreCost = (key: CommodityKey, cityId: number): number =>
  Math.floor(commodityByKey(key).plantationBaseCost * cityById(cityId).exchangeIndex);

export function buyAcre(s: GameState, p: Player, key: CommodityKey): ActionResult {
  const c = commodityByKey(key);
  const cost = acreCost(key, p.cityId);
  if (p.cash < cost) return fail(`Insufficient gold — an acre of ${c.name} costs ${G(cost)}.`);
  p.cash -= cost;
  p.estates[key]++;
  return ok(`Purchased 1 acre of ${c.name} (${c.germanId}) for ${G(cost)}.`);
}

export function sellCommodity(s: GameState, p: Player, key: CommodityKey, amount: number): ActionResult {
  const c = commodityByKey(key);
  const qty = Math.min(p.inventory[key], Math.floor(amount));
  if (qty <= 0) return fail(`No ${c.name.toLowerCase()} in the warehouse.`);
  const unit = localPrice(s, key, p.cityId);
  const revenue = qty * unit;
  p.inventory[key] -= qty;
  p.cash += revenue;
  p.totalCropSales += revenue;
  return ok(`Sold ${qty} cwt of ${c.name} in ${cityById(p.cityId).name} for ${G(revenue)} (${unit} G/cwt).`);
}

export function hireWorker(s: GameState, p: Player): ActionResult {
  const cost = cityById(p.cityId).workerHireCost;
  if (p.cash < cost) return fail(`A worker brigade costs ${G(cost)}.`);
  p.cash -= cost;
  p.workers++;
  return ok(`Hired a worker brigade for ${G(cost)} — ${p.workers} brigades in service.`);
}

export function buyHardySeeds(s: GameState, p: Player): ActionResult {
  const city = cityById(p.cityId);
  if (p.hardySeeds) return fail('Your estates already use Berlin hardy seed stock.');
  if (!city.hasPlantationAgency) return fail('Hardy seed stock is sold only at the Berlin agency.');
  if (p.cash < city.seedUpgradeCost) return fail(`Hardy seed stock costs ${G(city.seedUpgradeCost)}.`);
  p.cash -= city.seedUpgradeCost;
  p.hardySeeds = true;
  return ok('Hardy seed stock planted — weather and pest losses reduced by 70%.');
}

export function takeLoan(s: GameState, p: Player, amount: number): ActionResult {
  const limit = maxCredit(s, p);
  const borrow = Math.min(Math.floor(amount), Math.max(0, limit - p.loan));
  if (borrow <= 0) return fail(`Credit limit reached in ${cityById(p.cityId).name} (${G(limit)}).`);
  p.cash += borrow;
  p.loan += borrow;
  p.loanCityId = p.cityId;
  return ok(`Borrowed ${G(borrow)} from the ${cityById(p.cityId).name} syndicate.`);
}

export function repayLoan(s: GameState, p: Player, amount: number): ActionResult {
  if (p.loan <= 0) return fail('You have no outstanding loans.');
  const pay = Math.min(p.loan, p.cash, Math.floor(amount));
  if (pay <= 0) return fail('Insufficient cash to repay.');
  p.cash -= pay;
  p.loan -= pay;
  return ok(`Repaid ${G(pay)}. Remaining debt ${G(p.loan)}.`);
}

/** Expert inspection — docs/assets.md §6.3: expert skill is compared against Byte 6. */
export function appraise(s: GameState, p: Player, artworkId: number): ActionResult {
  const city = cityById(p.cityId);
  const art = artworkById(artworkId);
  if (p.appraised[artworkId]) return fail('This canvas has already been appraised.');
  if (p.cash < city.expertFee) return fail(`${city.expertName} charges ${G(city.expertFee)}.`);
  p.cash -= city.expertFee;

  let appearsAuthentic = true, confidence: number, note: string;
  const hex = (n: number) => `$${n.toString(16).toUpperCase().padStart(2, '0')}`;
  if (art.forgery === 0) {
    confidence = city.hasExpert ? 98 : 80;
    note = `Period pigments and craquelure verified — authentic (Byte 6 = $00).`;
  } else if (city.expertSkill >= art.forgery) {
    appearsAuthentic = false;
    confidence = 96;
    note = `Anachronistic lead-white underpainting — forgery detected (Byte 6 ${hex(art.forgery)} vs skill ${hex(city.expertSkill)}).`;
  } else {
    confidence = 62;
    note = `No obvious flaws, though provenance is murky (confidence ${confidence}%).`;
  }
  p.appraised[artworkId] = { appearsAuthentic, confidence, expert: city.expertName, note };
  return ok(`${city.expertName}: ${note}`);
}

export function toggleMuseumLoan(p: Player, index: number): ActionResult {
  const o = p.portfolio[index];
  if (!o) return fail('Painting not found.');
  if (!isAuthentic(artworkById(o.id))) return fail('Museums will not exhibit a forgery.');
  o.onMuseumLoan = !o.onMuseumLoan;
  return ok(o.onMuseumLoan ? 'Painting placed on museum loan.' : 'Painting recalled to your private gallery.');
}

// ---------------------------------------------------------------- monthly resolution
export function resolveMonthEnd(s: GameState): void {
  const month = s.month;
  const mname = MONTHS[month - 1];
  let riskKey: CommodityKey | null = null;
  let risk: RiskEvent | null = null;
  s.modifier = null;

  if (random(s) < 0.45) {
    const c = COMMODITIES[randomInt(s, 0, COMMODITIES.length - 1)];
    const list = PLANTATION_RISKS[c.key];
    risk = list[randomInt(s, 0, list.length - 1)];
    riskKey = c.key;
    addTelegram(s, risk.title, risk.telegram, 'risk');
  } else {
    const w = WORLD_EVENTS[randomInt(s, 0, WORLD_EVENTS.length - 1)];
    s.modifier = w.effect;
    addTelegram(s, w.title, w.telegram, 'world');
  }

  for (const c of COMMODITIES) {
    const cur = s.prices[c.key];
    const drift = isOptimalMonth(c, month) ? -0.05 : 0.04;
    const delta = drift + (random(s) * 2 - 1) * c.volatility;
    let next = cur * (1 + delta) + (c.baseMarketPrice - cur) * 0.25;
    if (riskKey === c.key && risk) next *= risk.priceSpike;
    next = Math.max(c.minPrice, Math.min(c.maxPrice, Math.round(next)));
    s.prices[c.key] = next;
    const h = s.priceHistory[c.key];
    h.push(next);
    if (h.length > 18) h.shift();
  }

  for (const p of s.players) {
    const acres = totalAcres(p);
    const staffing = acres > 0 ? Math.min(1.15, Math.max(0.55, p.workers / acres)) : 1;
    const harvest: string[] = [];
    for (const c of COMMODITIES) {
      const a = p.estates[c.key];
      if (a <= 0) continue;
      let season = isOptimalMonth(c, month) ? 1 : 0.35;
      if (s.modifier === 'bumper_harvest') season *= 1.2;
      let riskF = 1;
      if (riskKey === c.key && risk) riskF = p.hardySeeds ? 1 - (1 - risk.yieldMultiplier) * 0.3 : risk.yieldMultiplier;
      const produced = Math.round(a * c.baseYieldCwt * season * staffing * riskF);
      if (produced > 0) {
        p.inventory[c.key] += produced;
        harvest.push(`+${produced} cwt ${c.name}`);
      }
    }
    let upkeep = p.workers * 45;
    for (const c of COMMODITIES) upkeep += p.estates[c.key] * c.upkeepPerAcre;
    p.cash -= upkeep;

    let royalties = 0;
    const rate = s.modifier === 'museum_bonus' ? 0.045 : 0.035;
    for (const o of p.portfolio) {
      const art = artworkById(o.id);
      if (o.onMuseumLoan && isAuthentic(art)) royalties += Math.floor(art.baseValue * rate);
    }
    p.cash += royalties;

    if (p.loan > 0) p.loan += Math.floor(p.loan * cityById(p.loanCityId).bankInterestRate);

    if (!p.isAI && harvest.length) {
      addTelegram(s, `${mname} Estate Ledger`, `${harvest.join(', ')} · upkeep −${G(upkeep)} · royalties +${G(royalties)}`, 'ledger');
    }
  }

  refreshLots(s, false);
  checkEndConditions(s);
}

export function checkEndConditions(s: GameState): void {
  if (s.gameOver) return;
  const h = s.players[0];
  if (netWorth(s, h) < -12000 && h.cash < 0) {
    s.gameOver = true;
    s.winnerId = s.players[1]?.id ?? h.id;
    s.endReason = 'Bankruptcy — the Bank of England has foreclosed on your estates.';
    return;
  }
  for (const p of s.players) {
    const { authentic } = artStats(p);
    const nw = netWorth(s, p);
    if (authentic >= s.targetArtworks && nw >= s.targetNetWorth) {
      s.gameOver = true;
      s.winnerId = p.id;
      s.endReason = `${p.name} fulfilled Uncle Walter's testament with ${authentic} authentic masterpieces and ${G(nw)}.`;
      return;
    }
  }
  if (s.year > s.startYear + s.maxYears - 1 || s.artworkPool.length === 0) {
    s.gameOver = true;
    let best = s.players[0], bestScore = -Infinity;
    for (const p of s.players) {
      const score = artStats(p).authentic * 12000 + netWorth(s, p);
      if (score > bestScore) { bestScore = score; best = p; }
    }
    s.winnerId = best.id;
    s.endReason = `The final year has closed. ${best.name} claims the Vermeer legacy.`;
  }
}

export const finalScore = (s: GameState, p: Player): number => artStats(p).authentic * 12000 + netWorth(s, p);

export function advanceDays(s: GameState, days: number): void {
  for (let i = 0; i < Math.max(1, Math.floor(days)); i++) {
    if (s.gameOver) return;
    s.day++;
    s.turn++;
    aiDailyTurn(s);
    if (s.day === 10 || s.day === 20) refreshLots(s, false);
    if (s.day > DAYS_PER_MONTH[s.month - 1]) {
      s.day = 1;
      s.month++;
      if (s.month > 12) { s.month = 1; s.year++; }
      resolveMonthEnd(s);
    }
  }
}

export function travel(s: GameState, p: Player, destId: number): ActionResult {
  if (p.cityId === destId) return fail(`Already in ${cityById(destId).name}.`);
  const r = getRoute(p.cityId, destId);
  if (p.cash < r.cost) return fail(`A ${r.mode.toLowerCase()} ticket costs ${G(r.cost)}.`);
  p.cash -= r.cost;
  p.cityId = destId;
  advanceDays(s, r.days);
  return ok(`Arrived in ${cityById(destId).name} by ${r.mode.toLowerCase()} — ${r.days} day${r.days > 1 ? 's' : ''}, −${G(r.cost)}.`);
}

