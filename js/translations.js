// translations.js — all UI text in one place
// Structure: each key has all language versions together.
// To add a new language: add a new property to each entry, e.g. de: "..."
// To add a new key: add a new block following the same pattern.

const keys = {

  // ── Nav ────────────────────────────────────────────────────
  nav_home: {
    sv: "Startsida",
    en: "Home",
  },
  nav_gallery: {
    sv: "Mina verk",
    en: "My works",
  },
  nav_contact: {
    sv: "Kontakta mig",
    en: "Contact me",
  },

  // ── Hero ───────────────────────────────────────────────────
  hero_title: {
    sv: "Konst skapad\nmed hjärtat",
    en: "Art created\nfrom the heart",
  },
  hero_sub: {
    sv: "Akrylmålningar inspirerade av naturen, djur och de tysta stunderna som berör.",
    en: "Acrylic paintings inspired by nature, animals and the quiet moments that move you.",
  },
  hero_cta: {
    sv: "Se mina målningar",
    en: "See my paintings",
  },
  hero_scroll: {
    sv: "Scrolla",
    en: "Scroll",
  },

  // ── Intro ──────────────────────────────────────────────────
  intro_label: {
    sv: "Om konstnären",
    en: "About the artist",
  },
  intro_heading: {
    sv: "Hej, Devika här!",
    en: "Hi, Devika here!",
  },
  intro_p1: {
    sv: "Jag är konstnär och illustratör baserad i Sverige. Jag inspireras av naturen, relationer, djur och de tysta stunderna där känslor får ta plats utan filter.",
    en: "I'm an artist and illustrator based in Sweden. I draw inspiration from nature, relationships, animals and the quiet moments where emotions can surface without filters.",
  },
  intro_p2: {
    sv: "Genom min konst vill jag skapa närvaro och igenkänning – något som känns mänskligt, mjukt och äkta. Jag hoppas att det finns en målning som talar till dig. Hör av dig om ni vill veta mer om vad jag gör!",
    en: "Through my art I want to create presence and recognition – something that feels human, soft and genuine. I hope there's a painting that speaks to you. Reach out if you'd like to know more!",
  },
  intro_link: {
    sv: "Utforska galleriet",
    en: "Explore the gallery",
  },

  // ── Featured ───────────────────────────────────────────────
  featured_heading: {
    sv: "Utvalda verk",
    en: "Featured works",
  },
  featured_see_all: {
    sv: "Se alla →",
    en: "See all →",
  },

  // ── Gallery filters ────────────────────────────────────────
  filter_all: {
    sv: "Alla",
    en: "All",
  },
  filter_for_sale: {
    sv: "Till salu",
    en: "For sale",
  },
  filter_sold: {
    sv: "Sålda",
    en: "Sold",
  },
  filter_personal: {
    sv: "Personliga",
    en: "Personal",
  },

  // ── Footer ─────────────────────────────────────────────────
  footer_about_heading: {
    sv: "Hej, Devika här!",
    en: "Hi, Devika here!",
  },
  footer_about_p1: {
    sv: "Jag är konstnär och illustratör baserad i Sverige. Jag inspireras av naturen, relationer, djur och de tysta stunderna där känslor får ta plats utan filter.",
    en: "I'm an artist and illustrator based in Sweden. I draw inspiration from nature, relationships, animals and the quiet moments where emotions can surface without filters.",
  },
  footer_about_p2: {
    sv: "Genom min konst vill jag skapa närvaro och igenkänning – något som känns mänskligt, mjukt och äkta. Jag hoppas att det finns en målning som talar till dig. Hör av dig om ni vill veta mer om vad jag gör!",
    en: "Through my art I want to create presence and recognition – something that feels human, soft and genuine. I hope there's a painting that speaks to you. Reach out if you'd like to know more!",
  },
  footer_subscribe_btn: {
    sv: "🔔 Prenumerera på nyheter",
    en: "🔔 Subscribe to news",
  },
  footer_copy: {
    sv: "© 2026 Devika – All rights reserved",
    en: "© 2026 Devika – All rights reserved",
  },

  // ── Modal ──────────────────────────────────────────────────
  modal_sold: {
    sv: "Såld",
    en: "Sold",
  },
  modal_buy_btn: {
    sv: "✉ Skicka köpförfrågan",
    en: "✉ Send purchase inquiry",
  },
  status_sold: {
    sv: "Den här tavlan är såld.",
    en: "This painting has been sold.",
  },
  status_personal: {
    sv: "Den här tavlan är inte till salu.",
    en: "This painting is not for sale.",
  },

  // ── Form ───────────────────────────────────────────────────
  form_heading: {
    sv: "Skicka en förfrågan",
    en: "Send an inquiry",
  },
  form_sub: {
    sv: "Print, commission eller fråga? Hör av dig!",
    en: "Print, commission or question? Get in touch!",
  },
  form_name_label: {
    sv: "Namn",
    en: "Name",
  },
  form_name_ph: {
    sv: "Ditt namn",
    en: "Your name",
  },
  form_email_label: {
    sv: "E-post",
    en: "Email",
  },
  form_email_ph: {
    sv: "din@email.com",
    en: "your@email.com",
  },
  form_type_label: {
    sv: "Typ av förfrågan",
    en: "Type of inquiry",
  },
  form_type_default: {
    sv: "– Välj –",
    en: "– Select –",
  },
  form_type_originals: {
    sv: "Köpa original",
    en: "Buy original",
  },
  form_type_prints: {
    sv: "Print av befintlig målning",
    en: "Print of existing painting",
  },
  form_type_commission: {
    sv: "Commission (beställd målning)",
    en: "Commission (custom painting)",
  },
  form_type_general: {
    sv: "Allmän fråga",
    en: "General question",
  },
  form_artwork_label: {
    sv: "Vilket verk?",
    en: "Which work?",
  },
  form_artwork_default: {
    sv: "– Välj målning –",
    en: "– Select painting –",
  },
  form_msg_label: {
    sv: "Meddelande",
    en: "Message",
  },
  form_msg_ph: {
    sv: "Berätta mer...",
    en: "Tell me more...",
  },
  form_subscribe_lbl: {
    sv: "Ja, jag vill få mail när nya målningar läggs upp",
    en: "Yes, I'd like to receive emails when new paintings are added",
  },
  form_submit: {
    sv: "✉ Skicka",
    en: "✉ Send",
  },
  form_shipping_link: {
    sv: "📦 Frakt & leveransinformation",
    en: "📦 Shipping & delivery info",
  },

  // ── Buy message pre-fill ───────────────────────────────────
  buy_message: {
    sv: (title, size, price) => `Hej! Jag är intresserad av originalmålningen "${title}" (${size}) för ${price} kr.`,
    en: (title, size, price) => `Hi! I'm interested in the original painting "${title}" (${size}) for ${price} kr.`,
  },

  // ── Subscribe modal ────────────────────────────────────────
  subscribe_heading: {
    sv: "Håll dig uppdaterad",
    en: "Stay updated",
  },
  subscribe_sub: {
    sv: "Få ett mail när nya målningar läggs upp.",
    en: "Get an email when new paintings are added.",
  },

  // ── Success popup ──────────────────────────────────────────
  success_heading: {
    sv: "Tack för din förfrågan! 🎨",
    en: "Thank you for your inquiry! 🎨",
  },
  success_sub: {
    sv: "Jag återkommer så snart som möjligt.",
    en: "I'll get back to you as soon as possible.",
  },
  success_shipping: {
    sv: "📦 Läs om frakt & betalning",
    en: "📦 Read about shipping & payment",
  },

  // ── Shipping modal ─────────────────────────────────────────
  shipping_heading: {
    sv: "📦 Frakt & leverans",
    en: "📦 Shipping & delivery",
  },
  shipping_sweden_h: {
    sv: "Frakt inom Sverige",
    en: "Shipping within Sweden",
  },
  shipping_sweden_p: {
    sv: "Leveranstid 1–3 arbetsdagar via PostNord. Fraktkostnad beräknas per tavla beroende på storlek och vikt — exakt pris anges i din orderbekräftelse.",
    en: "Delivery time 1–3 business days via PostNord. Shipping cost is calculated per painting based on size and weight — exact price is stated in your order confirmation.",
  },
  shipping_europe_h: {
    sv: "Frakt inom Europa",
    en: "Shipping within Europe",
  },
  shipping_europe_p: {
    sv: "Leveranstid 3–7 arbetsdagar. Fraktkostnad varierar per destination och tavlans storlek. Kontakta mig för en offert innan köp.",
    en: "Delivery time 3–7 business days. Shipping cost varies by destination and painting size. Contact me for a quote before purchasing.",
  },
  shipping_packaging_h: {
    sv: "Förpackning",
    en: "Packaging",
  },
  shipping_packaging_p: {
    sv: "Varje målning packas omsorgsfullt med skyddsmaterial och stabil kartong för att säkerställa att den anländer i perfekt skick.",
    en: "Each painting is carefully packed with protective material and sturdy cardboard to ensure it arrives in perfect condition.",
  },
  shipping_payment_h: {
    sv: "Betalning",
    en: "Payment",
  },
  shipping_payment_p: {
    sv: "Betalning sker via Swish efter bekräftad order. Betalningsinformation skickas i samband med orderbekräftelsen.",
    en: "Payment is made via Swish after confirmed order. Payment details are sent with the order confirmation.",
  },
  shipping_returns_h: {
    sv: "Retur & reklamation",
    en: "Returns & complaints",
  },
  shipping_returns_p: {
    sv: "Du har 14 dagars returrätt. Tavlan ska returneras i originalskick och i originalförpackning. Returfrakten bekostas av köparen. Vid skada under transport — kontakta mig omgående med foton så löser vi det.",
    en: "You have 14 days right of return. The painting must be returned in its original condition and packaging. Return shipping is at the buyer's expense. In case of damage during transport — contact me immediately with photos and we'll sort it out.",
  },
};

// Build the translations object that i18n.js expects
// This runs once and converts { key: { sv, en } } → { sv: { key: val }, en: { key: val } }
const translations = {};
for (const [key, langs] of Object.entries(keys)) {
  for (const [lang, val] of Object.entries(langs)) {
    if (!translations[lang]) translations[lang] = {};
    translations[lang][key] = val;
  }
}