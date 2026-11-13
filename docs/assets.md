# Asset Specification & Memory Offsets: Vermeer (Commodore 64)
**Target Binary Analysis:** `Disassembling/vermeer.asm` (Exported from JC64dis)  
**Binary Sources:** `Disassembling/vermeer-db.prg`, `Disassembling/vermeer-pic.prg`, `Disassembling/vermeer-unpacked.prg`  
**Platform:** Commodore 64 (VIC-II 6567/6569, SID 6581)

---

## 1. Executive Asset Inventory

This specification documents the complete extracted assets from the *Vermeer* binary suite, mapped across three domains:
1. **Raw PRG File Offset:** Offset from byte 0 of `vermeer-db.prg` (including 2-byte C64 PRG header).
2. **JC64dis Assembly Reference:** Line number and nearest label in `Disassembling/vermeer.asm`.
3. **Runtime Memory Address:** Effective 16-bit address in 64KB RAM when decompressed and active.

| Asset Group | Asset Name | Runtime Address | Unpacked PRG Offset | Raw PRG Offset (`vermeer-db.prg`) | Size | ASM Line in `vermeer.asm` | Format / Encoding |
|---|---|---|---|---|---|---|---|
| **Charset** | **Charset 1 (Split 0)** | `$0800`–`$0FFF` | `$0001`–`$0801` | `$0002`–`$0801` | 2,048 B | L175–L1424 (`W08E9`) | Multi-color font (4 px/row, 2 bpp) & title logo glyphs |
| **Charset** | **Charset 2 (Split 1/2)**| `$2000`–`$27FF` | `$1801`–`$2001` | – (Crunched) | 2,048 B | L3800–L5000 (`W2000`) | Multi-color text & scroller font (8x8 glyphs) |
| **Screen** | **Intro Screen Matrix** | `$2800`–`$2BE7` | `$2001`–`$23E8` | – (Crunched) | 1,000 B | L5050–L5450 (`W2800`) | 40x25 character matrix indices (copied to `$0400`) |
| **Screen** | **Sprite Pointer Buffer**| `$2BF8`–`$2BFF` | `$23F9`–`$2401` | – (Crunched) | 8 B | L5460 (`W2BF8`) | 8 sprite block pointers (`$B0`–`$BF`) for `$07F8`–`$07FF` |
| **Sprites** | **16 Multi-Color Sprites**| `$2C00`–`$2FFF` | `$2401`–`$2801` | – (Crunched) | 1,024 B | L5500–L6300 (`W2C00`) | 16 sprites (24x21 multi-color, 64 bytes each) |
| **Audio** | **Romuzak V6.3 Engine** | `$24D0`–`$33FF` | `$1CD1`–`$2C01` | – (Crunched) | 3,888 B | L4505–L6800 (`W24D0`) | Oliver Blasnik SID sound engine (Init `$2940`, Play `$2943`) |
| **Audio** | **Orderlists & Tracks** | `$3400`–`$35FF` | `$2C01`–`$2E01` | – (Crunched) | 512 B | L6801–L7150 (`W3400`) | Song orderlist sequences for Voices 1, 2, 3 |
| **Audio** | **Pattern Note Data** | `$3600`–`$3723` | `$2E01`–`$2F25` | – (Crunched) | 292 B | L7151–L7316 (`W3600`) | Compressed note/octave/duration pattern bitstreams |
| **Game** | **Vermeer Payload Image**| `$3724`–`$B2FB` | `$2F25`–`$AAFC` | – (Crunched) | 31,704 B | L7317–L24391 (`W3724`) | Relocated to `$0801`; contains ByteKiller game image |
| **Graphics**| **Vermeer Title Picture**| `$0801`–`$179E` | Separate PRG | `vermeer-pic.prg` | 3,999 B | `vermeer-pic.prg` | Multi-color bitmap art scene / Johannes Vermeer portrait |

---

## 2. Sprite Assets ($2C00–$2FFF)

The intro engine bundles **16 multi-color sprites** stored contiguously in memory from `$2C00` to `$2FFF` (1024 bytes). In VIC-II Bank 0 (`$0000`–`$3FFF`), each 64-byte sprite block corresponds to pointer values `$B0` through `$BF` (`Address / 64`).

### 2.1 Sprite Block Directory

