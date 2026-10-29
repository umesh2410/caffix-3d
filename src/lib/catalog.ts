// Product catalogue mirrored from the live thecaffix.in storefront (bundle as of 2026-10-28).
// Copy, prices, image paths, badges, ratings and nutrition are kept verbatim from that data.
// Ratings/review counts and nutrition values could not be independently verified.

export type Category = "jar" | "sachet" | "combo" | "instant-coffee" | "essential";
export type FlavourId = "classic" | "vanilla" | "hazelnut" | "irish" | "mocha";

export interface Product {
  id: string;
  name: string;
  officialName: string;
  category: Category;
  flavourId?: FlavourId;
  price: number;
  mrp: number;
  packLabel: string;
  servings?: string;
  short: string;
  description: string;
  image: string;
  images: string[];
  /** Combos: number of distinct flavours the customer picks. */
  pickFlavours?: number;
  /** Combos that always contain every flavour. */
  allFlavours?: boolean;
  /** Fields below are copied from the live storefront data. */
  badge?: string;
  rating?: number;
  reviewsCount?: number;
  nutrition?: { calories: string; caffeine: string; dissolve: string };
  soldOut?: boolean;
}

export interface Flavour {
  id: FlavourId;
  name: string;
  sub: string;
  color: string;
  image: string;
  photo: string;
  jarId: string;
  sachetId: string;
  /** Visual system for the 3D label and the flavour stage. */
  label: { bg: string; ink: string; accent: string; powder: string; word1: string; word2: string };
  stage: string;
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "jar", label: "Jars" },
  { id: "sachet", label: "Sachets" },
  { id: "combo", label: "Combos" },
  { id: "instant-coffee", label: "Instant Coffee" },
  { id: "essential", label: "Essentials" },
];

export const SACHET_IMAGE = "/images/hero_sachets_new_drop.jpg";
export const HERO_JARS_IMAGE = "/images/hero_jars_bestsellers_perfect_2x.png";
export const HERO_JARS_ART_IMAGE = "/images/hero_jars_bestsellers_art_2x.png";
export const BREW_GUIDE_IMAGE = "/images/caffix_how_to_brew_guide.png";
export const LOGO_IMAGE = "/images/caffix-logo-vertical.png";
export const MASCOT_IMAGE = "/image/feviconlogo.png";

export const FLAVOURS: Flavour[] = [
  {
    id: "classic",
    name: "Classic Crest",
    sub: "Pure Arabica Roast",
    color: "#4A2C11",
    image: "/images/jar_classic_crest_square.jpg",
    photo: "/images/jar_classic_crest.png",
    jarId: "caffix-classic-jar",
    sachetId: "caffix-classic-sachet",
    label: { bg: "#E9DCC6", ink: "#2B1A0E", accent: "#8A5A2B", powder: "#B98A5A", word1: "Classic", word2: "crest" },
    stage: "#2A190D",
  },
  {
    id: "vanilla",
    name: "Vanilla Velvet",
    sub: "Madagascar Vanilla",
    color: "#E5C158",
    image: "/images/jar_vanilla_velvet_square.jpg",
    photo: "/images/jar_vanilla_velvet.jpg",
    jarId: "caffix-vanilla-jar",
    sachetId: "caffix-vanilla-sachet",
    label: { bg: "#F3E6C4", ink: "#3A2A12", accent: "#A9822A", powder: "#D7B98A", word1: "Vanilla", word2: "velvet" },
    stage: "#3A2C12",
  },
  {
    id: "hazelnut",
    name: "Hazel Gold",
    sub: "Roasted Hazelnut",
    color: "#8C5824",
    image: "/images/jar_hazel_gold_square.jpg",
    photo: "/images/jar_hazel_gold.jpg",
    jarId: "caffix-hazelnut-jar",
    sachetId: "caffix-hazelnut-sachet",
    label: { bg: "#17120D", ink: "#F4EBDD", accent: "#D9A35B", powder: "#A87445", word1: "Hazel", word2: "gold" },
    stage: "#3B230F",
  },
  {
    id: "irish",
    name: "Irish Emerald",
    sub: "Irish Cream & Malt",
    color: "#1E4733",
    image: "/images/jar_irish_emerald.png",
    photo: "/images/jar_irish_emerald.png",
    jarId: "caffix-irish-jar",
    sachetId: "caffix-irish-sachet",
    label: { bg: "#12261B", ink: "#F1EBDD", accent: "#8DBB98", powder: "#9C7A55", word1: "Irish", word2: "emerald" },
    stage: "#11261B",
  },
  {
    id: "mocha",
    name: "Mocha Bliss",
    sub: "Dutch Cocoa & Arabica",
    color: "#3B1E13",
    image: "/images/jar_mocha_bliss.jpg",
    photo: "/images/jar_mocha_bliss.jpg",
    jarId: "caffix-mocha-jar",
    sachetId: "caffix-mocha-sachet",
    label: { bg: "#24130C", ink: "#F3E7DA", accent: "#D09062", powder: "#6E4428", word1: "Mocha", word2: "bliss" },
    stage: "#2C140B",
  },
];

