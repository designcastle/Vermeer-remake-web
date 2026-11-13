import { artworkById, isAuthentic, paintingSrc } from '../data/artworks';
import { CITIES, cityById, getRoute } from '../data/cities';
import { COMMODITIES, isOptimalMonth, type CommodityKey } from '../data/commodities';
import {
  acreCost,
  appraise,
  buyAcre,
  buyHardySeeds,
  hireWorker,
  localPrice,
  repayLoan,
  sellCommodity,
  takeLoan,
  toggleMuseumLoan,
  travel,
} from '../sim/economy';
import {
  artStats,
  formatDate,
  GameState,
  human,
  maxCredit,
  netWorth,
  totalAcres,
} from '../sim/gameState';
import { playSfx } from '../audio/sfx';

export type DockTab = 'overview' | 'estates' | 'market' | 'gallery';

export interface InspectorCallbacks {
  onSelectCity: (cityId: number) => void;
  onOpenAuction: () => void;
  onStateChanged: () => void;
}

let toastTimer: number | null = null;

export function showToast(msg: string, isError = false): void {
  const el = document.getElementById('toast-banner');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden', 'error');
  if (isError) el.classList.add('error');
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.classList.add('hidden');
  }, 3200);
}

export function fmtMoney(n: number): string {
  return `${Math.round(n).toLocaleString('en-US')} G`;
}

export function renderHud(state: GameState, speed: number): void {
  const p = human(state);
  const currentCity = cityById(p.cityId);
  const stats = artStats(p);

  const shieldEl = document.getElementById('hud-city-shield') as HTMLImageElement | null;
  if (shieldEl) shieldEl.src = `./assets/ui/shield_${currentCity.key}.png`;

  const cityNameEl = document.getElementById('hud-city-name');
  if (cityNameEl) cityNameEl.textContent = currentCity.name;

  const exBadge = document.getElementById('hud-exchange-badge');
  if (exBadge) {
    exBadge.textContent = `Exchange ${currentCity.exchangeIndex.toFixed(2)}×`;
  }

  const setText = (id: string, val: string): void => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('hud-cash', fmtMoney(p.cash));
  setText('hud-debt', fmtMoney(p.loan));
  setText('hud-networth', fmtMoney(netWorth(state, p)));
  setText('hud-artworks', `${p.portfolio.length} (${stats.authentic} auth)`);
  setText('hud-estates', `${totalAcres(p)} ac`);
  setText('hud-date', formatDate(state));
  setText('hud-speed-status', speed === 0 ? 'PAUSED' : `${speed}× LIVE`);

  document.getElementById('btn-speed-pause')?.classList.toggle('active', speed === 0);
  document.getElementById('btn-speed-play')?.classList.toggle('active', speed === 1);
  document.getElementById('btn-speed-fast')?.classList.toggle('active', speed === 3);
}

export function renderTelegraph(state: GameState): void {
  const list = document.getElementById('telegraph-list');
  const count = document.getElementById('telegraph-count');
  if (!list) return;
  if (count) count.textContent = String(state.telegrams.length);

  list.innerHTML = state.telegrams
    .slice(0, 12)
    .map(
      (item) => `
      <li class="telegraph-item">
        <span class="telegraph-date">${escapeHtml(item.date)} · ${escapeHtml(item.title)}</span>
        <span class="telegraph-msg">${escapeHtml(item.body)}</span>
      </li>`,
    )
    .join('');
}

export function renderQuickBar(
  state: GameState,
  selectedCityId: number,
  callbacks: InspectorCallbacks,
): void {
  const pills = document.getElementById('city-quick-pills');
  const p = human(state);
  if (pills) {
    pills.innerHTML = CITIES.map((c) => {
      const isHere = p.cityId === c.id;
      const isSel = selectedCityId === c.id;
      const hasAuc = Boolean(state.lots[c.id]);
      const starHtml = hasAuc ? '<span class="pill-star" title="Auction open">★</span>' : '';
      return `
        <button class="city-pill ${isHere ? 'here' : ''} ${isSel ? 'selected' : ''}" data-city="${c.id}">
          <img src="./assets/ui/shield_${c.key}.png" alt="" />
          <span>${c.name}</span>
          ${starHtml}
        </button>`;
    }).join('');

    pills.querySelectorAll<HTMLButtonElement>('.city-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.city);
        callbacks.onSelectCity(id);
      });
    });
  }

  const aucBtn = document.getElementById('btn-open-auction') as HTMLButtonElement | null;
  const aucBadge = document.getElementById('btn-auction-badge');
  if (aucBtn && aucBadge) {
    const lotHere = state.lots[p.cityId];
    const openCount = CITIES.filter((c) => Boolean(state.lots[c.id])).length;
    aucBtn.disabled = !lotHere;
    if (lotHere) {
      aucBadge.textContent = 'OPEN';
      aucBadge.classList.add('live');
    } else if (openCount > 0) {
      aucBadge.textContent = `${openCount} OTHER`;
      aucBadge.classList.remove('live');
    } else {
      aucBadge.textContent = 'NONE';
      aucBadge.classList.remove('live');
    }
  }
}

