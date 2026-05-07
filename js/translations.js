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
  nav_blog: {
    sv: "Blogg",
    en: "Blog",
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
    sv: "Läs min blogg",
    en: "Read my blog",
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
  // ── Size filters ───────────────────────────────────────────
  filter_status_label: {
    sv: "Status",
    en: "Status",
  },
  filter_size_label: {
    sv: "Storlek",
    en: "Size",
  },
  filter_size_all: {
    sv: "Alla storlekar",
    en: "All sizes",
  },
  filter_size_small: {
    sv: "Små",
    en: "Small",
  },
  filter_size_medium: {
    sv: "Medel",
    en: "Medium",
  },
  filter_size_large: {
    sv: "Stora",
    en: "Large",
  },

  // ── Cookie policy ──────────────────────────────────────────
  cookie_policy_link: {
    sv: "Cookiepolicy",
    en: "Cookie policy",
  },
  cookie_settings_link: {
    sv: "Cookieinställningar",
    en: "Cookie settings",
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
    sv: "Genom min konst vill jag skapa närvaro och igenkänning – något som känns mänskligt, mjukt och äkta. Jag hoppas att det finns en målning som talar till dig. Hör av dig om du vill veta mer om vad jag gör!",
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
    sv: "Lägg i varukorg",
    en: "Add to cart",
  },
  modal_in_cart_btn: {
    sv: "Gå till varukorg",
    en: "Go to cart",
  },
  pageview_print_available_btn: {
    sv: "Finns som print från",
    en: "Available as a print from",
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
  form_commission_link: {
    sv: "🎨 Läs om beställningar & priser",
    en: "🎨 Read about commissions & prices",
  },
  form_size_label: {
    sv: "Storlek",
    en: "Size",
  },
  form_size_default: {
    sv: "– Välj storlek –",
    en: "– Select size –",
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
    sv: "59 kr för frakt på alla beställningar under 599 kr. Fri frakt över 599 kr. Leveranstid 1–3 arbetsdagar via PostNord.",
    en: "59 SEK shipping on all orders under 599 SEK. Free shipping over 599 SEK. Delivery time 1–3 business days via PostNord.",
  },
  shipping_europe_h: {
    sv: "Internationell frakt",
    en: "International shipping",
  },
  shipping_europe_p: {
    sv: "Prints kan beställas och levereras internationellt. Originalmålningar fraktas enbart inom Sverige, beställningar med original och utländsk leveransadress återbetalas. Leveranstid ca 5–14 arbetsdagar.",
    en: "Prints can be ordered and delivered internationally. Original paintings ship within Sweden only, orders with originals and a foreign delivery address will be refunded. Delivery time approx. 5–14 business days.",
  },
  shipping_packaging_h: {
    sv: "Förpackning",
    en: "Packaging",
  },
  shipping_packaging_p: {
    sv: "Varje målning packas omsorgsfullt med skyddsmaterial och stabil kartong för att säkerställa att den anländer i perfekt skick.",
    en: "Each painting is carefully packed with protective material and sturdy cardboard to ensure it arrives in perfect condition.",
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
    sv: "En målning gjord just för dig",
    en: "A painting made just for you",
  },
  "comm-hero-description": {
    sv: "Varje beställning är unik från den första idén till färdig duk.",
    en: "Every commission is unique from the first idea to the finished canvas.",
  },
  "comm-section-title": {
    sv: "Så här går det till",
    en: "How it works",
  },
  "comm-steps": {
    sv: "<div class='step'><div class='step-num'>1</div><div class='step-text'><strong>Hör av dig</strong><p>Fyll i formuläret <a href='#footer'>nedan</a> och berätta om motivet – gärna med referensbild.</p></div></div><div class='step'><div class='step-num'>2</div><div class='step-text'><strong>Vi stämmer av</strong><p>Jag återkommer med pris och leveranstid.</p></div></div><div class='step'><div class='step-num'>3</div><div class='step-text'><strong>Jag målar</strong><p>Jag delar gärna bilder längs vägen och välkomnar din feedback.</p></div></div><div class='step'><div class='step-num'>4</div><div class='step-text'><strong>Leverans</strong><p>Resterande 50 % betalas när målningen är klar.</p></div></div>",
    en: "<div class='step'><div class='step-num'>1</div><div class='step-text'><strong>Get in touch</strong><p>Fill in the form <a href='#footer'>below</a> and tell me about your motif – feel free to include a reference image.</p></div></div><div class='step'><div class='step-num'>2</div><div class='step-text'><strong>We align</strong><p>I'll get back to you with a price and delivery time.</p></div></div><div class='step'><div class='step-num'>3</div><div class='step-text'><strong>I paint</strong><p>I'll happily share progress photos and welcome your feedback along the way.</p></div></div><div class='step'><div class='step-num'>4</div><div class='step-text'><strong>Delivery</strong><p>The remaining 50% is paid when the painting is complete.</p></div></div>",
  },
  "comm-section-prices": {
    sv: "Priser",
    en: "Prices",
  },
  "comm-section-references": {
    sv: "Tidigare beställningar",
    en: "Previous Orders",
  },
  "comm-price-note": {
    sv: "Ungefärliga priser – slutpriset kan variera beroende på motivets komplexitet.",
    en: "Approximate prices – the final price may vary depending on the complexity of the motif.",
  },
  "comm-size": {
    sv: "Storlek",
    en: "Size",
  },
  "comm-price": {
    sv: "Pris",
    en: "Price",
  },
  "comm-size-custom": {
    sv: "Större / anpassat",
    en: "Larger / custom",
  },
  "comm-price-custom": {
    sv: "Vi pratar",
    en: "Let's talk",
  },
  "comm-price-30x30": {
    sv: "1 500 kr",
    en: "€135",
  },
  "comm-price-30x40": {
    sv: "1 800 kr",
    en: "€160",
  },
  "comm-price-40x40": {
    sv: "2 000 kr",
    en: "€180",
  },
  "comm-price-42x60": {
    sv: "2 800 kr",
    en: "€250",
  },
  "comm-cta-btn": {
    sv: "Beställ din målning",
    en: "Order your painting",
  },
  "comm-section-terms": {
    sv: "Köpvillkor",
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
desc_vinterlek: {
    sv: "Hundarna Shiro och Otis som leker med varandra i snön.",
    en: "Dogs Shiro and Otis playing together in the snow.",
  },
  desc_vattenfall: {
    sv: "Där vattnet möter klippan och tiden står stilla.",
    en: "Where water meets rock and time stands still.",
  },
  desc_solnedgang: {
    sv: "Himlen smälter samman med havet i ett stilla ögonblick av guld och ro.",
    en: "The sky merges with the sea in a quiet moment of gold and peace.",
  },
  desc_aldrigEnsam: {
    sv: "En antilop som delar en stund med en oxpeckare",
    en: "An antelope sharing a moment with an oxpecker",
  },
  desc_operationBaver: {
    sv: "En simmande bäver som äter en gren",
    en: "A swimming beaver eating a branch",
  },
  desc_tjuvsmak: {
    sv: "En busig chinchilla som tjuvsmakar en saftig jordgubbe",
    en: "A little naughty chinchilla enjoying a stolen juicy strawberry"
},
  desc_maskrosdrom: {
    sv: "En igelkott som ligger mellan maskrosor i väntan på sommarens första dag",
    en: "A little hedgehog lying among dandelions waiting for the first day of summer"
},
 desc_koslapp: {
    sv: "Glada kossar som njuter av friheten på sommarbete utan ett nummer på örat.",
    en: "Happy cows enjoying the freedom of summer pasture without a number on their ear."
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
    sv: "En trött blåmes som vilar bland körsbärsblommor – våren är här, äntligen.",
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
  frame_included: {
    sv: "Levereras med ram",
    en: "Includes frame",
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
},
  desc_varlek: {
  sv: "Två glada lamm som hoppar och leker på en blommig äng en fin kväll, fyllda av bus och vårkänslor.",
  en: "Two happy lambs jumping and playing in a flowery meadow on a nice evening, full of mischief and spring feelings.",
},

  nav_prints: {
    sv: "Prints",
    en: "Prints",
  },

  // ── Cart ──────────────────────────────────────────────────────
  cart_heading: {
    sv: "Varukorg",
    en: "Cart",
  },
  cart_empty: {
    sv: "Din varukorg är tom",
    en: "Your cart is empty",
  },
  cart_total_label: {
    sv: "Totalt",
    en: "Total",
  },
  cart_terms_text: {
    sv: "Jag har läst och godkänner",
    en: "I have read and accept the",
  },
  cart_terms_link: {
    sv: "frakt & leveransvillkor",
    en: "shipping & delivery terms",
  },
  cart_checkout_btn: {
    sv: "Till betalning →",
    en: "Proceed to payment →",
  },
  cart_processing: {
    sv: "Bearbetar...",
    en: "Processing...",
  },
  cart_error: {
    sv: "Något gick fel. Försök igen.",
    en: "Something went wrong. Please try again.",
  },
  cart_order_success: {
    sv: "✓ Tack för din beställning! Bekräftelse skickas till din e-post.",
    en: "✓ Thank you for your order! A confirmation will be sent to your email.",
  },
  cart_toast_added: {
    sv: "lagd i varukorgen",
    en: "added to cart",
  },
  cart_toast_already: {
    sv: "finns redan i varukorgen",
    en: "is already in your cart",
  },
  cart_frame_included: {
    sv: "Ram ingår",
    en: "Frame included",
  },
  cart_frame_add: {
    sv: "Lägg till ram",
    en: "Add frame",
  },
  cart_shipping_label: {
    sv: "Frakt",
    en: "Shipping",
  },
  cart_free_shipping: {
    sv: "Fri frakt",
    en: "Free shipping",
  },
  cart_free_shipping_achieved: {
    sv: "✓ Fri frakt uppnådd!",
    en: "✓ Free shipping unlocked!",
  },
  cart_free_shipping_remaining_post: {
    sv: " kr kvar till fri frakt",
    en: " kr left for free shipping",
  },
  cart_country_label: {
    sv: "Leveransland",
    en: "Delivery country",
  },
  cart_country_se: {
    sv: "Sverige",
    en: "Sweden",
  },
  cart_country_other: {
    sv: "Annat land",
    en: "Another country",
  },
  cart_intl_warning: {
    sv: "OBS: Originalmålningar fraktas enbart inom Sverige. Din beställning innehåller original som återbetalas om leveransadressen är utanför Sverige.",
    en: "Note: Original paintings ship within Sweden only. Your order contains originals that will be refunded if the delivery address is outside Sweden.",
  },

  // ── Prints page ───────────────────────────────────────────────
  prints_price_from: {
    sv: "från",
    en: "from",
  },

  prints_hero_h1: {
    sv: "Fine art prints av mina målningar, tryckta på arkivkvalitetspapper.",
    en: "Fine art prints of my paintings, printed on archival quality paper.",
  },
  prints_hero_p: {
    sv: "Varje print levereras direkt till din dörr.",
    en: "Every print is delivered directly to your door.",
  },
  prints_medium_square: {
    sv: "Akryl · Kvadratisk",
    en: "Acrylic · Square",
  },
  prints_medium_portrait: {
    sv: "Akryl · Stående",
    en: "Acrylic · Portrait",
  },
  prints_size_label: {
    sv: "Välj storlek",
    en: "Choose size",
  },
  prints_add_to_cart: {
    sv: "Lägg i varukorg",
    en: "Add to cart",
  },
  prints_info_heading: {
    sv: "Om prints",
    en: "About prints",
  },
  prints_info_p: {
    sv: "Alla prints trycks på beställning på arkivkvalitetspapper via Gelato och levereras inom 3–7 arbetsdagar. Printerna är osignerade, men varje tavla innehåller en signaturtext. Vill du ha en personligt signerad print? Skicka en förfrågan via formuläret nedan!",
    en: "All prints are printed on demand on archival quality paper via Gelato and delivered within 3–7 business days. Prints are unsigned, but each painting includes a signature detail. Want a personally signed print? Send a request via the form below!",
  },
  prints_request_heading: {
    sv: "Hittar du inte det du letar efter?",
    en: "Can't find what you're looking for?",
  },
  prints_request_p: {
    sv: "Har du sett en tavla på sidan som du gärna vill ha som print, men som inte finns tillgänglig just nu? Skicka gärna in en förfrågan så hör jag av mig så snart jag kan!",
    en: "Have you seen a painting on the site that you'd love as a print, but it isn't available right now? Feel free to send a request and I'll get back to you as soon as I can!",
  },
  prints_request_btn: {
    sv: "Skicka en förfrågan",
    en: "Send a request",
  },
  prints_success_banner: {
    sv: "✓ Tack för din beställning! Du får ett bekräftelsemail inom kort.",
    en: "✓ Thank you for your order! You'll receive a confirmation email shortly.",
  },
  prints_toast_added: {
    sv: "Print tillagd i varukorgen!",
    en: "Print added to cart!",
  },

  // ── Blog ───────────────────────────────────────────────────
  blog_title: {
    sv: "Mellan penseldrag och tankar",
    en: "Between brushstrokes and thoughts.",
  },
  blog_read_more: {
    sv: "Läs mer",
    en: "Read more",
  },
  blog_back: {
    sv: "Tillbaka till blogg",
    en: "Back to blog",
  },
  comments_title: {
    sv: "Kommentarer",
    en: "Comments",
  },
  comment_name: {
    sv: "Ditt namn",
    en: "Your name",
  },
  comment_text: {
    sv: "Skriv en kommentar...",
    en: "Write a comment...",
  },
  comment_submit: {
    sv: "Skicka",
    en: "Send",
  },
  comment_sending: {
    sv: "Skickar...",
    en: "Sending...",
  },
  comment_sent: {
    sv: "Skickat! ♡",
    en: "Sent! ♡",
  },
  comment_no_comments: {
    sv: "Inga kommentarer än — bli den första!",
    en: "No comments yet — be the first!",
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