const JAR_PACK = "125g airtight glass jar";

type Meta = Pick<Product, "badge" | "rating" | "reviewsCount" | "soldOut"> & { n?: [string, string, string] };
const COLD = "5 seconds in cold milk";
const LIVE_META: Record<string, Meta> = {
  "caffix-classic-jar": { badge: "Bestseller", rating: 4.9, reviewsCount: 3240, n: ["4 kcal", "70 mg", COLD] },
  "caffix-vanilla-jar": { badge: "Super Creamy", rating: 4.9, reviewsCount: 2680, n: ["6 kcal", "65 mg", COLD] },
  "caffix-hazelnut-jar": { badge: "#1 Top Rated", rating: 4.9, reviewsCount: 3890, n: ["5 kcal", "65 mg", COLD] },
  "caffix-irish-jar": { badge: "Chef's Reserve", rating: 4.8, reviewsCount: 1820, n: ["6 kcal", "68 mg", COLD] },
  "caffix-mocha-jar": { badge: "Choco Hit", rating: 4.8, reviewsCount: 2150, n: ["8 kcal", "60 mg", COLD] },
  "caffix-classic-sachet": { badge: "Pocket Brew", rating: 4.9, reviewsCount: 1420, n: ["4 kcal", "70 mg", COLD] },
  "caffix-vanilla-sachet": { badge: "Vanilla Hit", rating: 4.9, reviewsCount: 1190, n: ["6 kcal", "65 mg", COLD] },
  "caffix-hazelnut-sachet": { badge: "Nutty Treat", rating: 4.9, reviewsCount: 1850, n: ["5 kcal", "65 mg", COLD] },
  "caffix-irish-sachet": { badge: "Irish Touch", rating: 4.8, reviewsCount: 860, n: ["6 kcal", "68 mg", COLD] },
  "caffix-mocha-sachet": { badge: "Choco Treat", rating: 4.8, reviewsCount: 1240, n: ["8 kcal", "60 mg", COLD] },
  "caffix-duo-combo": { badge: "Bestseller Duo", rating: 4.9, reviewsCount: 3840, n: ["4-8 kcal", "60-70 mg", COLD] },
  "caffix-trio-combo": { badge: "Popular Trio", rating: 4.9, reviewsCount: 4210, n: ["4-8 kcal", "60-70 mg", COLD] },
  "caffix-quad-combo": { badge: "Super Value", rating: 5, reviewsCount: 2950, n: ["4-8 kcal", "60-70 mg", COLD] },
  "caffix-mega-combo": { badge: "All 5 Jars Included", rating: 5, reviewsCount: 5490, n: ["4-8 kcal", "60-70 mg", COLD] },
  "caffix-instant-black-coffee": {
    badge: "100% Pure Coffee",
    rating: 4.9,
    reviewsCount: 1680,
    n: ["2 kcal", "85 mg", "Instant in hot or cold water"],
  },
  "caffix-handheld-frother": { badge: "Sold Out", rating: 4.8, reviewsCount: 940, soldOut: true },
  "caffix-v60-dripper": { badge: "Sold Out", rating: 4.9, reviewsCount: 620, soldOut: true },
  "caffix-v60-filter-paper": { badge: "Sold Out", rating: 4.9, reviewsCount: 780, soldOut: true },
};

