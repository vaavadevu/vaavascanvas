// blog-posts.js — all blog posts data

// Helper: format date based on language
function formatDate(date, locale = "sv-SE") {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const blogPosts = [
  {
    id: "began-to-survive",

    // Titles
    title: "Jag började måla för att överleva",
    titleEn: "I Started Painting to Survive",

    // SEO
    seoTitle: "Jag började måla för att överleva | Vaavas Canvas",
    seoTitleEn: "I Started Painting to Survive | Vaavas Canvas",

    seoDescription:
      "En personlig berättelse om varför jag började måla och hur konst blev ett sätt att hantera livet.",
    seoDescriptionEn:
      "A personal story about why I started painting and how art became a way to cope with life.",

    // Date
    date: "2026-04-28",

    // Author
    author: "Devika",

    // Excerpt
    excerpt:
      "Varför jag började måla, och hur det blev något mer än bara en hobby.",
    excerptEn:
      "Why I started painting — and how it became more than just a hobby.",

    // Content (SWEDISH)
    content: `
      <p>🎨 Jag tror inte att jag började måla av "rätt" anledning.<br>
      Det förstod jag när min psykolog sa att jag målade för att jag behövde något att hålla fast vid.</p>
      
      <p>När jag först hörde det blev jag faktiskt besviken.  
      Det kändes som att jag bara målade för att allt annat var jobbigt när jag var yngre. 💔</p>
      
      <p>Men sen började jag förstå något annat.  
      Att det inte behöver vara något jag medvetet valde för att jag "tyckte om det".  
      Att det också kan vara ett sätt att bearbeta saker – och att jag råkade bli förälskad i det. 💖</p>
      
      <h2>I början var det rörigt</h2>
      
      <p>Jag var inte särskilt bra. Det var färger överallt, inga riktiga planer, misstag hela tiden.</p>
      
      <p>Men ändå fortsatte jag.</p>
      
      <p>För något hände när jag målade.<br>
      Tiden saktade ner. Tankarna blev inte lika högljudda. 🤔 
      Jag kunde fokusera på något konkret – en färg, en form, ett litet steg i taget.</p>
      
      <p>Och det var tryggt. 🛡️</p>
      
      <h2>Jag är fortfarande i början</h2>
      
      <p>Jag är fortfarande i början av min resa. Jag lär mig fortfarande.  
      Jag gör fortfarande misstag (hela tiden!).  
      Men jag börjar också se något växa fram – inte bara i mina målningar, utan i mig själv. 🌱</p>
      
      <p><strong>Den här bloggen är inte här för att visa perfektion.<br>
      Den är här för att visa processen – och att jag är en människa som gör misstag.</strong></p>
      
      <p>Det här är mitt sätt att börja dela min konstresa, mina tankar och känslor. 💭</p>
      
      <p>Kanske är du också i början av något.<br>
      Kanske känner du dig lost ibland.<br>
      Kanske letar du efter något som får dig att känna lite mer igen. ✨</p>
      
      <p>Då hoppas jag att du kan hitta något här. 🙏</p>
      
      <p style="margin-top: 40px;"><strong>Det här är bara början.</strong></p>
      
      <p style="text-align: right; margin-top: 10px; font-style: italic;">– Devika</p>
    `,

    // Content (ENGLISH)
    contentEn: `
      <p>🎨 I don't think I started painting for the "right" reasons.<br>
      I realized that when my therapist told me I was painting because I needed something to hold onto.</p>
      
      <p>When I first heard that, I felt disappointed.  
      It made me feel like I was only painting because everything else felt heavy when I was younger. 💔</p>
      
      <p>But then I started to understand something else.  
      That it doesn't have to be something I consciously chose because I "liked it".  
      It can also be a way of processing things — and somehow, I fell in love with it. 💖</p>
      
      <h2>In the beginning, it was messy</h2>
      
      <p>I wasn't very good. Colors everywhere, no real plan, mistakes all the time.</p>
      
      <p>But I kept going anyway.</p>
      
      <p>Because something happened when I painted.<br>
      Time slowed down. My thoughts became quieter. 🤔 
      I could focus on something concrete — a color, a shape, one small step at a time.</p>
      
      <p>And that felt safe. 🛡️</p>
      
      <h2>I'm still at the beginning</h2>
      
      <p>I'm still at the beginning of my journey. I'm still learning.  
      I still make mistakes (all the time).  
      But I'm starting to see something grow — not just in my paintings, but in myself. 🌱</p>
      
      <p><strong>This blog is not here to show perfection.<br>
      It's here to show the process — and that I'm human.</strong></p>
      
      <p>This is my way of starting to share my art journey, my thoughts, and my feelings. 💭</p>
      
      <p>Maybe you're also at the beginning of something.<br>
      Maybe you feel lost sometimes.<br>
      Maybe you're looking for something that makes you feel a little more again. ✨</p>
      
      <p>I hope you can find something here. 🙏</p>
      
      <p style="margin-top: 40px;"><strong>This is just the beginning.</strong></p>
      
      <p style="text-align: right; margin-top: 10px; font-style: italic;">– Devika</p>
    `,

    // Image
    image: "/images/Baby.jpg",
    alt: "Jag som en lugn och glad bebis",

    // Tags
    tags: ["inspiration", "process", "beginning"],
  },
  {
    id: "when-i-feel-bad-at-painting",

    // Titles
    title: "När jag känner mig dålig på att måla",
    titleEn: "When I Feel Bad at Painting",

    // SEO
    seoTitle: "När jag känner mig dålig på att måla | Vaavas Canvas",
    seoTitleEn: "When I Feel Bad at Painting | Vaavas Canvas",

    seoDescription:
      "En personlig berättelse om impostor syndrome och att fortsätta måla trots att det känns svårt.",
    seoDescriptionEn:
      "A personal story about impostor syndrome and continuing to paint even when it feels hard.",

    // Date
    date: "2026-04-30",

    // Author
    author: "Devika",

    // Excerpt
    excerpt:
      "Det förbannade impostor syndrome och varför jag ändå fortsätter måla.",
    excerptEn:
      "The damn impostor syndrome and why I still keep painting.",

    // Content (SWEDISH)
    content: `
      <p>🎨 Det förbannade impostor syndrome.</p>

      <p>Jag är inte bra på det jag gör.<br>
      Alla andra är så duktiga.<br>
      Vem skulle ens vilja ha mitt konstverk?<br>
      Kanske lurar jag bara mig själv.</p>

      <p>Jag sitter där med penseln i handen och känner direkt att det inte blir som jag tänkt mig.<br>
      Inte ens nära.</p>

      <p>I mitt huvud ser det så tydligt ut – färgerna, ljuset, känslan.<br>
      Men när jag börjar måla försvinner allt det där någonstans på vägen.</p>

      <p>Och det är frustrerande. 😩</p>

      <p>Men det som är konstigt är att jag ändå fortsätter.</p>

      <p>Inte för att det alltid känns bra – för det gör det inte.<br>
      Utan för att det finns små stunder där något faktiskt funkar.</p>

      <p>En färg som blev rätt. ✨<br>
      En liten detalj som plötsligt känns levande. 🌱<br>
      Ett penseldrag som bara… känns rätt. 🎯</p>

      <p>De stunderna betyder oerhört mycket för mig.<br>
      Det är då jag lär mig något nytt.</p>

      <p>Jag försöker påminna mig själv om att det jag ser i mitt huvud inte behöver bli perfekt direkt.<br>
      Att det kanske aldrig blir exakt så.<br>
      Och att det inte betyder att det jag gör är dåligt.</p>

      <p>Kanske är det till och med något annat som kommer fram.<br>
      Något jag inte planerade – men som ändå är fint. 🌸</p>

      <p>Kanske är det så för dig också.<br>
      Att du vet hur något <em>ska</em> kännas, men inte riktigt får ut det ännu.</p>

      <p>Och kanske betyder det inte att du är dålig.</p>

      <p>Kanske betyder det bara att du inte låter dina tankar styra allt.<br>
      Att du vågar tappa lite kontroll. 🌀</p>

      <p>Haha… det låter nästan lite fånigt när jag skriver det. 😅<br>
      Men det är ändå något fint i det.</p>

      <p>Jag försöker i alla fall. 💪</p>

      <p style="margin-top: 40px;"><strong>Du också?</strong></p>

      <p style="text-align: right; margin-top: 10px; font-style: italic;">– Devika</p>
    `,

    // Content (ENGLISH)
    contentEn: `
      <p>🎨 The damn impostor syndrome.</p>

      <p>I'm not good at what I do.<br>
      Everyone else is so talented.<br>
      Who would even want my artwork?<br>
      Maybe I'm just fooling myself.</p>

      <p>I sit there with the brush in my hand and immediately feel that it doesn't turn out the way I imagined.<br>
      Not even close.</p>

      <p>In my head it looks so clear – the colors, the light, the feeling.<br>
      But when I start painting, all that disappears somewhere along the way.</p>

      <p>And it's frustrating. 😩</p>

      <p>But the strange thing is that I still continue.</p>

      <p>Not because it always feels good – because it doesn't.<br>
      But because there are small moments where something actually works.</p>

      <p>A color that turned out right. ✨<br>
      A small detail that suddenly feels alive. 🌱<br>
      A brushstroke that just… feels right. 🎯</p>

      <p>Those moments mean an incredible amount to me.<br>
      That's when I learn something new.</p>

      <p>I try to remind myself that what I see in my head doesn't need to be perfect right away.<br>
      That it might never be exactly like that.<br>
      And that it doesn't mean what I'm doing is bad.</p>

      <p>Maybe it's even something else that comes out.<br>
      Something I didn't plan – but that's still beautiful. 🌸</p>

      <p>Maybe it's the same for you.<br>
      That you know how something <em>should</em> feel, but you don't quite get it out yet.</p>

      <p>And maybe that doesn't mean you're bad.</p>

      <p>Maybe it just means that you don't let your thoughts control everything.<br>
      That you dare to lose a little control. 🌀</p>

      <p>Haha… it sounds almost a bit silly when I write it. 😅<br>
      But there's still something nice about it.</p>

      <p>I'm trying anyway. 💪</p>

      <p style="margin-top: 40px;"><strong>You too?</strong></p>

      <p style="text-align: right; margin-top: 10px; font-style: italic;">– Devika</p>
    `,

    // Image
    image: "/images/2.jpg",
    alt: "Pensel och färgpalett",

    // Tags
    tags: ["inspiration", "process", "impostor-syndrome"],
  },
];

// Get post by ID
function getBlogPostById(id) {
  const post = blogPosts.find((post) => post.id === id);
  if (post && !post.dateFormatted) {
    post.dateFormatted = formatDate(post.date, "sv-SE");
  }
  return post;
}

// Get all posts sorted
function getAllBlogPosts() {
  const posts = blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  posts.forEach(post => {
    if (!post.dateFormatted) {
      post.dateFormatted = formatDate(post.date, "sv-SE");
    }
  });
  return posts;
}