export function renderInspector(
  state: GameState,
  selectedCityId: number,
  activeTab: DockTab,
  callbacks: InspectorCallbacks,
): void {
  const city = cityById(selectedCityId);

  const shieldEl = document.getElementById('dock-city-shield') as HTMLImageElement | null;
  if (shieldEl) shieldEl.src = `./assets/ui/shield_${city.key}.png`;

  const titleEl = document.getElementById('dock-title');
  if (titleEl) titleEl.textContent = city.name;

  const subEl = document.getElementById('dock-subtitle');
  if (subEl) subEl.textContent = `${city.country} · ${city.subtitle}`;

  document.querySelectorAll<HTMLButtonElement>('.dock-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === activeTab);
  });

  const body = document.getElementById('dock-body');
  if (!body) return;

  if (activeTab === 'overview') {
    body.innerHTML = buildOverviewHtml(state, city.id);
    bindOverviewActions(state, city.id, callbacks);
  } else if (activeTab === 'estates') {
    body.innerHTML = buildEstatesHtml(state);
    bindEstateActions(state, callbacks);
  } else if (activeTab === 'market') {
    body.innerHTML = buildMarketHtml(state, city.id);
    bindMarketActions(state, callbacks);
  } else if (activeTab === 'gallery') {
    body.innerHTML = buildGalleryHtml(state);
    bindGalleryActions(state, callbacks);
  }
}

function buildOverviewHtml(state: GameState, cityId: number): string {
  const city = cityById(cityId);
  const p = human(state);
  const isHere = p.cityId === cityId;
  const route = getRoute(p.cityId, cityId);
  const creditLimit = maxCredit(state, p);
  const availCredit = Math.max(0, creditLimit - p.loan);
  const lotHere = state.lots[cityId];

  const travelHtml = isHere
    ? `<div class="notice-banner success">You are currently stationed in ${city.name}.</div>`
    : `<div class="route-card">
        <div>
          <strong>${route.mode}</strong> to ${city.name}<br/>
          <span class="muted">${route.days} days · Fare ${fmtMoney(route.cost)}</span>
        </div>
        <button id="btn-travel-city" class="gold-btn">Depart (${fmtMoney(route.cost)})</button>
      </div>`;

  const auctionHtml = lotHere
    ? `<div class="route-card gold-highlight">
        <div>
          <strong>Lot #${lotHere.artworkId + 1} · ${escapeHtml(artworkById(lotHere.artworkId).title)}</strong><br/>
          <span class="muted">Opening bid ${fmtMoney(lotHere.openingBid)}</span>
        </div>
        <button id="btn-dock-auction" class="gold-btn" ${isHere ? '' : 'disabled'}>
          ${isHere ? 'Enter Salon' : `Travel to ${city.name}`}
        </button>
      </div>`
    : '';

  return `
    <section class="dock-section">
      <p class="dock-desc">${escapeHtml(city.description)}</p>
      <div class="stat-grid">
        <div class="stat-box"><span>Exchange Index</span><strong>${city.exchangeIndex.toFixed(2)}×</strong></div>
        <div class="stat-box"><span>Bank Interest</span><strong>${(city.bankInterestRate * 100).toFixed(1)}% / mo</strong></div>
        <div class="stat-box"><span>Auction Activity</span><strong>${Math.round(city.auctionFrequency * 100)}%</strong></div>
        <div class="stat-box"><span>Appraiser</span><strong>${city.hasExpert ? escapeHtml(city.expertName) : 'None'}</strong></div>
      </div>
    </section>

    <section class="dock-section">
      <h3 class="section-heading">Travel & Dispatch</h3>
      ${travelHtml}
      ${auctionHtml}
    </section>

    <section class="dock-section">
      <h3 class="section-heading">Imperial Bank (${cityById(p.cityId).name})</h3>
      <div class="stat-grid">
        <div class="stat-box"><span>Current Debt</span><strong class="danger">${fmtMoney(p.loan)}</strong></div>
        <div class="stat-box"><span>Available Credit</span><strong>${fmtMoney(availCredit)}</strong></div>
      </div>
      <div class="btn-row">
        <button class="panel-btn" data-loan="1000">+ Borrow 1,000 G</button>
        <button class="panel-btn" data-loan="5000">+ Borrow 5,000 G</button>
        <button class="panel-btn" data-repay="1000">Repay 1,000 G</button>
        <button class="panel-btn" data-repay="all">Repay All</button>
      </div>
    </section>
  `;
}