const BASE_PRODUCTS: Product[] = [
  {
    id: "caffix-classic-jar",
    name: "Classic Crest",
    officialName: "CLASSIC CREST | JAR",
    category: "jar",
    flavourId: "classic",
    price: 150,
    mrp: 150,
    packLabel: JAR_PACK,
    servings: "About 5 tall glasses",
    short: "Airtight glass jar of pure 100% Arabica instant cold coffee powder.",
    description:
      "Our signature freeze-dried instant cold coffee powder in an airtight glass jar. Crafted from 100% pure high-grown Arabica beans roasted to a smooth, chocolatey profile. Specially granulated to dissolve in ice-cold milk in just 5 seconds without hot water or lumps.",
    image: "/images/jar_classic_crest_square.jpg",
    images: ["/images/jar_classic_crest.png", BREW_GUIDE_IMAGE],
  },
  {
    id: "caffix-vanilla-jar",
    name: "Vanilla Velvet",
    officialName: "VANILLA VELVET | JAR",
    category: "jar",
    flavourId: "vanilla",
    price: 150,
    mrp: 150,
    packLabel: JAR_PACK,
    servings: "About 5 tall glasses",
    short: "Sweet aromatic vanilla bean notes blended with cold coffee powder.",
    description:
      "An elegant, fragrant cold coffee experience in an airtight glass jar. Blended with natural Madagascar vanilla bean notes and micro-ground Arabica coffee. Dissolves cleanly in chilled milk for an exquisite French vanilla iced latte at home.",
    image: "/images/jar_vanilla_velvet_square.jpg",
    images: ["/images/jar_vanilla_velvet.jpg", BREW_GUIDE_IMAGE],
  },
  {
    id: "caffix-hazelnut-jar",
    name: "Hazel Gold",
    officialName: "HAZEL GOLD | JAR",
    category: "jar",
    flavourId: "hazelnut",
    price: 150,
    mrp: 150,
    packLabel: JAR_PACK,
    servings: "About 5 tall glasses",
    short: "Toasted roasted hazelnut aroma fused into rich Arabica powder.",
    description:
      "Our #1 customer favorite! Packed in an airtight jar and infused with real toasted hazelnut aroma that complements cold milk with a nutty, buttery fragrance for a barista-style cold coffee.",
    image: "/images/jar_hazel_gold_square.jpg",
    images: ["/images/jar_hazel_gold.jpg", BREW_GUIDE_IMAGE],
  },
  {
    id: "caffix-irish-jar",
    name: "Irish Emerald",
    officialName: "IRISH EMERALD | JAR",
    category: "jar",
    flavourId: "irish",
    price: 150,
    mrp: 150,
    packLabel: JAR_PACK,
    servings: "About 5 tall glasses",
    short: "Non-alcoholic Irish cream notes with dark roasted cold coffee.",
    description:
      "A decadent, sophisticated cold coffee experience in an airtight jar. Features notes of creamy vanilla, toasted malt, and non-alcoholic Irish cream balanced with deep roasted Arabica coffee.",
    image: "/images/jar_irish_emerald.png",
    images: ["/images/jar_irish_emerald.png", BREW_GUIDE_IMAGE],
  },
  {
    id: "caffix-mocha-jar",
    name: "Mocha Bliss",
    officialName: "MOCHA BLISS | JAR",
    category: "jar",
    flavourId: "mocha",
    price: 150,
    mrp: 150,
    packLabel: JAR_PACK,
    servings: "About 5 tall glasses",
    short: "Dutch cocoa and Arabica coffee powder for an iced mocha.",
    description:
      "The dream cold coffee jar for chocolate aficionados. Premium Dutch cocoa powder finely micro-granulated with bold Arabica coffee. Dissolves cold with no bitter residue.",
    image: "/images/jar_mocha_bliss.jpg",
    images: ["/images/jar_mocha_bliss.jpg", BREW_GUIDE_IMAGE],
  },
  {
    id: "caffix-classic-sachet",
    name: "Classic Cold Coffee Sachet",
    officialName: "Classic Cold Coffee Sachet",
    category: "sachet",
    flavourId: "classic",
    price: 30,
    mrp: 30,
    packLabel: "Single-serve sachet",
    servings: "Serves 1 glass",
    short: "Single-serve sachet of 100% pure Arabica instant cold coffee powder. Dissolves in cold milk in 5 seconds.",
    description:
      "Your favorite signature Classic cold coffee in a slim single-serve pocket sachet. Just tear, pour into chilled milk with ice, and stir for 5 seconds. Perfect for work desks, travel, or quick refreshments with zero clumps.",
    image: SACHET_IMAGE,
    images: [SACHET_IMAGE],
  },
  {
    id: "caffix-vanilla-sachet",
    name: "French Vanilla Cold Coffee Sachet",
    officialName: "French Vanilla Cold Coffee Sachet",
    category: "sachet",
    flavourId: "vanilla",
    price: 30,
    mrp: 30,
    packLabel: "Single-serve sachet",
    servings: "Serves 1 glass",
    short: "Single-serve French vanilla cold coffee powder sachet. Rich natural vanilla aroma.",
    description:
      "An instant iced vanilla latte on demand. Infused with Madagascar vanilla bean notes and micro-crystallized Arabica coffee in a single-serve sachet. Dissolves instantly in ice-cold milk.",
    image: SACHET_IMAGE,
    images: [SACHET_IMAGE],
  },
  {
    id: "caffix-hazelnut-sachet",
    name: "Hazelnut Cold Coffee Sachet",
    officialName: "Hazelnut Cold Coffee Sachet",
    category: "sachet",
    flavourId: "hazelnut",
    price: 30,
    mrp: 30,
    packLabel: "Single-serve sachet",
    servings: "Serves 1 glass",
    short: "Single-serve roasted hazelnut cold coffee sachet. Warm, nutty, and buttery aroma.",
    description:
      "Customer-favorite toasted hazelnut flavour in a slim on-the-go sachet. Tear and mix directly with cold milk and ice cubes for café-quality cold coffee in 5 seconds flat.",
    image: SACHET_IMAGE,
    images: [SACHET_IMAGE],
  },
  {
    id: "caffix-irish-sachet",
    name: "Irish Cream Cold Coffee Sachet",
    officialName: "Irish Cream Cold Coffee Sachet",
    category: "sachet",
    flavourId: "irish",
    price: 30,
    mrp: 30,
    packLabel: "Single-serve sachet",
    servings: "Serves 1 glass",
    short: "Single-serve Irish cream cold coffee sachet. Rich malt & cream notes.",
    description:
      "A velvety, non-alcoholic Irish cream experience in a single-serve sachet. Blended with deep-roasted Arabica coffee for a creamy, decadent glass of cold coffee in 5 seconds.",
    image: SACHET_IMAGE,
    images: [SACHET_IMAGE],
  },
  {
    id: "caffix-mocha-sachet",
    name: "Dark Mocha Cold Coffee Sachet",
    officialName: "Dark Mocha Cold Coffee Sachet",
    category: "sachet",
    flavourId: "mocha",
    price: 30,
    mrp: 30,
    packLabel: "Single-serve sachet",
    servings: "Serves 1 glass",
    short: "Single-serve Dutch cocoa and cold coffee sachet. Rich iced mocha in 5 seconds.",
    description:
      "Pure Dutch cocoa and Arabica coffee in an individual sachet. Dissolves directly into cold milk without heating or clumping, giving you a thick iced café mocha in 5 seconds.",
    image: SACHET_IMAGE,
    images: [SACHET_IMAGE],
  },
  {
    id: "caffix-duo-combo",
    name: "Duo CAFFIX",
    officialName: "Duo CAFFIX",
    category: "combo",
    price: 270,
    mrp: 300,
    packLabel: "Pack of 2 jars (125g each)",
    short: "Customise your Duo! Select any 2 flavours from our 5 signature 125g airtight jars.",
    description:
      "The Duo CAFFIX lets you craft your personal iced coffee combo. Pick any 2 out of our 5 signature 125g airtight glass jars (Classic Crest, Vanilla Velvet, Hazel Gold, Irish Emerald, or Mocha Bliss). 100% pure Arabica cold coffee powder that dissolves in cold milk in 5 seconds.",
    image: HERO_JARS_ART_IMAGE,
    images: [HERO_JARS_ART_IMAGE, BREW_GUIDE_IMAGE],
    pickFlavours: 2,
  },
  {
    id: "caffix-trio-combo",
    name: "Trio CAFFIX",
    officialName: "Trio CAFFIX",
    category: "combo",
    price: 396,
    mrp: 450,
    packLabel: "Pack of 3 jars (125g each)",
    short: "Customise your Trio! Select any 3 flavours from our 5 signature 125g airtight jars.",
    description:
      "The Trio CAFFIX gives you the freedom to choose your top 3 favourites. Pick any 3 flavours from Classic Crest, Vanilla Velvet, Hazel Gold, Irish Emerald, and Mocha Bliss. Specially micro-granulated to dissolve instantly in ice-cold milk with zero clumping.",
    image: HERO_JARS_IMAGE,
    images: [HERO_JARS_IMAGE, BREW_GUIDE_IMAGE],
    pickFlavours: 3,
  },
  {
    id: "caffix-quad-combo",
    name: "Quad CAFFIX",
    officialName: "Quad CAFFIX",
    category: "combo",
    price: 510,
    mrp: 600,
    packLabel: "Pack of 4 jars (125g each)",
    short: "Customise your Quad! Select any 4 flavours from our 5 signature 125g airtight jars.",
    description:
      "Stock up on variety with the Quad CAFFIX! Pick any 4 out of 5 signature cold coffee flavours. Enjoy silky café-thick cold coffee at home in 5 seconds flat with zero hot water needed.",
    image: HERO_JARS_IMAGE,
    images: [HERO_JARS_IMAGE, BREW_GUIDE_IMAGE],
    pickFlavours: 4,
  },
  {
    id: "caffix-mega-combo",
    name: "MEGA CAFFIX",
    officialName: "MEGA CAFFIX",
    category: "combo",
    price: 615,
    mrp: 750,
    packLabel: "Pack of 5 jars (125g each)",
    short: "The ultimate collection! Includes all 5 signature flavours in full-size 125g airtight jars.",
    description:
      "The complete Caffix grand collection! Includes all 5 signature flavours: Classic Crest, Vanilla Velvet, Hazel Gold, Irish Emerald, and Mocha Bliss. Crafted from 100% pure Arabica coffee freeze-crystallized to dissolve in cold milk in 5 seconds.",
    image: HERO_JARS_IMAGE,
    images: [HERO_JARS_IMAGE, BREW_GUIDE_IMAGE],
    allFlavours: true,
  },
  {
    id: "caffix-instant-black-coffee",
    name: "Pure Black Instant Coffee",
    officialName: "PURE BLACK | INSTANT COFFEE",
    category: "instant-coffee",
    price: 300,
    mrp: 300,
    packLabel: "125g airtight glass jar",
    servings: "Serves 60+ cups",
    short: "Pure 100% Arabica freeze-dried instant black coffee powder in an airtight 125g glass jar.",
    description:
      "Experience the pure, unadulterated taste of café-grade black coffee. Crafted from 100% high-altitude Arabica coffee beans roasted dark and freeze-crystallized to lock in intense aroma and deep chocolatey undertones. Specially micro-granulated to dissolve instantly in hot or cold water with an authentic golden crema and zero bitterness. 100% pure coffee — zero chicory, zero added sugar.",
    image: "/images/jar_instant_black_coffee.jpg",
    images: ["/images/jar_instant_black_coffee.jpg", "/images/jar_instant_black_cup.jpg", BREW_GUIDE_IMAGE],
  },
  {
    id: "caffix-handheld-frother",
    name: "Electric Milk Frother",
    officialName: "CAFFIX ELECTRIC MILK FROTHER",
    category: "essential",
    price: 199,
    mrp: 299,
    packLabel: "Electric whisk + stand",
    short: "Ultra-fast handheld electric milk frother for rich café-style velvety cold foam.",
    description:
      "Craft dense, café-grade microfoam in under 15 seconds. High-torque motor with dual-speed stainless steel spiral whisk. Perfect for cold coffee, hot lattes, cappuccinos, and matcha. Ergonomic matte finish handle with quick one-touch power button.",
    image: "/images/essential_frother.jpg",
    images: ["/images/essential_frother.jpg"],
  },
  {
    id: "caffix-v60-dripper",
    name: "V60 Pour Over Dripper",
    officialName: "CAFFIX V60 POUR OVER DRIPPER",
    category: "essential",
    price: 499,
    mrp: 699,
    packLabel: "Ceramic V60 cone · Size 02",
    servings: "Serves 1–4 cups",
    short: "Signature spiral-ribbed V60 pour over coffee dripper for optimal artisanal extraction.",
    description:
      "Engineered with 60-degree angled conical walls and internal curved spiral ribs that allow maximum coffee expansion and even flow control. Delivers a clean, nuanced, and aromatic cup of pour over coffee.",
    image: "/images/essential_v60_dripper.jpg",
    images: ["/images/essential_v60_dripper.jpg"],
  },
  {
    id: "caffix-v60-filter-paper",
    name: "V60 Filter Paper (100 pcs)",
    officialName: "CAFFIX V60 FILTER PAPER (100 PCS)",
    category: "essential",
    price: 299,
    mrp: 399,
    packLabel: "Pack of 100 sheets · Size 02",
    short: "100% natural virgin wood pulp V60 cone filter papers. Sediment-free pure brew.",
    description:
      "Premium oxygen-cleansed natural paper filters designed specifically for Size 02 conical drippers. Traps fine sediment and excess oils while preserving the delicate aromas and flavor clarity of your brew. Zero paper taste or residue.",
    image: "/images/essential_filter_paper.jpg",
    images: ["/images/essential_filter_paper.jpg"],
  },
];

