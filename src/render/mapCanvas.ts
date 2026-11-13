import { CITIES, City, getRoute } from '../data/cities';
import { GameState, human } from '../sim/gameState';

interface GeoRegion {
  name: string;
  fill: string;
  stroke: string;
  labelLon?: number;
  labelLat?: number;
  points: [number, number][];
}

const REGIONS: GeoRegion[] = [
  {
    name: 'UNITED STATES',
    fill: '#2c3d4f',
    stroke: '#4e6782',
    labelLon: -79.5,
    labelLat: 39.0,
    points: [
      [-86, 25], [-81, 25.5], [-80, 30.5], [-76.5, 34.5], [-75.2, 37.5],
      [-74.0, 40.7], [-70.5, 41.8], [-67.0, 45.0], [-65.0, 47.0], [-72.0, 48.0],
      [-82.0, 46.5], [-88.0, 45.0], [-88.0, 29.0],
    ],
  },
  {
    name: 'GREAT BRITAIN',
    fill: '#5c2d35',
    stroke: '#94525c',
    labelLon: -2.2,
    labelLat: 53.5,
    points: [
      [-5.6, 50.1], [-1.3, 50.7], [1.4, 51.3], [1.7, 52.8], [-0.2, 53.7],
      [-1.5, 55.3], [-2.1, 57.6], [-5.2, 58.5], [-6.1, 56.5], [-4.8, 54.8],
      [-3.1, 53.3], [-4.9, 51.9], [-4.5, 50.8],
    ],
  },
  {
    name: 'IRELAND',
    fill: '#344c3b',
    stroke: '#587c61',
    points: [
      [-9.8, 51.6], [-6.3, 52.2], [-5.9, 54.6], [-8.2, 55.2], [-10.1, 53.7],
    ],
  },
  {
    name: 'FRANCE',
    fill: '#2d3f5e',
    stroke: '#5875a6',
    labelLon: 2.3,
    labelLat: 46.8,
    points: [
      [-4.6, 48.4], [-1.8, 49.6], [2.2, 51.0], [4.1, 50.2], [7.6, 49.0],
      [7.5, 47.5], [6.8, 45.8], [7.4, 43.8], [4.8, 43.3], [3.1, 42.5],
      [-1.6, 43.4], [-1.4, 46.2], [-3.8, 47.7],
    ],
  },
  {
    name: 'IBERIA',
    fill: '#59462d',
    stroke: '#8a6f4b',
    labelLon: -4.2,
    labelLat: 40.0,
    points: [
      [-9.2, 43.0], [-1.6, 43.4], [3.1, 42.5], [1.2, 40.3], [-0.5, 38.0],
      [-5.5, 36.0], [-9.3, 38.6], [-8.8, 41.8],
    ],
  },
  {
    name: 'LOW COUNTRIES',
    fill: '#4d4132',
    stroke: '#7e6a52',
    points: [
      [2.2, 51.0], [4.9, 53.2], [7.1, 53.2], [6.2, 50.2], [4.1, 50.2],
    ],
  },
  {
    name: 'GERMAN EMPIRE',
    fill: '#3b4248',
    stroke: '#707b85',
    labelLon: 10.6,
    labelLat: 51.2,
    points: [
      [6.2, 50.2], [7.1, 53.2], [8.6, 54.8], [10.0, 54.4], [14.2, 53.9],
      [18.8, 54.4], [21.0, 55.2], [20.5, 53.6], [17.8, 51.4], [14.8, 50.9],
      [12.2, 50.2], [13.5, 48.6], [10.2, 47.5], [7.5, 47.5], [7.6, 49.0],
    ],
  },
  {
    name: 'ALPINE & ITALY',
    fill: '#384c3d',
    stroke: '#618269',
    labelLon: 11.8,
    labelLat: 43.8,
    points: [
      [6.8, 45.8], [7.5, 47.5], [10.2, 47.5], [13.5, 48.6], [16.5, 48.0],
      [14.2, 45.5], [12.5, 44.0], [16.0, 41.2], [18.2, 40.2], [15.6, 38.1],
      [12.4, 41.8], [9.5, 44.2], [7.4, 43.8],
    ],
  },
  {
    name: 'SCANDINAVIA',
    fill: '#2e3b47',
    stroke: '#51677a',
    labelLon: 14.0,
    labelLat: 61.5,
    points: [
      [5.2, 60.5], [8.5, 58.2], [11.0, 57.7], [13.2, 55.4], [16.5, 56.8],
      [18.5, 59.5], [21.5, 65.0], [26.0, 68.0], [15.0, 68.0], [8.0, 64.0],
    ],
  },
  {
    name: 'CENTRAL EUROPE',
    fill: '#473c36',
    stroke: '#75645b',
    labelLon: 20.0,
    labelLat: 50.0,
    points: [
      [14.8, 50.9], [17.8, 51.4], [20.5, 53.6], [24.0, 54.5], [28.0, 54.0],
      [28.0, 46.0], [19.0, 45.5], [16.5, 48.0], [13.5, 48.6], [12.2, 50.2],
    ],
  },
  {
    name: 'NORTH AFRICA',
    fill: '#4a4031',
    stroke: '#766750',
    points: [
      [-10.0, 35.5], [-5.2, 35.8], [3.0, 36.8], [10.5, 37.0], [15.0, 32.5],
      [25.0, 31.5], [25.0, 26.0], [-10.0, 26.0],
    ],
  },
];

