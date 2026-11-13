Original prompt: Now, I think love2d framework might not be the best choice for this type of game. Use all the experience you gained from building a remake in LUA, and create a version with Javascript/Typescript stack. Make graphics really refined, use nice, free webfonts. Create a new folder for this new version.

## Iteration Plan & Progress
- [x] Initialize `Vermeer remake web` TypeScript + Vite + HTML5 Canvas/Hybrid DOM Grand Strategy architecture.
- [ ] Port complete C64 disassembled tables (`cities.ts`, `commodities.ts`, `artworks.ts`, `events.ts`, `tutorials.ts`) from `docs/architecture.md` and `docs/assets.md`.
- [ ] Implement deterministic simulation engine (`gameState.ts`, `economy.ts`, `auction.ts`, `aiRivals.ts`) + `window.advanceTime(ms)` and `window.render_game_to_text()` hooks.
- [ ] Build refined Europa Universalis V–inspired UI with free Google Webfonts (`Cinzel Decorative`, `Cinzel`, `Cormorant Garamond`, `Plus Jakarta Sans`, `JetBrains Mono`), interactive high-DPI vector/raster North Atlantic & European map canvas, native `<dialog>` modals, and Web Audio synthesizer.
- [ ] Copy Creative Commons Old Master paintings & heraldic shields into `public/assets/`.
- [ ] Verify build and interactive gameplay.


## Iteration Complete
- Implemented `src/audio/sfx.ts`, `src/render/mapCanvas.ts`, `src/ui/inspector.ts`, `src/ui/dialogs.ts`, and `src/main.ts`.
- Verified `npm run build` (`tsc && vite build`) passes with 0 errors.
- Verified runtime in headless Chrome via Playwright (`window.render_game_to_text()`, `window.advanceTime(5000)`, Auction Salon modal, and visual layout inspection).
