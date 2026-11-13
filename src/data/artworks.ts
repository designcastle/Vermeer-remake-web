// src/data/artworks.ts
// Source of truth: docs/assets.md §6.3 — 64 records, 8-byte struct:
//   Byte 0 ID | Byte 1 Artist | Bytes 2-3 Base Valuation | Byte 4 Epoch | Byte 5 School | Byte 6 Forgery | Byte 7 State
// Byte 6: $00 = Original masterpiece, $01–$FF = forgery quality.

export interface Artist { id: number; name: string; short: string; school: string }

export const ARTISTS: Record<number, Artist> = {
  1: { id: 1, name: 'Johannes Vermeer', short: 'Vermeer', school: 'Dutch Golden Age' },
  2: { id: 2, name: 'Rembrandt van Rijn', short: 'Rembrandt', school: 'Dutch Golden Age' },
  3: { id: 3, name: 'Peter Paul Rubens', short: 'Rubens', school: 'Flemish Baroque' },
  4: { id: 4, name: 'Albrecht Dürer', short: 'Dürer', school: 'Northern Renaissance' },
  5: { id: 5, name: 'Lucas Cranach', short: 'Cranach', school: 'Northern Renaissance' },
  6: { id: 6, name: 'Frans Hals', short: 'Hals', school: 'Dutch Golden Age' },
  7: { id: 7, name: 'Hieronymus Bosch', short: 'Bosch', school: 'Early Netherlandish' },
  8: { id: 8, name: 'Pieter Bruegel', short: 'Bruegel', school: 'Flemish Renaissance' },
};

export interface Artwork {
  id: number;          // Byte 0
  artistId: number;    // Byte 1
  baseValue: number;   // Bytes 2-3
  epochYear: number;   // Byte 4
  schoolCode: number;  // Byte 5
  forgery: number;     // Byte 6
  state: number;       // Byte 7
  title: string;
  artist: Artist;
}

type Row = [number, number, number, number, number, number, number, string];

