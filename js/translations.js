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
 nav_commissions: {
  sv: "Beställningar",
  en: "Commissions",
},
  nav_back: {
    sv: "Tillbaka",
    en: "Back",
  },

  // ── Hero ───────────────────────────────────────────────────
  hero_title: {
    sv: "Konst skapad\nmed hjärtat",
    en: "Art created\nfrom the heart",
  },
  hero_sub: {
    sv: "Akrylmålningar inspirerade av naturen och djur.",
    en: "Acrylic paintings inspired by nature and animals.",
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
    sv: "Genom min konst vill jag skapa närvaro och igenkänning – något som känns mänskligt, mjukt och äkta. Jag hoppas att det finns en målning som talar till dig. Hör av dig om du vill veta mer om vad jag gör!",
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
  form_size_label: {
    sv: "Storlek",
    en: "Size",
  },
  form_size_default: {
    sv: "– Välj storlek –",
    en: "– Select size –",
  },
  form_image_label: {
    sv: "Referensbild",
    en: "Reference image",
  },
  form_image_type_error: {
    sv: "Filen måste vara en bild.",
    en: "The file must be an image.",
  },
  form_image_size_error: {
    sv: "Bilden får max vara 5 MB.",
    en: "Image must be 5 MB or less.",
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

  // ── Commissions page ──────────────────────────────────────────
  "comm-hero-title": {
    sv: "En målning gjord\njust för dig",
    en: "A painting made\njust for you",
  },
  "comm-hero-description": {
    sv: "Jag målar djur, natur och de stunder som känns viktiga att bevara.\nVarje beställning är unik från den första idén till färdig duk.",
    en: "I paint animals, nature and the moments that feel important to preserve.\nEvery commission is unique from the first idea to the finished canvas.",
  },
  "comm-section-title": {
    sv: "Så här går det till",
    en: "How it works",
  },
  "comm-steps": {
    sv: "<div class='step'><div class='step-num'>1</div><div class='step-text'><strong>Hör av dig</strong><p>Skicka ett meddelande via formuläret <a href='#footer'>nedan</a> eller mejla <a href='mailto:info@vaavascanvas.se'>info@vaavascanvas.se</a>. Berätta om motivet du drömmer om – gärna med referensbild.</p></div></div><div class='step'><div class='step-num'>2</div><div class='step-text'><strong>Vi stämmer av</strong><p>Jag återkommer med pris och leveranstid. Vid bekräftelse betalar du 50 % i förskott.</p></div></div><div class='step'><div class='step-num'>3</div><div class='step-text'><strong>Jag målar</strong><p>Under processen delar jag gärna bilder. Du är välkommen att komma med tankar och feedback längs vägen.</p></div></div><div class='step'><div class='step-num'>4</div><div class='step-text'><strong>Leverans</strong><p>Resterande 50 % betalas när målningen är klar. Frakt tillkommer om du inte hämtar i Stockholm.</p></div></div>",
    en: "<div class='step'><div class='step-num'>1</div><div class='step-text'><strong>Get in touch</strong><p>Send a message via the form <a href='#footer'>below</a> or email <a href='mailto:info@vaavascanvas.se'>info@vaavascanvas.se</a>. Tell me about the motif you have in mind – feel free to include a reference image.</p></div></div><div class='step'><div class='step-num'>2</div><div class='step-text'><strong>We align</strong><p>I'll get back to you with a price and delivery time. Upon confirmation, you pay 50% upfront.</p></div></div><div class='step'><div class='step-num'>3</div><div class='step-text'><strong>I paint</strong><p>I'm happy to share progress photos along the way. You're welcome to share thoughts and feedback throughout the process.</p></div></div><div class='step'><div class='step-num'>4</div><div class='step-text'><strong>Delivery</strong><p>The remaining 50% is paid when the painting is complete. Shipping is added if you're not picking up in Stockholm.</p></div></div>",
  },
  "comm-section-prices": {
    sv: "Priser",
    en: "Prices",
  },
  "comm-price-note": {
    sv: "Ungefärliga priser – slutpriset kan variera beroende på motivets komplexitet.",
    en: "Approximate prices – the final price may vary depending on the complexity of the motif.",
  },
  "comm-size": {
    sv: "Storlek",
    en: "Size",
  },
  "comm-size-en": {
    sv: "Storlek",
    en: "Size",
  },
  "comm-size-custom": {
    sv: "Större / anpassat",
    en: "Larger / custom",
  },
  "comm-size-custom-en": {
    sv: "Större / anpassat",
    en: "Larger / custom",
  },
  "comm-price-custom": {
    sv: "Vi pratar",
    en: "Let's talk",
  },
  "comm-price-custom-en": {
    sv: "Vi pratar",
    en: "Let's talk",
  },
  "comm-section-terms": {
    sv: "Köpevillkor",
    en: "Terms",
  },
  "comm-terms": {
    sv: "<li>Betalning sker med 50 % förskott vid beställning. Resterande belopp betalas när målningen är klar.</li><li>Beställda originalverk ångras inte – motivet är personligt och kan inte säljas vidare.</li><li>Jag förbehåller mig rätten att dokumentera och visa beställda verk i min portfolio och på sociala medier, om inget annat avtalas.</li><li>Leveranstid varierar – räkna med 2-6 veckor beroende på storlek och ordervolym. Hör av dig om du har en deadline.</li><li>Frakt sker på köparens bekostnad. Upphämtning i Stockholm är alltid möjlig.</li>",
    en: "<li>Payment is made with 50% upfront at the time of ordering. The remaining amount is paid when the painting is complete.</li><li>Commissioned original works are non-refundable – the motif is personal and cannot be resold.</li><li>I reserve the right to document and display commissioned works in my portfolio and on social media, unless otherwise agreed.</li><li>Delivery time varies – allow 2-6 weeks depending on size and order volume. Let me know if you have a deadline.</li><li>Shipping is at the buyer's expense. Pick-up in Stockholm is always available.</li>",
  },

  // ── Medium ─────────────────────────────────────────────────────
  medium_acrylic_canvas: {
    sv: "Akryl på duk",
    en: "Acrylic on canvas",
  },

  // ── Painting descriptions ──────────────────────────────────────
  desc_herrOchFruAndersson: {
    sv: "Två gräsänder sedda uppifrån som visar ett stilla ögonblick av samhörighet på vattnet.",
    en: "Two mallards seen from above showing a quiet moment of togetherness on the water.",
  },
  desc_womanInTheSea: {
    sv: "Ett självporträtt i havet målad ur ett hopp om att hitta sig själv igen.",
    en: "A self-portrait in the sea painted from hope of finding myself again.",
  },
  desc_vattenfall: {
    sv: "Där vattnet möter klippan och tiden står stilla.",
    en: "Where water meets rock and time stands still.",
  },
  desc_solnedgang: {
    sv: "Himlen smälter samman med havet i ett stilla ögonblick av guld och ro.",
    en: "The sky merges with the sea in a quiet moment of gold and peace.",
  },
  desc_sommarstuga: {
    sv: "En varm sommardag i Småland och det doftar nästan nyklippt gräs.",
    en: "A warm summer day in Småland and it smells almost like freshly mowed grass.",
  },
  desc_sommarPaStranden: {
    sv: "Sand, sol och den där semesterkänslan som man aldrig vill ska ta slut.",
    en: "Sand, sun and that vacation feeling you never want to end.",
  },
  desc_skaViPlockaBlommor: {
    sv: "En stilla sjö omgiven av vackra näckrosor som en inbjudan att stanna upp lite längre.",
    en: "A quiet lake surrounded by beautiful water lilies like an invitation to linger a little longer.",
  },
  desc_savannan: {
    sv: "Savannens varma ljus i skymningen när dagen är slut och det är dags att vandra hem.",
    en: "The warm light of the savanna at dusk when the day is done and it's time to head home.",
  },
  desc_varkansla: {
    sv: "En trött blåmes som vilar bland körsbärsblommor våren är här, äntligen.",
    en: "A tired blue tit resting among cherry blossoms, spring is here, finally.",
  },
  desc_norrsken: {
    sv: "Ljuset dansar bakom bergen i en natt som känns som ett under.",
    en: "The light dances behind the mountains on a night that feels like a miracle.",
  },
  desc_vargen: {
    sv: "Vargen både vild och sårbar på en gång. En påminnelse om att styrka och mjukhet kan leva sida vid sida.",
    en: "The wolf both wild and vulnerable at once. A reminder that strength and softness can live side by side.",
  },
  desc_radjur: {
    sv: "Antiloper i lugnt bete som visar livet på savannen i sin enklaste, vackraste form.",
    en: "Antelopes peacefully grazing showing life on the savanna in its simplest, most beautiful form.",
  },
  desc_skogsvila: {
    sv: "Två rävar som myser tryggt inne i en gammal trädöppning, en plats där de kan vila och känna sig säkra.",
    en: "Two foxes snuggled safely inside an old tree hollow, a place where they can rest and feel secure.",
  },
  desc_brollopspresent: {
    sv: "En handmålad present till Herr och Fru Elfqvist på deras stora dag.",
    en: "A hand-painted gift for Mr. and Mrs. Elfqvist on their big day.",
  },
  desc_bonnie: {
    sv: "En illustration målad med kärlek som var ett present på ett litet livs första födelsedag.",
    en: "An illustration painted with love as a gift on a little life's first birthday.",
  },
  desc_vinterlek: {
    sv: "Hundarna Shiro och Otis som leker med varandra i snön.",
    en: "Dogs Shiro and Otis playing together in the snow.",
  },
  desc_sommarvila: {
    sv: "En isbjörnsmamma och hennes ungar vilar mjukt i blomsterhaven vid Hudson Bay som visar en stund av absolut frid.",
    en: "A mother polar bear and her cubs resting gently in a flower garden by Hudson Bay showing a moment of absolute peace.",
  },
  desc_solvarmeISkogen: {
    sv: "Solstrålar som faller på en rävmamma och hennes lekande ungar i en skogsglänta.",
    en: "Sun rays filtering down through the trees onto a mother fox and her playful cubs in a forest clearing.",
  },
  desc_minMamma: {
  sv: "En ko och hennes kalv som möts i ett stilla och kärleksfullt ögonblick på sommarbetet.",
  en: "A cow and her calf meeting in a quiet and loving moment on the summer pasture.",
},
  desc_dagensFynd: {
    sv: "En liten ekorre som har hittat en skatt i naturen.",
    en: "A little squirrel that has found a treasure in nature.",
  },
  desc_sugenPaEttApple: {
    sv: "En nyfiken dovhjort som sträcker sig efter ett litet rött äpple som hänger från en gren.",
    en: "A curious deer stretching after a small red apple hanging from a branch.",
  },
  frame_available: {
    sv: "Finns med eller utan ram",
    en: "Available with or without frame",
  },
  frame_price_with: {
    sv: "Pris med ram",
    en: "Price with frame",
  },
  frame_price_without: {
    sv: "Pris utan ram",
    en: "Price without frame",
  },
  frame_confirm_question: {
    sv: "Vill du köpa med ram? OK = med ram, Avbryt = utan ram.",
    en: "Would you like to buy with frame? OK = with frame, Cancel = without.",
  },
  desc_efterIde: {
  sv: "Björnmamma med sina ungar precis efter ide, när de är som mest lekfulla och nyfikna på världen.",
  en: "A mother bear with her cubs right after an idea, when they are most playful and curious about the world.",
}
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