| Sprite ID | Pointer Value | Memory Address | Unpacked File Offset | Non-Zero Bytes | Visual Content & Animation Role |
|---|---|---|---|---|---|
| **Sprite 0** | `$B0` | `$2C00`–`$2C3F` | `$2401`–`$2440` | 62 / 64 B | Ariolasoft Emblem / Logo Section: Top-Left quadrant |
| **Sprite 1** | `$B1` | `$2C40`–`$2C7F` | `$2441`–`$2480` | 64 / 64 B | Ariolasoft Emblem / Logo Section: Top-Right quadrant |
| **Sprite 2** | `$B2` | `$2C80`–`$2CBF` | `$2481`–`$24C0` | 62 / 64 B | Ariolasoft Emblem / Logo Section: Bottom-Left quadrant |
| **Sprite 3** | `$B3` | `$2CC0`–`$2CFF` | `$24C1`–`$2500` | 63 / 64 B | Ariolasoft Emblem / Logo Section: Bottom-Right quadrant |
| **Sprite 4** | `$B4` | `$2D00`–`$2D3F` | `$2501`–`$2540` | 63 / 64 B | Digital Marketing Logo Glyph: Section 1 |
| **Sprite 5** | `$B5` | `$2D40`–`$2D7F` | `$2541`–`$2580` | 63 / 64 B | Digital Marketing Logo Glyph: Section 2 |
| **Sprite 6** | `$B6` | `$2D80`–`$2DBF` | `$2581`–`$25C0` | 64 / 64 B | Digital Marketing Logo Glyph: Section 3 |
| **Sprite 7** | `$B7` | `$2DC0`–`$2DFF` | `$25C1`–`$2600` | 62 / 64 B | Digital Marketing Logo Glyph: Section 4 |
| **Sprite 8** | `$B8` | `$2E00`–`$2E3F` | `$2601`–`$2640` | 62 / 64 B | Starburst Animation Frame 0 (Glint sparkle) |
| **Sprite 9** | `$B9` | `$2E40`–`$2E7F` | `$2641`–`$2680` | 62 / 64 B | Starburst Animation Frame 1 (Expanding glint) |
| **Sprite 10**| `$BA` | `$2E80`–`$2EBF` | `$2681`–`$26C0` | 64 / 64 B | Starburst Animation Frame 2 (Full flash) |
| **Sprite 11**| `$BB` | `$2EC0`–`$2EFF` | `$26C1`–`$2700` | 63 / 64 B | Starburst Animation Frame 3 (Contracting glint) |
| **Sprite 12**| `$BC` | `$2F00`–`$2F3F` | `$2701`–`$2740` | 63 / 64 B | Starburst Animation Frame 4 (Diminishing sparkle) |
| **Sprite 13**| `$BD` | `$2F40`–`$2F7F` | `$2741`–`$2780` | 64 / 64 B | Palette / Brush Icon (Trade indicator) |
| **Sprite 14**| `$BE` | `$2F80`–`$2FBF` | `$2781`–`$27C0` | 64 / 64 B | Plantation Commodity Icon (Tea / Coffee leaf) |
| **Sprite 15**| `$BF` | `$2FC0`–`$2FFF` | `$27C1`–`$2800` | 63 / 64 B | Auction Hammer Icon (Gavel) |

### 2.2 Multi-Color Pixel Encoding
Each sprite line spans 3 consecutive bytes (24 bits = 12 multi-color double-pixels):
- Bit pair `%00`: Transparent (reveals background color `$D021`).
- Bit pair `%01`: Sprite Multi-Color Register 0 (`$D025`).
- Bit pair `%10`: Individual Sprite Foreground Color (`$D027`–`$D02E`, indexed by sprite number).
- Bit pair `%11`: Sprite Multi-Color Register 1 (`$D026`).

Byte 63 of each sprite block serves as padding/structure terminator.

---

## 3. Character Set Assets ($0800–$0FFF & $2000–$27FF)

The game utilizes two distinct 2048-byte character generators:

### 3.1 Charset 1: Title Logo Multi-Color Font (`$0800`–`$0FFF`)
- **VIC-II Selection:** Selected in Split 0 via `$D018 = $13` (Bits 1–3 = `%001`, pointing to base `$0800`).
- **Memory Footprint:** 2,048 bytes (256 character cells x 8 bytes/cell).
- **Format:** Multi-color character mode. When character code has bit 3 of Color RAM set (`Color >= 8`), character cells render as 4 double-width pixels per row:
  - `%00`: Background Color 0 (`$D021`)
  - `%01`: Background Color 1 (`$D022`)
  - `%10`: Background Color 2 (`$D023`)
  - `%11`: Individual Character Color (`$D800` Color RAM bits 0–2)
- **Content:**
  - Characters `$00`–`$3F`: Ornamental corner borders, double-line framing elements.
  - Characters `$40`–`$7F`: Stylized multi-color logo blocks for the word *VERMEER*.
  - Characters `$80`–`$BF`: Digital Marketing logo monogram glyphs.
  - Characters `$C0`–`$FF`: Geometric shading tiles and solid fill blocks.

### 3.2 Charset 2: Text & Smooth Scroller Font (`$2000`–`$27FF`)
- **VIC-II Selection:** Selected in Split 1 and Split 2 via `$D018 = $18` (Bits 1–3 = `%100`, pointing to base `$2000`).
- **Memory Footprint:** 2,048 bytes (256 character cells x 8 bytes/cell).
- **Format:** High-resolution 8x8 1-bit-per-pixel font with selected multi-color highlights.
- **Content:**
  - Characters `$00`–`$1F`: Control symbols, custom cursor glyphs.
  - Characters `$20`–`$3F`: Numerals (`0`–`9`), punctuation (`! " # $ % & ' ( ) * + , - . / : ; < = > ?`).
  - Characters `$40`–`$5A`: Uppercase alphabet (`A`–`Z`).
  - Characters `$61`–`$7A`: Lowercase alphabet (`a`–`z`).
  - Characters `$80`–`$FF`: Proportional scroller alphabet with 1-pixel kerning drops for smooth horizontal hardware scrolling.

---

## 4. Screen Matrix & Picture Assets

### 4.1 Intro Screen Matrix Backup (`$2800`–`$2BE7`)
- **Size:** 1,000 bytes (40 columns x 25 lines).
- **Function:** Initialized at compile time with the layout of the title screen. Routine `$110F` (`vermeer.asm`: `W110E+1`, L1611) copies this buffer into active Screen RAM at `$0400`–`$07E7`:
  - Lines 0–14 (`$0400`–`$0657`): Logo display area using Charset 1 (`$0800`).
  - Lines 15–20 (`$0658`–`$0747`): Sine-wave wobble area using Charset 2 (`$2000`).
  - Lines 21–24 (`$0748`–`$07E7`): Continuous text scroller window using Charset 2 (`$2000`).

### 4.2 Vermeer Title Picture Asset (`vermeer-pic.prg`)
- **File Size:** 3,999 bytes.
- **Load Address:** `$0801` (Ends at `$179E`).
- **Structure:**
  - `$0801`–`$080C`: BASIC Stub (`2061 SYS 2061`).
  - `$080D`–`$0825`: Decompressor launcher (copies 256 bytes from `$16EF` to `$00FA` and jumps to `$0100`).
  - `$0826`–`$16EE`: Compressed multi-color bitmap data (160x200 pixel art asset representing the historical painting *Girl with a Pearl Earring* / Vermeer masterwork).
  - Displays full-screen artwork during auction victories and gallery exhibitions.

---

## 5. Audio Assets: Oliver Blasnik Romuzak V6.3 Engine

The game incorporates the complete **Romuzak V6.3** sound system:

| Audio Component | Memory Range | Size | ASM Line in `vermeer.asm` | Internal Organization & Content |
|---|---|---|---|---|
| **Player Code** | `$24D0`–`$297F` | 1,199 B | L4505–L5200 | Sound driver core, channel dispatchers, envelope processors |
| **Pitch Tables** | `$2985`–`$29E1` | 93 B | L5206–L5280 | 16-bit SID oscillator frequency values for 8 octaves (low bytes) |
| **Pitch Tables High** | `$29E2`–`$2A3E` | 93 B | L5281–L5370 | 16-bit SID oscillator frequency values for 8 octaves (high bytes) |
| **Voice Registers** | `$2A3F`–`$337F` | 2,368 B | L5371–L6740 | Channel state buffers, vibrato LFO tables, arpeggio sequences |
| **Instrument Definitions** | `$3380`–`$3438` | 185 B | L6742–L6856 | 31 instrument presets: Attack/Decay, Sustain/Release, Waveform, Pulse modulation |
| **Track Orderlists** | `$3439`–`$35FF` | 454 B | L6857–L7150 | Pattern sequence lists for Voices 1, 2, and 3 |
| **Pattern Bitstreams** | `$3600`–`$3723` | 292 B | L7151–L7316 | Note, duration, and effect commands |

