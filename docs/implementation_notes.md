# Implementation Notes & C64 Disassembly Fidelity Matrix

## 1. Source-of-Truth Mapping (`docs/architecture.md` & `docs/assets.md`)

This LÖVE (Love2D 11.5) remake implements all documented tables, hardware timings, and data structures extracted from `Disassembling/vermeer.asm`, `vermeer-db.prg`, and `vermeer-pic.prg`.

### 1.1 Exact Data Tables Implemented
| Subsystem | Source Reference | Implementation Module | Fidelity Status |
|---|---|---|---|
| **Plantation Commodities (4 types)** | `assets.md` §6.1 | `data/commodities.lua` | **Exact:** `TEE` (1,200G, 80 cwt, Jun–Aug, Drought/Red spider mite), `KAFFEE` (2,400G, 65 cwt, Sep–Nov, Frost/Coffee rust fungus), `TABAK` (1,800G, 110 cwt, Jul–Sep, Hail/Blue mold), `KAKAO` (3,100G, 50 cwt, Oct–Dec, Flooding/Black pod rot). |
| **World Travel & Financial Network (4 cities)** | `assets.md` §6.2 | `data/cities.lua` | **Exact:** Node `0` London (350G, 1 Day, 1.00x), Node `1` Paris (420G, 2 Days, 0.85x), Node `2` Berlin (280G, 1 Day, 1.15x), Node `3` New York (1,800G, 6 Days, 1.40x). |
| **64-Painting Masterpiece Catalog (8-byte struct)** | `assets.md` §6.3 | `data/artworks.lua` | **Exact Structure:** 64 catalog records across the 8 documented Old Masters (Vermeer, Rembrandt, Rubens, Dürer, Cranach, Hals, Bosch, Bruegel) using the 8-byte record schema (`id`, `artist`, `base_value`, `epoch`, `school`, `forgery` `$00`–`$FF`, `state`). |
| **Romuzak V6.3 Audio Pitch & Instrument Tables** | `architecture.md` §5.2, `assets.md` §5 | `ui/sfx.lua` & `assets/sfx/` | **Exact Envelopes:** Uses the 6-byte Romuzak instrument ADSR/Waveform definitions (`$11` Triangle, `$21` Sawtooth, `$41` Pulse, `$81` Noise) to synthesize authentic tactile C64/modern hybrid sound effects (gavel tap, telegraph click, paper rustle, coin chime). |
| **Stage 2 Multi-Raster Title Tribute** | `architecture.md` §2.2, §4.2 | `scenes/title.lua` | **Exact Split Geometry:** Optional visual homage to the 5-zone raster dispatcher (Logo zone, Line 120 sine-wobble, Line 184 smooth text scroller) alongside the modern high-DPI UI. |

---

## 2. Flagged Packed / Compressed Memory Segments

Per Specification Rule §1 (*"Flag any missing/packed memory segments explicitly in `docs/implementation_notes.md`"*), the following memory regions in `vermeer-db.prg` and `vermeer-pic.prg` exist as compressed bitstreams in the static JC64dis disassembly (`vermeer.asm`) because JC64dis disassembled the outer wrapper prior to Stage 1 (`$0400` RLE/literal expander) and Stage 3 (`$0100` ByteKiller bit-stream decruncher) runtime expansion:

1. **Stage 3 ByteKiller Payload (`$3724`–`$B2FB` in `vermeer.asm`, Lines 7317–24391, 31,704 bytes):**
   - **Why Packed:** In `vermeer-db.prg`, the core compiled BASIC + assembly game engine is stored as a ByteKiller-crunched image that relocates to `$0801` via the cassette buffer routine at `$0340` (`W10C8`) only after Joystick Port 2 Fire (`$DC01 == #$EF`) is pressed.
   - **What Was Extracted vs. Reconstructed:**
     - **Extracted (`assets.md` §6.1–6.3):** The 4 commodity definitions, 4 primary city nodes (with exact Gold costs, day durations, and exchange indices), the 64-painting 8-byte record layout, the 8 artist indices, the `$00`–`$FF` forgery quality byte mechanic, and rival names (*Gerd*, *Kurt*, *Baron von ...*).
     - **Deterministic Reconstruction (`sim/economy.lua`, `sim/auction.lua`, `sim/ai_rivals.lua`):**
       - **Commodity Price Volatility:** Since the internal BASIC/ASM floating-point polynomial inside the ByteKiller stream is not disassembled instruction-by-instruction in `architecture.md`, commodity spot prices are driven by a deterministic mean-reverting seasonal formula anchored to each commodity's documented base cost, base yield (`80`, `65`, `110`, `50` cwt), optimal harvest months (`Jun–Aug`, `Sep–Nov`, `Jul–Sep`, `Oct–Dec`), and city currency exchange index (`1.00`, `0.85`, `1.15`, `1.40`).
       - **Forgery Appraisal Threshold (`sim/auction.lua`):** Implements the exact rule documented in `assets.md` §6.3: *"Byte 6 contains the cryptographic authenticity flag (`$00` = Original Masterpiece, `$01`–`$FF` = Forgery variant). When inspected by an art expert in London or Paris, the expert's evaluation skill is compared against the forgery quality byte to reveal the truth."* Specifically, if `forgery_byte == 0x00`, the work is genuine; if `forgery_byte > 0x00`, an expert with skill rating `S` (`0x80`–`0xE0`) detects the forgery when `S >= forgery_byte`, with subtle visual/textual appraisal hints proportional to `S - forgery_byte`.
       - **Auction Bidding State Machine (`sim/auction.lua`):** Opening bid starts at `55%–75%` of the painting's 16-bit base valuation (adjusted by local city exchange index). Bid increments scale to `5%` of base value. AI rivals (*Gerd*, *Kurt*, *Baron von Stahl*) evaluate lots using deterministic personality weights and maximum valuation caps.
       - **Win/Loss Conditions (`sim/game_state.lua`):** Players compete to achieve the victory target (recovering the required number of authentic Old Master paintings + highest total Net Worth by the end of the campaign year, or reaching the target masterpiece collection & net worth threshold first), while avoiding bankruptcy (negative net worth with maxed-out Bank of England / New York credit lines).

2. **Title & Gallery Artwork Bitmap (`vermeer-pic.prg`, `$0826`–`$16EE`, 3,999 bytes):**
   - **Why Packed:** Uses an in-place stack decompressor (`$00FA` / `$0100`) to unpack a 160x200 multi-color bitmap of Vermeer's *Girl with a Pearl Earring*.
   - **Modern Replacement (`ui/widgets.lua` & `data/artworks.lua`):** Rendered in high-DPI LÖVE vector/painterly procedural canvases so all 64 paintings have unique visual compositions, palettes, lighting, and ornate frames tailored to their artist and school.