export interface MapInteractionCallbacks {
  onSelectCity: (cityId: number) => void;
  onDoubleClickCity: (cityId: number) => void;
}

export class MapCanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shields = new Map<string, HTMLImageElement>();
  private worldMap: HTMLImageElement;
  private hoveredCityId: number | null = null;
  private panX = 0;
  private panY = 0;
  private zoom = 1;
  private isDragging = false;
  private dragMoved = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private panOriginX = 0;
  private panOriginY = 0;
  private pulseTime = 0;
  private callbacks: MapInteractionCallbacks;
  private lastState: GameState | null = null;
  private lastSelectedCityId = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: MapInteractionCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not initialize 2D map canvas context.');
    }
    this.ctx = context;
    this.callbacks = callbacks;

    this.worldMap = new Image();
    this.worldMap.src = './assets/maps/world_map.jpg';

    for (const city of CITIES) {
      const img = new Image();
      img.src = `./assets/ui/shield_${city.key}.png`;
      this.shields.set(city.key, img);
    }

    this.bindEvents();
    this.resize();
  }

  public resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.max(240, Math.floor(rect.height));
    if (this.canvas.width !== Math.floor(w * dpr) || this.canvas.height !== Math.floor(h * dpr)) {
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.dragMoved = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.panOriginX = this.panX;
      this.panOriginY = this.panY;
      this.canvas.setPointerCapture(e.pointerId);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (this.isDragging) {
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        if (Math.hypot(dx, dy) > 4) {
          this.dragMoved = true;
        }
        this.panX = Math.max(-260, Math.min(260, this.panOriginX + dx));
        this.panY = Math.max(-180, Math.min(180, this.panOriginY + dy));
        return;
      }

      this.hoveredCityId = this.hitTestCity(mx, my);
      this.canvas.style.cursor = this.hoveredCityId !== null ? 'pointer' : 'grab';
    });

    this.canvas.addEventListener('pointerup', (e) => {
      this.isDragging = false;
      if (this.canvas.hasPointerCapture(e.pointerId)) {
        this.canvas.releasePointerCapture(e.pointerId);
      }
      if (!this.dragMoved) {
        const rect = this.canvas.getBoundingClientRect();
        const hit = this.hitTestCity(e.clientX - rect.left, e.clientY - rect.top);
        if (hit !== null) {
          this.callbacks.onSelectCity(hit);
        }
      }
    });

    this.canvas.addEventListener('dblclick', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const hit = this.hitTestCity(e.clientX - rect.left, e.clientY - rect.top);
      if (hit !== null) {
        this.callbacks.onDoubleClickCity(hit);
      } else {
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
      }
    });

    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        this.zoom = Math.max(0.82, Math.min(1.85, this.zoom * factor));
      },
      { passive: false },
    );
  }

  private project(lon: number, lat: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(320, rect.width);
    const h = Math.max(240, rect.height);

    const leftSafe = w > 960 ? 410 : 40;
    const usableW = w - leftSafe;
    const minLon = -85;
    const maxLon = 24;
    const minLat = 30;
    const maxLat = 63;

    const nx = (lon - minLon) / (maxLon - minLon);
    const ny = 1 - (lat - minLat) / (maxLat - minLat);

    const cx = leftSafe + usableW * 0.5;
    const cy = h * 0.52;
    const baseX = leftSafe + nx * usableW;
    const baseY = 58 + ny * (h - 128);

    return {
      x: cx + (baseX - cx) * this.zoom + this.panX,
      y: cy + (baseY - cy) * this.zoom + this.panY,
    };
  }

  private hitTestCity(mx: number, my: number): number | null {
    this.worldMap = new Image();
    this.worldMap.src = './assets/maps/world_map.jpg';

    for (const city of CITIES) {
      const p = this.project(city.lon, city.lat);
      if (Math.hypot(mx - p.x, my - p.y) <= 28) {
        return city.id;
      }
    }
    return null;
  }

  public render(state: GameState, selectedCityId: number, dt: number): void {
    this.lastState = state;
    this.lastSelectedCityId = selectedCityId;
    this.pulseTime += dt;
    this.resize();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    const ctx = this.ctx;

    ctx.save();
    ctx.scale(dpr, dpr);

    const ocean = ctx.createRadialGradient(w * 0.52, h * 0.48, 40, w * 0.52, h * 0.48, Math.max(w, h) * 0.78);
    ocean.addColorStop(0, '#16283d');
    ocean.addColorStop(0.55, '#101d2e');
    ocean.addColorStop(1, '#09111c');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    if (this.worldMap.complete && this.worldMap.naturalWidth > 0) {
      const topLeft = this.project(-180, 90);
      const botRight = this.project(180, -90);
      ctx.save();
      ctx.filter = 'sepia(0.28) brightness(0.74) contrast(1.12) saturate(0.78)';
      ctx.drawImage(
        this.worldMap,
        topLeft.x,
        topLeft.y,
        botRight.x - topLeft.x,
        botRight.y - topLeft.y,
      );
      ctx.restore();

      // Subtle imperial dark vignette over bitmap for crisp HUD/route contrast
      ctx.fillStyle = 'rgba(10, 17, 29, 0.28)';
      ctx.fillRect(0, 0, w, h);
    } else {
      for (const reg of REGIONS) {
        this.drawRegion(ctx, reg);
      }
    }

    this.drawGraticule(ctx, w, h);
    this.drawCompassRose(ctx);

    this.drawRoutes(ctx, state, selectedCityId);

    this.worldMap = new Image();
    this.worldMap.src = './assets/maps/world_map.jpg';

    for (const city of CITIES) {
      this.drawCityNode(ctx, state, city, selectedCityId);
    }

    ctx.restore();
  }

  public redrawLast(dt = 0): void {
    if (this.lastState) {
      this.render(this.lastState, this.lastSelectedCityId, dt);
    }
  }

  private drawGraticule(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(203, 169, 98, 0.075)';
    ctx.lineWidth = 1;

    for (let lon = -80; lon <= 25; lon += 15) {
      const top = this.project(lon, 64);
      const bot = this.project(lon, 28);
      ctx.beginPath();
      ctx.moveTo(top.x, 0);
      ctx.lineTo(bot.x, h);
      ctx.stroke();
    }

    for (let lat = 35; lat <= 60; lat += 10) {
      const left = this.project(-88, lat);
      const right = this.project(28, lat);
      ctx.beginPath();
      ctx.moveTo(0, left.y);
      ctx.lineTo(w, right.y);
      ctx.stroke();
    }

    const rose = this.project(-36, 42);
    ctx.strokeStyle = 'rgba(203, 169, 98, 0.045)';
    for (let i = 0; i < 16; i++) {
      const ang = (i * Math.PI) / 8;
      ctx.beginPath();
      ctx.moveTo(rose.x, rose.y);
      ctx.lineTo(rose.x + Math.cos(ang) * 1400, rose.y + Math.sin(ang) * 1400);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCompassRose(ctx: CanvasRenderingContext2D): void {
    const c = this.project(-36, 42);
    ctx.save();
    ctx.translate(c.x, c.y);

    ctx.strokeStyle = 'rgba(203, 169, 98, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      const len = i % 2 === 0 ? 32 : 20;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(203, 169, 98, 0.42)';
    ctx.font = '600 10px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, -39);
    ctx.fillText('ATLANTIC OCEAN', 0, 56);
    ctx.restore();
  }

  private drawRegion(ctx: CanvasRenderingContext2D, reg: GeoRegion): void {
    if (reg.points.length < 3) return;
    ctx.save();
    ctx.beginPath();
    reg.points.forEach(([lon, lat], idx) => {
      const pt = this.project(lon, lat);
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = reg.fill;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = reg.stroke;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    if (reg.labelLon !== undefined && reg.labelLat !== undefined) {
      const lp = this.project(reg.labelLon, reg.labelLat);
      ctx.fillStyle = 'rgba(232, 224, 206, 0.24)';
      ctx.font = '600 10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(reg.name, lp.x, lp.y);
    }
    ctx.restore();
  }

  private drawRoutes(ctx: CanvasRenderingContext2D, state: GameState, selectedCityId: number): void {
    const p = human(state);
    const pairs: [number, number][] = [
      [0, 1],
      [1, 2],
      [0, 2],
      [0, 3],
      [1, 3],
    ];

    ctx.save();
    for (const [aId, bId] of pairs) {
      const a = CITIES[aId];
      const b = CITIES[bId];
      const pa = this.project(a.lon, a.lat);
      const pb = this.project(b.lon, b.lat);
      const isHighlighted =
        (aId === p.cityId && bId === selectedCityId) ||
        (bId === p.cityId && aId === selectedCityId);

      const midX = (pa.x + pb.x) * 0.5;
      const midY = (pa.y + pb.y) * 0.5 - Math.abs(pa.x - pb.x) * 0.11;

      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.quadraticCurveTo(midX, midY, pb.x, pb.y);
      if (isHighlighted) {
        ctx.strokeStyle = 'rgba(229, 198, 130, 0.85)';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -this.pulseTime * 22;
      } else {
        ctx.strokeStyle = 'rgba(203, 169, 98, 0.22)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = 0;
      }
      ctx.stroke();

      if (isHighlighted) {
        const route = getRoute(p.cityId, selectedCityId);
        const label = `${route.mode} · ${route.days}d · ${route.cost} G`;
        ctx.setLineDash([]);
        ctx.font = '600 11px "JetBrains Mono", monospace';
        const tw = ctx.measureText(label).width + 16;
        ctx.fillStyle = 'rgba(13, 17, 25, 0.9)';
        ctx.strokeStyle = 'rgba(203, 169, 98, 0.65)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, midX - tw / 2, midY - 12, tw, 22, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e5c682';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, midX, midY - 1);
      }
    }
    ctx.restore();
  }

  private drawCityNode(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    city: City,
    selectedCityId: number,
  ): void {
    const pt = this.project(city.lon, city.lat);
    const p = human(state);
    const isCurrent = p.cityId === city.id;
    const isSelected = selectedCityId === city.id;
    const isHovered = this.hoveredCityId === city.id;
    const hasAuction = Boolean(state.lots[city.id]);

    ctx.save();
    ctx.translate(pt.x, pt.y);

    if (hasAuction) {
      const pulse = 24 + Math.sin(this.pulseTime * 4) * 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(229, 198, 130, 0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(0, 0, 23, 0, Math.PI * 2);
      ctx.strokeStyle = isSelected ? '#e5c682' : 'rgba(236, 230, 216, 0.6)';
      ctx.lineWidth = isSelected ? 2.4 : 1.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = isCurrent ? '#2b2416' : '#121822';
    ctx.fill();
    ctx.strokeStyle = isCurrent ? '#e5c682' : '#7b6640';
    ctx.lineWidth = isCurrent ? 2.4 : 1.6;
    ctx.stroke();

    const shield = this.shields.get(city.key);
    if (shield && shield.complete && shield.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(shield, -14, -14, 28, 28);
      ctx.restore();
    }

    if (hasAuction) {
      ctx.beginPath();
      ctx.arc(14, -14, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = '#cba962';
      ctx.fill();
      ctx.strokeStyle = '#0d1119';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#0d1119';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 14, -13.5);
    }

    const rivalsHere = state.players.filter((pl) => pl.isAI && pl.cityId === city.id);
    rivalsHere.forEach((rival, idx) => {
      ctx.beginPath();
      ctx.arc(-14 + idx * 8, -15, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = rival.color;
      ctx.fill();
      ctx.strokeStyle = '#0d1119';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.font = '700 12px Cinzel, serif';
    const textW = ctx.measureText(city.name).width + 18;
    ctx.fillStyle = isCurrent ? 'rgba(34, 27, 15, 0.94)' : 'rgba(13, 17, 25, 0.9)';
    ctx.strokeStyle = isCurrent ? '#e5c682' : 'rgba(181, 149, 86, 0.55)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, -textW / 2, 22, textW, 21, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isCurrent ? '#f4e3b5' : '#ece6d8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(city.name, 0, 32.5);

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