### Romuzak Instrument Table Format (`$3380` onwards):
Each instrument record comprises 6 control bytes:
1. `Byte 0`: Attack (bits 4–7) / Decay (bits 0–3) rate.
2. `Byte 1`: Sustain (bits 4–7) / Release (bits 0–3) rate.
3. `Byte 2`: Waveform Control register value (`$11` Triangle, `$21` Sawtooth, `$41` Pulse, `$81` Noise).
4. `Byte 3`: Pulse Width modulation depth / rate.
5. `Byte 4`: Arpeggio / pitch offset table index.
6. `Byte 5`: Filter routing and resonance control mask.

---

## 6. Level, Economics, and Database Offsets (Vermeer Payload)

The main game engine is embedded in the payload starting at `$3724` (`vermeer.asm`: `W3724`, Line 7317). When the user presses the fire button, this block is copied to `$0801` and decrunched in-place by the ByteKiller decompressor.

### 6.1 Plantation Commodity Master Tables

| Commodity Name | German Identifier | Plantation Base Cost | Base Yield / Acre | Optimal Harvest Month | Risk Factors |
|---|---|---|---|---|---|
| **Tea** | `TEE` | 1,200 Gold | 80 cwt | June–August | Drought, red spider mite |
| **Coffee** | `KAFFEE` | 2,400 Gold | 65 cwt | September–November | Frost, coffee rust fungus |
| **Tobacco** | `TABAK` | 1,800 Gold | 110 cwt | July–September | Hail, blue mold |
| **Cocoa** | `KAKAO` | 3,100 Gold | 50 cwt | October–December | Flooding, black pod rot |

### 6.2 World Travel & Financial Network

| City Node | Node ID | Primary Activity | Travel Cost | Travel Duration | Currency Exchange Index |
|---|---|---|---|---|---|
| **London** | `0` | Christie's / Sotheby's Art Auctions, Bank of England loans | 350 Gold | 1 Day | 1.00 (Base Sterling) |
| **Paris** | `1` | Hotel Drouot Art Auctions, Luxury art dealers | 420 Gold | 2 Days | 0.85 |
| **Berlin** | `2` | Domestic art auctions, Plantation seed & worker agency | 280 Gold | 1 Day | 1.15 |
| **New York** | `3` | Metropolitan art auctions, High-stakes international loans | 1,800 Gold | 6 Days (Steamship) | 1.40 |

### 6.3 Historical Masterpiece Art Catalog (64 Paintings)

The art database comprises 64 catalog records. Each painting record is stored as an 8-byte structured entry:

```
+---------------+---------------+---------------+---------------+
| Byte 0: ID    | Byte 1: Artist| Bytes 2-3: Base Valuation     |
+---------------+---------------+---------------+---------------+
| Byte 4: Epoch | Byte 5: School| Byte 6: Forgery| Byte 7: State|
+---------------+---------------+---------------+---------------+
```

- **Artists Represented:**
  1. Johannes Vermeer (e.g. *Girl with a Pearl Earring*, *The Milkmaid*, *View of Delft*, *The Astronomer*)
  2. Rembrandt van Rijn
  3. Peter Paul Rubens
  4. Albrecht Dürer
  5. Lucas Cranach
  6. Frans Hals
  7. Hieronymus Bosch
  8. Pieter Bruegel
- **Forgery System:** Byte 6 contains the cryptographic authenticity flag (`$00` = Original Masterpiece, `$01`–`$FF` = Forgery variant). When inspected by an art expert in London or Paris, the expert's evaluation skill is compared against the forgery quality byte to reveal the truth.
- **Auction State:** Byte 7 tracks current owner (Player, Gerd, Kurt, Baron von ...) and museum loan status.