const RAW: Row[] = [
  [0, 1, 14500, 1665, 1, 0x00, 0, 'Girl with a Pearl Earring'],
  [1, 1, 13200, 1658, 1, 0x00, 0, 'The Milkmaid'],
  [2, 1, 15800, 1660, 1, 0x00, 0, 'View of Delft'],
  [3, 1, 11800, 1668, 1, 0x00, 0, 'The Astronomer'],
  [4, 1, 16500, 1666, 1, 0x00, 0, 'The Art of Painting'],
  [5, 1, 10400, 1657, 1, 0xc8, 0, 'The Little Street (Attribution)'],
  [6, 1, 11200, 1664, 1, 0x00, 0, 'Woman Holding a Balance'],
  [7, 1, 9800, 1669, 1, 0xdc, 0, 'The Lacemaker (Van Meegeren Study)'],
  [8, 2, 16000, 1642, 1, 0x00, 0, 'The Night Watch'],
  [9, 2, 12400, 1632, 1, 0x00, 0, 'The Anatomy Lesson of Dr. Tulp'],
  [10, 2, 13800, 1662, 1, 0x00, 0, "The Syndics of the Drapers' Guild"],
  [11, 2, 14200, 1633, 1, 0x00, 0, 'Storm on the Sea of Galilee'],
  [12, 2, 10800, 1667, 1, 0x00, 0, 'The Jewish Bride'],
  [13, 2, 9500, 1659, 1, 0xb4, 0, 'Self-Portrait with Two Circles'],
  [14, 2, 11600, 1669, 1, 0x00, 0, 'Return of the Prodigal Son'],
  [15, 2, 8900, 1650, 1, 0xd8, 0, 'Man in the Golden Helmet'],
  [16, 3, 12800, 1612, 2, 0x00, 0, 'The Descent from the Cross'],
  [17, 3, 11500, 1635, 2, 0x00, 0, 'The Garden of Love'],
  [18, 3, 10900, 1617, 2, 0x00, 0, 'The Hippopotamus and Crocodile Hunt'],
  [19, 3, 13400, 1611, 2, 0x00, 0, 'Massacre of the Innocents'],
  [20, 3, 9600, 1609, 2, 0x00, 0, 'Samson and Delilah'],
  [21, 3, 8800, 1639, 2, 0xbe, 0, 'The Three Graces (Workshop)'],
  [22, 3, 10200, 1626, 2, 0x00, 0, 'Portrait of Susanna Lunden'],
  [23, 3, 9100, 1636, 2, 0xd0, 0, 'Autumn Landscape at Het Steen'],
  [24, 4, 13600, 1500, 3, 0x00, 0, 'Self-Portrait at Twenty-Eight'],
  [25, 4, 9800, 1502, 3, 0x00, 0, 'Young Hare'],
  [26, 4, 12200, 1504, 3, 0x00, 0, 'Adoration of the Magi'],
  [27, 4, 11400, 1506, 3, 0x00, 0, 'Feast of the Rosary'],
  [28, 4, 8600, 1508, 3, 0xa8, 0, 'Praying Hands (Folio Copy)'],
  [29, 4, 10500, 1526, 3, 0x00, 0, 'The Four Apostles'],
  [30, 4, 9200, 1514, 3, 0x00, 0, 'Melencolia I'],
  [31, 4, 8400, 1521, 3, 0xc4, 0, 'Portrait of Hieronymus Holzschuher'],
  [32, 5, 9400, 1532, 3, 0x00, 0, 'Venus and Cupid the Honey Thief'],
  [33, 5, 10600, 1530, 3, 0x00, 0, 'Judith with the Head of Holofernes'],
  [34, 5, 11200, 1546, 3, 0x00, 0, 'The Fountain of Youth'],
  [35, 5, 8500, 1529, 3, 0x00, 0, 'Portrait of Martin Luther'],
  [36, 5, 8900, 1530, 3, 0xb8, 0, 'The Judgment of Paris'],
  [37, 5, 9700, 1526, 3, 0x00, 0, 'Adam and Eve'],
  [38, 5, 8200, 1537, 3, 0xd4, 0, 'Sibylle of Cleves as Bride'],
  [39, 5, 9100, 1533, 3, 0x00, 0, 'The Nymph of the Spring'],
  [40, 6, 11800, 1624, 1, 0x00, 0, 'The Laughing Cavalier'],
  [41, 6, 9300, 1628, 1, 0x00, 0, 'Malle Babbe'],
  [42, 6, 9900, 1628, 1, 0x00, 0, 'The Gypsy Girl'],
  [43, 6, 12100, 1616, 1, 0x00, 0, 'Banquet of the St George Civic Guard'],
  [44, 6, 8700, 1623, 1, 0xc2, 0, 'The Lute Player (Haarlem Copy)'],
  [45, 6, 10100, 1622, 1, 0x00, 0, 'Marriage Portrait of Isaac Massa'],
  [46, 6, 9500, 1664, 1, 0x00, 0, "Regents of the Old Men's Almshouse"],
  [47, 6, 8100, 1630, 1, 0xde, 0, 'Young Man with a Skull'],
  [48, 7, 16800, 1500, 4, 0x00, 0, 'The Garden of Earthly Delights'],
  [49, 7, 13900, 1501, 4, 0x00, 0, 'The Temptation of St. Anthony'],
  [50, 7, 12600, 1516, 4, 0x00, 0, 'The Haywain Triptych'],
  [51, 7, 10800, 1495, 4, 0x00, 0, 'The Ship of Fools'],
  [52, 7, 13100, 1505, 4, 0x00, 0, 'The Last Judgment (Vienna)'],
  [53, 7, 9200, 1494, 4, 0xcc, 0, 'Extraction of the Stone of Madness'],
  [54, 7, 9600, 1502, 4, 0x00, 0, 'The Wayfarer'],
  [55, 7, 8800, 1510, 4, 0xe0, 0, 'Christ Carrying the Cross (Copy)'],
  [56, 8, 15200, 1565, 5, 0x00, 0, 'The Hunters in the Snow'],
  [57, 8, 14800, 1563, 5, 0x00, 0, 'The Tower of Babel'],
  [58, 8, 13400, 1567, 5, 0x00, 0, 'The Peasant Wedding'],
  [59, 8, 12900, 1559, 5, 0x00, 0, 'Netherlandish Proverbs'],
  [60, 8, 14100, 1562, 5, 0x00, 0, 'The Triumph of Death'],
  [61, 8, 11700, 1565, 5, 0x00, 0, 'The Harvesters'],
  [62, 8, 10300, 1560, 5, 0xba, 0, "Children's Games (Antwerp Copy)"],
  [63, 8, 11100, 1568, 5, 0x00, 0, 'The Parable of the Blind'],
];

export const ARTWORKS: Artwork[] = RAW.map(([id, artistId, baseValue, epochYear, schoolCode, forgery, state, title]) => ({
  id, artistId, baseValue, epochYear, schoolCode, forgery, state, title, artist: ARTISTS[artistId],
}));

export const artworkById = (id: number): Artwork => ARTWORKS[id];
export const isAuthentic = (a: Artwork): boolean => a.forgery === 0x00;

// Three catalog entries have no clean Public Domain thumbnail; those use painted PNG stand-ins.
const PNG_FALLBACK = new Set([22, 33, 36]);
export const paintingSrc = (id: number): string =>
  `./assets/paintings/art_${String(id).padStart(2, '0')}.${PNG_FALLBACK.has(id) ? 'png' : 'jpg'}`;
