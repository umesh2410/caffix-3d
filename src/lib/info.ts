// Information pages copied verbatim from the live storefront bundle (2026-10-28).
// Several details here disagree with other parts of the site (support hours, the "caffix.co"
// domain, "zero fillers" vs. the 3-in-1 recipe) and should be confirmed by the brand.

export interface InfoPage {
  slug: string;
  title: string;
  kicker: string;
  group: "Information" | "Support";
  sections?: { heading: string; body: string }[];
  faqs?: { q: string; a: string }[];
  articles?: { title: string; readTime: string; date: string; summary: string }[];
}

export const INFO_PAGES: InfoPage[] = [
  {
    slug: "bulk",
    title: "Bulk & Corporate Orders",
    kicker: "HoReCa · Offices, cafes & events",
    group: "Support",
    sections: [
      {
        heading: "Cold Coffee for Modern Workspaces",
        body: "Elevate your office pantry with premium instant cold coffee. No expensive espresso machines or milk steam wand maintenance required — your team can make barista-grade iced coffee in 5 seconds.",
      },
      {
        heading: "Festive & Corporate Gifting",
        body: "Curated gift hampers featuring 125g glass jars and assorted pocket sachet packs with custom branded packaging for corporate celebrations, Diwali gifting, and client appreciation.",
      },
      {
        heading: "Direct Wholesale Inquiries",
        body: "Special wholesale tiered pricing for orders exceeding 25 jars or 100 sachets. Reach our desk directly at caffix.official22@gmail.com or call +91 9313728209.",
      },
    ],
  },
  {
    slug: "blogs",
    title: "Caffix Coffee Journal & Guides",
    kicker: "Brew better at home",
    group: "Information",
    articles: [
      {
        title: "The Science of Cold-Steep Freeze Granulation",
        readTime: "3 min read",
        date: "September 2026",
        summary:
          "Traditional spray-dried coffee forms sticky clumps when dropped into cold milk because of high surface tension. Discover how Caffix freeze-crystallizes Arabica extract into micro-crystals that dissolve in 5 seconds flat with zero hot water.",
      },
      {
        title: "Arabica vs. Robusta: Why Your Cold Coffee Tastes Bitter",
        readTime: "4 min read",
        date: "September 2026",
        summary:
          "Robusta beans have double the caffeine and a harsh rubbery bite that requires heavy syrups to mask. Caffix uses 100% estate-grown Arabica for natural cocoa undertones that pair with chilled milk.",
      },
      {
        title: "5 Barista Tricks for Extra-Frothy Cold Coffee Without a Blender",
        readTime: "2 min read",
        date: "August 2026",
        summary:
          "No shaker or frother at home? A simple mason jar with cold milk, Caffix powder, and 3 ice cubes creates dense velvety micro-foam in just 5 vigorous shakes.",
      },
    ],
  },
  {
    slug: "about",
    title: "About Caffix Cold Coffee",
    kicker: "Crafted for chilled milk",
    group: "Support",
    sections: [
      {
        heading: "Born to Fix Cold Coffee",
        body: "For years, instant coffee drinkers were told to dissolve powder in warm water first before adding ice and cold milk. The result? Watered-down, lukewarm, bitter coffee. Caffix was born to engineer an instant coffee powder that dissolves directly into refrigerated cold milk without clumps.",
      },
      {
        heading: "100% Single-Origin Arabica",
        body: "We source premium beans from shade-grown estates in the Western Ghats of Karnataka, roast them to highlight rich chocolatey profiles, and freeze-granulate them so every granule melts in seconds.",
      },
      {
        heading: "Zero Chicory, Zero Fillers",
        body: "Pure coffee, rich aroma, and natural flavour infusions. Whether it's our bestselling Classic, toasted Hazelnut, or French Vanilla, you taste real coffee every single sip.",
      },
    ],
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    kicker: "Everything you need to know",
    group: "Support",
    faqs: [
      {
        q: "Does Caffix powder really dissolve in ice-cold milk without hot water?",
        a: "Yes, 100%! Caffix uses cold-crystallized micro-granules specifically engineered for cold milk. Just scoop 2-3 spoons (or tear 1 sachet), pour cold milk over ice, stir for 5 seconds, and enjoy thick, clumpless cold coffee.",
      },
      {
        q: "How many glasses does each 125g glass jar make?",
        a: "Each 125g jar serves 5 thick, indulgent café-style tall glasses (approximately 25g per tall 250ml glass of milk).",
      },
      {
        q: "How does the single-serve sachet work?",
        a: "Each single-serve pocket sachet is pre-measured for exactly 1 rich tall glass. Just tear, dump into cold milk, and stir!",
      },
      {
        q: "Does Caffix contain chicory or added preservatives?",
        a: "No. Caffix is made with 100% pure Arabica coffee beans with zero chicory, zero fillers, and no artificial chemical preservatives.",
      },
      {
        q: "What is the shelf life of the coffee?",
        a: "Unopened jars and sachets stay fresh for 12 months from manufacturing. After opening, keep the glass jar lid tightly closed in a cool, dry place.",
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact Caffix Support",
    kicker: "We're here to help",
    group: "Support",
    sections: [
      {
        heading: "Get in Touch with our Coffee Experts",
        body: "Have a question about your order, brewing tips, or product recommendations? Our team is always happy to chat cold coffee.",
      },
      { heading: "Email Support", body: "caffix.official22@gmail.com (Monday through Saturday, 9:00 AM – 7:00 PM IST)" },
      { heading: "Phone Support Desk", body: "+91 9313728209 (Monday through Saturday, 9:00 AM – 7:00 PM IST)" },
      {
        heading: "Roastery & Head Office",
        body: "Caffix Beverages Pvt. Ltd., 12th Main, 4th Cross, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India.",
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    kicker: "Legal & usage policies",
    group: "Information",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By accessing or ordering from Caffix Cold Coffee (caffix.co), you agree to be bound by these Terms of Service and all applicable laws and regulations in India.",
      },
      {
        heading: "2. Product Information & Pricing",
        body: "All Caffix 125g glass jars and single-serve pocket sachets are offered subject to availability. Prices listed in Indian Rupees (INR) include applicable GST. We reserve the right to revise promotional discounts at any time.",
      },
      {
        heading: "3. Orders & Payment",
        body: "Orders placed on Caffix are processed upon successful authorization via secure UPI, Credit/Debit cards, Net Banking, or supported digital wallets. Order confirmation is transmitted immediately via SMS and email.",
      },
      {
        heading: "4. Intellectual Property",
        body: "All brand names, formulas, graphics, jar packaging designs, and content are the intellectual property of Caffix Cold Coffee Co. Unauthorized duplication is strictly prohibited.",
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy & Data Protection Policy",
    kicker: "Your privacy matters",
    group: "Information",
    sections: [
      {
        heading: "1. Information We Collect",
        body: "We collect only essential details required to fulfill and deliver your cold coffee orders: your name, shipping address, mobile number for courier dispatch, and email for tracking notifications.",
      },
      {
        heading: "2. Payment Security",
        body: "Caffix never stores your card credentials, CVV, or bank login details. All transactions are encrypted via 256-bit SSL protocols through RBI-authorized payment gateways.",
      },
      {
        heading: "3. No Third-Party Data Selling",
        body: "We strictly never sell, rent, or trade your personal information to third-party advertisers. Your information is used strictly to deliver fresh coffee to your doorstep.",
      },
    ],
  },
  {
    slug: "refund",
    title: "Refund & Replacement Policy",
    kicker: "100% satisfaction guarantee",
    group: "Information",
    sections: [
      {
        heading: "7-Day Freshness & Damage Guarantee",
        body: "If your 125g glass jar arrives damaged, broken in transit, or if an incorrect flavour was delivered, notify us within 7 days of delivery with an unboxing photo. We will immediately dispatch a free replacement or issue a full refund.",
      },
      {
        heading: "Hassle-Free Resolution Process",
        body: "Simply email caffix.official22@gmail.com or call +91 9313728209 with your Order ID and photo. Our customer support team responds promptly and initiates resolutions within 24 hours.",
      },
      {
        heading: "Refund Timelines",
        body: "Refunds are processed back to your original source of payment (UPI/Card/Bank) within 3 to 5 business days.",
      },
    ],
  },
  {
    slug: "shipping",
    title: "Shipping & Delivery Policy",
    kicker: "Speedy pan-India dispatch",
    group: "Information",
    sections: [
      {
        heading: "Free Shipping on Orders Above ₹349",
        body: "All orders above ₹349 qualify for Free Express Shipping anywhere in India. For orders below ₹349, a nominal flat delivery charge of ₹40 applies.",
      },
      {
        heading: "Dispatch & Delivery Timeline",
        body: "Orders are freshly packed and dispatched within 24 hours from our Bengaluru roastery facility. Delivery to major metro cities takes 2 to 3 business days; other cities take 3 to 5 business days.",
      },
      {
        heading: "Live Order Tracking",
        body: "As soon as your package leaves our roastery, you will receive a tracking link via SMS and WhatsApp to monitor your shipment in real time.",
      },
    ],
  },
];

export function getInfoPage(slug: string): InfoPage | undefined {
  return INFO_PAGES.find((p) => p.slug === slug);
}