function bindOverviewActions(state: GameState, cityId: number, callbacks: InspectorCallbacks): void {
  const p = human(state);
  document.getElementById('btn-travel-city')?.addEventListener('click', () => {
    const res = travel(state, p, cityId);
    playSfx(res.ok ? 'paper' : 'telegraph');
    showToast(res.msg, !res.ok);
    callbacks.onStateChanged();
  });

  document.getElementById('btn-dock-auction')?.addEventListener('click', () => {
    callbacks.onOpenAuction();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-loan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = takeLoan(state, p, Number(btn.dataset.loan));
      playSfx(res.ok ? 'coin' : 'telegraph');
      showToast(res.msg, !res.ok);
      callbacks.onStateChanged();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-repay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const raw = btn.dataset.repay;
      const amt = raw === 'all' ? p.loan : Number(raw);
      const res = repayLoan(state, p, amt);
      playSfx(res.ok ? 'coin' : 'telegraph');
      showToast(res.msg, !res.ok);
      callbacks.onStateChanged();
    });
  });
}

function buildEstatesHtml(state: GameState): string {
  const p = human(state);
  const city = cityById(p.cityId);
  const hasAgency = city.hasPlantationAgency;

  const estateCards = COMMODITIES.map((c) => {
    const owned = p.estates[c.key] ?? 0;
    const cost = acreCost(c.key, p.cityId);
    return `
      <div class="estate-card">
        <div class="estate-head">
          <span class="swatch" style="background:${c.color}"></span>
          <strong>${c.name}</strong>
          <span class="mono">${owned} acres</span>
        </div>
        <div class="estate-meta">
          <span>Yield ${c.baseYieldCwt} cwt/ac · Harvest ${c.optimalLabel}</span>
          <button class="gold-btn small" data-buy-acre="${c.key}" ${hasAgency ? '' : 'disabled'}>
            +1 Acre (${fmtMoney(cost)})
          </button>
        </div>
      </div>`;
  }).join('');

  return `
    <section class="dock-section">
      <div class="stat-grid">
        <div class="stat-box"><span>Total Acres</span><strong>${totalAcres(p)} ac</strong></div>
        <div class="stat-box"><span>Workers</span><strong>${p.workers}</strong></div>
        <div class="stat-box"><span>Hardy Seeds</span><strong>${p.hardySeeds ? 'Active (-70% risk)' : 'Standard'}</strong></div>
        <div class="stat-box"><span>Agency</span><strong>${hasAgency ? `${city.name} Open` : 'Visit Paris/Berlin/NY'}</strong></div>
      </div>
      <div class="btn-row">
        <button id="btn-hire-worker" class="panel-btn" ${hasAgency ? '' : 'disabled'}>
          Hire Worker (${city.workerHireCost} G)
        </button>
        <button id="btn-buy-seeds" class="panel-btn" ${hasAgency && !p.hardySeeds ? '' : 'disabled'}>
          ${p.hardySeeds ? 'Hardy Seeds Owned' : `Hardy Seeds (${city.seedUpgradeCost} G)`}
        </button>
      </div>
    </section>

    <section class="dock-section">
      <h3 class="section-heading">Colonial Estates</h3>
      <div class="card-stack">
        ${estateCards}
      </div>
    </section>
  `;
}

function bindEstateActions(state: GameState, callbacks: InspectorCallbacks): void {
  const p = human(state);
  document.getElementById('btn-hire-worker')?.addEventListener('click', () => {
    const res = hireWorker(state, p);
    playSfx(res.ok ? 'coin' : 'telegraph');
    showToast(res.msg, !res.ok);
    callbacks.onStateChanged();
  });

  document.getElementById('btn-buy-seeds')?.addEventListener('click', () => {
    const res = buyHardySeeds(state, p);
    playSfx(res.ok ? 'coin' : 'telegraph');
    showToast(res.msg, !res.ok);
    callbacks.onStateChanged();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-buy-acre]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.buyAcre as CommodityKey;
      const res = buyAcre(state, p, key);
      playSfx(res.ok ? 'coin' : 'telegraph');
      showToast(res.msg, !res.ok);
      callbacks.onStateChanged();
    });
  });
}