export const PRODUCTS: Product[] = BASE_PRODUCTS.map((p) => {
  const { n, ...meta } = LIVE_META[p.id] ?? {};
  return {
    ...p,
    ...meta,
    nutrition: n ? { calories: `${n[0]} / serving`, caffeine: `${n[1]} / serving`, dissolve: n[2] } : undefined,
  };
});

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getFlavour(id: string): Flavour | undefined {
  return FLAVOURS.find((f) => f.id === id);
}

export function discountPercent(p: Pick<Product, "price" | "mrp">): number {
  return p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
}

/** Second image worth showing on hover (skips the shared brew guide). */
export function altImage(p: Product): string | undefined {
  return p.images.find((src) => src !== p.image && src !== BREW_GUIDE_IMAGE);
}

export const BRAND = {
  name: "CAFFIX",
  url: "https://www.thecaffix.in",
  email: "caffix.official22@gmail.com",
  phone: "+91 9313728209",
  phoneHref: "tel:+919313728209",
  whatsapp: "https://wa.me/919313728209",
  instagram: "https://www.instagram.com/thecaffix.in",
  facebook: "https://www.facebook.com/share/14u3Fp9eNhR/",
  supportHours: "Monday to Saturday | 10:00 AM to 6:00 PM",
  title: "CAFFIX | Crafted for Your Coffee Cravings",
  description:
    "Fresh, creamy and chilled cold coffee made for every mood. Café-style cold coffee handcrafted with premium ingredients, delivered chilled to your doorstep.",
};
