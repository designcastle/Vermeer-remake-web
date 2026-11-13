// src/sim/aiRivals.ts — Gerd, Kurt & Baron von Stahl
import { cityById, getRoute } from '../data/cities';
import { COMMODITIES, commodityByKey } from '../data/commodities';
import { artworkById } from '../data/artworks';
import { type GameState, type Player, addTelegram, formatDate, random, randomInt, removeFromPool, totalAcres } from './gameState';

export function aiDailyTurn(s: GameState): void {
  if (s.turn % 5 !== 0) return;
  for (const p of s.players) if (p.isAI) takeAction(s, p);
}

function takeAction(s: GameState, p: Player): void {
  const city = cityById(p.cityId);

  // 1. Sell harvests in strong-currency cities or when short of cash
  for (const c of COMMODITIES) {
    const cwt = p.inventory[c.key];
    if (cwt >= 60 && (city.exchangeIndex >= 1.15 || p.cash < 4000)) {
      const revenue = cwt * Math.max(1, Math.round(s.prices[c.key] * city.exchangeIndex));
      p.inventory[c.key] = 0;
      p.cash += revenue;
      p.totalCropSales += revenue;
    }
  }

  // 2. Staff and expand estates
  const acres = totalAcres(p);
  if (p.workers < acres && p.cash > 1500) { p.cash -= 220; p.workers++; }
  if (acres < 6 && p.cash > 7500 && random(s) < 0.45) {
    const c = commodityByKey(p.preferred);
    const cost = Math.floor(c.plantationBaseCost * city.exchangeIndex);
    if (p.cash >= cost + 3500) {
      p.cash -= cost;
      p.estates[c.key]++;
      p.workers++;
      return;
    }
  }

  // 3. Lend everything to museums
  for (const o of p.portfolio) o.onMuseumLoan = true;

  // 4. Off-screen purchase where the player is not present
  const h = s.players[0];
  const lot = s.lots[p.cityId];
  if (lot && p.cityId !== h.cityId && random(s) < 0.14) {
    const art = artworkById(lot.artworkId);
    const price = Math.floor(art.baseValue * city.exchangeIndex * (0.75 + random(s) * 0.2));
    if (p.cash >= price + 2500 && (art.forgery === 0 || random(s) < 0.25)) {
      p.cash -= price;
      p.auctionsWon++;
      p.portfolio.push({ id: art.id, purchasePrice: price, purchaseCityId: p.cityId, purchaseDate: formatDate(s), onMuseumLoan: true });
      removeFromPool(s, art.id, p.id);
      addTelegram(s, `Rival Acquisition · ${city.name}`, `${p.name} bought “${art.title}” (${art.artist.name}) for ${price.toLocaleString('en-GB')} G.`, 'rival');
      return;
    }
  }

  // 5. Travel
  if (random(s) < 0.35) {
    const next = randomInt(s, 0, 3);
    if (next !== p.cityId) {
      const r = getRoute(p.cityId, next);
      if (p.cash > r.cost + 2000) { p.cash -= r.cost; p.cityId = next; }
    }
  }
}