function buildSparkline(history: number[], color: string): string {
  const pts = history.slice(-14);
  if (pts.length < 2) return '';
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = Math.max(1, max - min);
  const w = 72;
  const h = 22;
  const coords = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - 3 - ((v - min) / span) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="sparkline"><polyline fill="none" stroke="${color}" stroke-width="1.8" points="${coords}"/></svg>`;
}

function buildMarketHtml(state: GameState, cityId: number): string {
  const p = human(state);
  const isHere = p.cityId === cityId;
  const city = cityById(cityId);

  const rows = COMMODITIES.map((c) => {
    const price = localPrice(state, c.key, cityId);
    const stock = p.inventory[c.key] ?? 0;
    const harvestTag = isOptimalMonth(c, state.month) ? '<span class="tag-good">Harvest</span>' : '';
    const spark = buildSparkline(state.priceHistory[c.key] ?? [], c.color);
    return `
      <tr>
        <td data-label="Commodity">
          <span class="swatch" style="background:${c.color}"></span>
          <strong>${c.name}</strong>
          ${harvestTag}
        </td>
        <td data-label="Trend">${spark}</td>
        <td data-label="Price" class="mono">${fmtMoney(price)}</td>
        <td data-label="Stock" class="mono">${stock} cwt</td>
        <td data-label="Sell">
          <div class="btn-inline">
            <button class="panel-btn small" data-sell="${c.key}" data-amt="5" ${isHere && stock >= 5 ? '' : 'disabled'}>5</button>
            <button class="gold-btn small" data-sell="${c.key}" data-amt="all" ${isHere && stock > 0 ? '' : 'disabled'}>All</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  return `
    <section class="dock-section">
      <h3 class="section-heading">${city.name} Exchange (${city.exchangeIndex.toFixed(2)}×)</h3>
      <div class="table-container">
        <table class="market-table">
          <thead>
            <tr>
              <th>Commodity</th>
              <th>Trend</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Sell</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function bindMarketActions(state: GameState, callbacks: InspectorCallbacks): void {
  const p = human(state);
  document.querySelectorAll<HTMLButtonElement>('[data-sell]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.sell as CommodityKey;
      const stock = p.inventory[key] ?? 0;
      const amt = btn.dataset.amt === 'all' ? stock : Number(btn.dataset.amt);
      const res = sellCommodity(state, p, key, amt);
      playSfx(res.ok ? 'coin' : 'telegraph');
      showToast(res.msg, !res.ok);
      callbacks.onStateChanged();
    });
  });
}

function buildGalleryHtml(state: GameState): string {
  const p = human(state);
  const city = cityById(p.cityId);

  if (p.portfolio.length === 0) {
    return `
      <section class="dock-section">
        <div class="notice-banner">
          Your private gallery is empty. Attend city auctions (marked with ★) to acquire Old Master paintings.
        </div>
      </section>`;
  }

  const cards = p.portfolio
    .map((item, idx) => {
      const art = artworkById(item.id);
      const appraisal = p.appraised[item.id];
      const authKnown = appraisal
        ? appraisal.appearsAuthentic
          ? `<span class="tag-good">Authentic (${appraisal.confidence}%)</span>`
          : `<span class="tag-bad">Forgery (${appraisal.confidence}%)</span>`
        : isAuthentic(art)
          ? '<span class="tag-warn">Unappraised</span>'
          : '<span class="tag-warn">Unappraised</span>';

      const appraiseBtn =
        !appraisal && city.hasExpert
          ? `<button class="panel-btn small" data-appraise="${art.id}">Appraise (${city.expertFee} G)</button>`
          : '';

      return `
        <article class="art-card">
          <img class="art-thumb" src="${paintingSrc(art.id)}" alt="${escapeHtml(art.title)}" />
          <div class="art-meta">
            <strong>${escapeHtml(art.title)}</strong>
            <span class="muted">${escapeHtml(art.artist.name)} (${art.epochYear})</span>
            <div class="art-badges">
              ${authKnown}
              <span class="mono">Est. ${fmtMoney(art.baseValue)}</span>
            </div>
            <div class="btn-inline">
              ${appraiseBtn}
              <button class="panel-btn small" data-loan-museum="${idx}">
                ${item.onMuseumLoan ? 'Recall from Museum' : 'Loan to Museum'}
              </button>
            </div>
          </div>
        </article>`;
    })
    .join('');

  return `
    <section class="dock-section">
      <div class="gallery-stack">
        ${cards}
      </div>
    </section>`;
}

function bindGalleryActions(state: GameState, callbacks: InspectorCallbacks): void {
  const p = human(state);
  document.querySelectorAll<HTMLButtonElement>('[data-appraise]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = appraise(state, p, Number(btn.dataset.appraise));
      playSfx(res.ok ? 'paper' : 'telegraph');
      showToast(res.msg, !res.ok);
      callbacks.onStateChanged();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-loan-museum]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = toggleMuseumLoan(p, Number(btn.dataset.loanMuseum));
      playSfx('paper');
      showToast(res.msg, !res.ok);
      callbacks.onStateChanged();
    });
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
