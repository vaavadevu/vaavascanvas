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
    id: "min-allra-forsta-vernissage",

    title: "Min allra första vernissage 🎨✨",
    titleEn: "My Very First Exhibition Opening 🎨✨",

    seoTitle: "Min allra första vernissage | Vaavas Canvas",
    seoTitleEn: "My Very First Exhibition Opening | Vaavas Canvas",

    seoDescription:
      "En personlig berättelse om min allra första vernissage, att våga visa min konst och möta människor i min lilla värld.",
    seoDescriptionEn:
      "A personal story about my very first exhibition opening, finding the courage to show my art, and sharing my little world with others.",

    date: "2026-09-09",
    author: "Devika",

    excerpt:
      "Jag hade min allra första vernissage. Det var nervöst, surrealistiskt och mycket större än jag hade kunnat föreställa mig.",
    excerptEn:
      "I had my very first exhibition opening. It was nerve-racking, surreal, and so much bigger than I could have imagined.",

    content: `
      <p>Jag hade min allra första vernissage! 🥹</p>

      <p>Va, alltså… det är helt ofattbart.</p>

      <p>Att få ställa ut mina målningar och faktiskt visa djuren jag målar för andra människor, på en riktig lokal, känns fortfarande lite surrealistiskt. 🐑🐄🐻 Jag tror inte riktigt att jag hade förstått vad det skulle innebära förrän jag faktiskt stod där.</p>

      <p>Inför vernissagen var jag så nervös. 😭 Jag hade lagt ut eventet och försökt berätta om det, men samtidigt gick en liten tanke runt i huvudet:</p>

      <p>”Tänk om ingen kommer?”</p>

      <p>Det är en ganska speciell känsla att skapa konst som är så personlig och sedan bjuda in andra människor att komma och titta på den. Plötsligt är det inte bara mina målningar längre. Någon annan ska stå framför dem och bilda sin egen uppfattning. Kanske känna någonting. Kanske inte alls känna det jag själv kände när jag målade dem. 🥹</p>

      <p>Men så kom folk. 🤍</p>

      <p>Människor som hade sett eventet, människor som ville se mina målningar och människor som tog sig tid att komma och vara där. Det var kanske inte jättemånga, men det betydde så otroligt mycket för mig. 🥹✨</p>

      <p>Att stå i lokalen och se mina målningar på väggarna var nästan svårt att ta in. Jag har suttit hemma och målat de här djuren, ibland utan att ens veta vart målningarna skulle ta vägen. Och plötsligt hängde de där framför mig, tillsammans, som en liten värld som jag hade skapat. 🌿🐑🐄</p>

      <figure class="blog-inline-image">
        <img src="/images/blogg/7.jpeg" alt="Målningar från Devikas första vernissage" />
        <figcaption>Från min allra första vernissage</figcaption>
      </figure>

      <p>Det var också något väldigt fint i att få prata med människor om målningarna. Att få berätta varför jag målar djur, vad de betyder för mig och varför jag vill att de ska få ta plats i min konst. 🐾🎨</p>

      <p>Jag hade målat tavlorna.<br>Jag hade vågat visa dem.<br>Jag hade ordnat en utställning.<br>Och jag stod där och pratade om min konst.</p>

      <p>Det kanske låter som en självklar sak när man skriver det så här, men för mig är det faktiskt jättestort. 🤍</p>

      <p>Jag började måla mycket som ett sätt att få ur mig saker, och med tiden har djuren blivit en så viktig del av det jag vill förmedla. Att nu få visa dem i ett galleriliknande sammanhang, utanför mitt eget hem och min egen skärm, känns som ett stort steg. 🌱✨</p>

      <p>Och kanske är det just det jag tar med mig mest från min första vernissage:</p>

      <p>Att det faktiskt går att våga, även när man är livrädd. 🥹</p>

      <p>Det här var bara min första.</p>

      <p>Och jag hoppas verkligen att det inte blir den sista. 🎨🐄🐑🐻✨</p>

      <p>Tack till alla som kom, tittade, pratade med mig, stöttade mig och gjorde min allra första vernissage till något jag kommer att minnas länge. 🤍</p>

      <p>Tack för att ni tog er tid att komma och möta min lilla värld. 🐾🌿</p>

      <p>– Devika</p>
    `,

    contentEn: `
      <p>I had my very first exhibition opening! 🥹</p>

      <p>I mean… it feels completely unreal.</p>

      <p>Being able to exhibit my paintings and actually show the animals I paint to other people, in a real venue, still feels a little surreal. 🐑🐄🐻 I don't think I truly understood what it would mean until I was standing there.</p>

      <p>I was so nervous before the opening. 😭 I had shared the event and tried to tell people about it, but at the same time, one little thought kept circling in my head:</p>

      <p>“What if nobody comes?”</p>

      <p>It is a very particular feeling to create art that is so personal and then invite other people to come and look at it. Suddenly, the paintings are no longer only mine. Someone else is going to stand in front of them and form their own opinion. Maybe feel something. Maybe not feel at all what I felt when I painted them. 🥹</p>

      <p>But then people came. 🤍</p>

      <p>People who had seen the event, people who wanted to see my paintings, and people who took the time to come and be there. There may not have been very many, but it meant so incredibly much to me. 🥹✨</p>

      <p>Standing in the venue and seeing my paintings on the walls was almost difficult to take in. I have sat at home painting these animals, sometimes without even knowing where the paintings would end up. And suddenly they were hanging there in front of me, together, like a little world I had created. 🌿🐑🐄</p>

      <figure class="blog-inline-image">
        <img src="/images/blogg/7.jpeg" alt="Paintings from Devika's first exhibition opening" />
        <figcaption>From my very first exhibition opening</figcaption>
      </figure>

      <p>There was also something very beautiful about getting to talk to people about the paintings. Being able to explain why I paint animals, what they mean to me, and why I want them to have a place in my art. 🐾🎨</p>

      <p>I had painted the pictures.<br>I had dared to show them.<br>I had organised an exhibition.<br>And I stood there talking about my art.</p>

      <p>It may sound like an obvious thing when written down like this, but for me it is actually huge. 🤍</p>

      <p>I started painting as a way to get things out, and over time animals have become such an important part of what I want to express. Getting to show them in a gallery-like setting, outside my own home and my own screen, feels like a big step. 🌱✨</p>

      <p>And perhaps that is what I will take with me most from my first exhibition opening:</p>

      <p>That it really is possible to be brave, even when you are terrified. 🥹</p>

      <p>This was only my first.</p>

      <p>And I truly hope it will not be my last. 🎨🐄🐑🐻✨</p>

      <p>Thank you to everyone who came, looked, talked with me, supported me, and made my very first exhibition opening something I will remember for a long time. 🤍</p>

      <p>Thank you for taking the time to come and meet my little world. 🐾🌿</p>

      <p>– Devika</p>
    `,

    image: "/images/blogg/6.jpg",
    alt: "Devikas allra första vernissage",
    imageCaption: "Min allra första vernissage",
    imageCaptionEn: "My very first exhibition opening",

    tags: ["vernissage", "konst", "personligt"],
  },
  {
    id: "why-animals-shiro",

    // Titles
    title: "Varför just djur?",
    titleEn: "Why Animals?",

    // SEO
    seoTitle: "Varför just djur? | Vaavas Canvas",
    seoTitleEn: "Why Animals? | Vaavas Canvas",

    seoDescription:
      "En personlig berättelse om Shiro och varför djur blev mitt centrala motiv.",
    seoDescriptionEn:
      "A personal story about Shiro and why animals became my central subject.",

    // Date
    date: "2026-05-19",

    // Author
    author: "Devika",

    // Excerpt
    excerpt:
      "En berättelse om Shiro, saknad och varför djur tog plats i mina målningar.",
    excerptEn:
      "A story about Shiro, grief and why animals took center stage in my paintings.",

    // Content (SWEDISH)
    content: `
      <p>💔 PS. Den här kommer bli en riktig snyftare.</p>

      <p>På bilden ser ni mig och Shiro, vår hund som jag och min sambo adopterade från Rumänien. 🐶
      Han var vår solstråle, men framför allt drog han mig ut från några av de mörkaste perioderna i mitt liv.</p>

      <p>Aldrig hade vi kunnat tänka oss att vi bara tio månader senare skulle stå och gråta på djursjukhuset när hans livlösa kropp låg framför oss. 😢
      Ännu mindre att vi skulle behöva ta beslutet att låta honom somna in.</p>

      <p>Så... vad har allt det här att göra med varför jag målar djur?</p>

      <p>Jo, det är faktiskt Shiro som inspirerade mig att börja skapa djur som centrala motiv i mina målningar ❤️.</p>

      <p>Jag har alltid vetat att jag älskar djur. Det påverkar även hur jag lever mitt liv, bland annat genom att jag är vegan. 🌱
      Tidigare målade jag mest natur och landskap, men efter att Shiro gick bort började jag hitta glädje i att måla andra djur. Andra söta små varelser som påminde mig om min bästa vän.</p>

      <p>När Shiro fortfarande levde började jag fundera på att skapa en barnbok där han skulle vara en central karaktär.
      Jag gjorde massor av snabba skisser av honom, och idéerna till berättelsen fanns redan i mitt huvud då.</p>

      <p>Men själva manuset började jag skriva först efter att Shiro korsade regnbågsbron. 🌈</p>

      <p>Det känns nästan konstigt att tänka på nu.
Men kanske var skrivandet bara mitt sätt att försöka hålla honom kvar lite längre, eftersom sorgen fortfarande känns lika tung.</p>

      <p>Det är väldigt svårt att sätta ord på exakt vad som ledde till att jag bestämde mig för att djur är min grej.
      Men oavsett hur mycket jag tänker på det leder det alltid tillbaka till de djur jag har mött genom livet.</p>

      <p>Och mest av allt tillbaka till Shiro.</p>

      <p>Han tog så enormt mycket plats i mitt liv.
      Och kanske var det enda sättet för mig att fylla det tomma rummet att skapa levande varelser i mina målningar.</p>

      <p>– Devika </p>
    `,

    // Content (ENGLISH)
    contentEn: `
      <p>PS. This one might make you cry a little. 😢</p>

      <p>In the picture, you can see me and Shiro, the dog that my partner and I adopted from Romania. 🐶
      He was our little sunshine, but more than anything, he pulled me out of some of the darkest periods of my life.</p>

      <p>We could never have imagined that only ten months later we would be standing at the animal hospital, crying while his lifeless body lay in front of us.
      Even less that we would have to make the decision to let him go.</p>

      <p>So... what does all of this have to do with why I paint animals?</p>

      <p>Well, Shiro is actually the reason I started creating animals as central subjects in my paintings ❤️.</p>

      <p>I have always known that I love animals. It also affects the way I live my life, including being vegan. 🌱
      Before, I mostly painted nature and landscapes, but after Shiro passed away, I started finding joy in painting other animals. Other sweet little creatures that reminded me of my best friend.</p>

      <p>While Shiro was still alive, I started thinking about creating a children's book where he would be one of the main characters.
      I made lots of quick sketches of him, and the ideas for the story were already living in my head back then.</p>

      <p>But I only started writing the actual manuscript after Shiro crossed the rainbow bridge. 🌈</p>

      <p>It feels strange to think about now.
But maybe writing it was just my way of trying to hold onto him a little longer, because the grief still feels just as heavy.</p>

      <p>It is very difficult to put into words exactly what made me realize that animals are my thing.
      But no matter how much I think about it, it always leads me back to the animals I have met throughout my life.</p>

      <p>And most of all, back to Shiro.</p>

      <p>He took up such an enormous place in my life.
      And maybe the only way for me to fill that empty space was by creating living creatures in my paintings.</p>

      <p>– Devika </p>
    `,

    // Image
    image: "/images/blogg/5.JPG",
    alt: "Devika och Shiro",
    imageCaption: "Jag och Shiro",
    imageCaptionEn: "Me and Shiro",

    // Tags
    tags: ["shiro", "djur", "personligt"],
  },
  {
    id: "from-geology-to-painting",

    // Titles
    title: "Jag gjorde allt \"rätt\", men valde ändå en annan väg",
    titleEn: "I Did Everything 'Right' — But Chose a Different Path",

    // SEO
    seoTitle: "Jag gjorde allt \"rätt\", men valde ändå en annan väg | Vaavas Canvas",
    seoTitleEn: "I Did Everything 'Right' — But Chose a Different Path | Vaavas Canvas",

    seoDescription:
      "Från åtta år av geologistudier till att välja min egen väg mot konst. En berättelse om rädsla, mod och att lyssna på sig själv.",
    seoDescriptionEn:
      "From eight years of geology studies to choosing my own path toward art. A story about fear, courage, and listening to yourself.",

    // Date
    date: "2026-05-05",

    // Author
    author: "Devika",

    // Excerpt
    excerpt:
      "Åtta år av studier, ett svårt beslut och starten på min resa mot konst.",
    excerptEn:
      "Eight years of studies, a difficult decision, and the beginning of my journey toward art.",

    // Content (SWEDISH)
    content: `
      <p>🎓 Jag pluggade i åtta år.</p>

      <p>Nej, inte konst – utan naturvetenskap, specifikt geologi.</p>

      <p>År 2016 började jag mina universitetsstudier inom geologi. 📚</p>

      <p>Jag fortsatte fram till 2024, tills jag blev sjukskriven på grund av psykisk ohälsa (mer om det i ett annat inlägg, om ni vill det haha). 💔</p>

      <p>Det var då, för första gången i mitt liv, som jag faktiskt frågade mig själv:<br>
      <strong>Vad vill jag egentligen göra?</strong> 🤔</p>

      <p>Jag testade att måla, och ganska snabbt förstod jag hur mycket jag hade saknat att vara kreativ. 🎨</p>

      <p>Jag har kunnat vara kreativ inom geologi också, men inte på det här sättet. ✨</p>

      <h2>Att hitta min egen väg</h2>

      <p>Ett år senare avbröt jag mina magisterstudier i geologi vid Stockholms universitet och bestämde mig för att satsa all-in. 💪</p>

      <p>Att försöka hitta min egen väg mot min dröm. Att en dag kunna försörja mig på min konst.</p>

      <p>Det är en stor dröm, jag vet. Men egentligen handlar det inte om att bli rik. 💰</p>

      <p>Jag vill bara kunna leva ett lugnt och okej liv där jag gör något som känns meningsfullt för mig. 🌱</p>

      <p>Det här året – 2026 – blev starten.</p>

      <p>Jag började måla varje dag. Ibland i femton minuter, ibland i fem timmar, haha. 🎨</p>

      <p>Även när jag hade migrän (som jag har nästan varje dag), eller när jag egentligen inte orkade. 💪</p>

      <p>Det är ganska läskigt, eller hur? Att ha lagt så många år på något och sedan börja om. 😰</p>

      <p>Men kanske betyder rädslan också att det finns något viktigt där.<br>
      Att jag bryr mig. Att jag vill att det här ska fungera. 💖</p>

      <p>Geologi var ett “rätt” val på många sätt. Men jag fick det aldrig att kännas rätt för mig.</p>

      <p>Det här valet är annorlunda. Det är mitt. 🙌</p>

      <p>Och oavsett om jag lyckas eller misslyckas med det här, så känns det redan som att jag har vunnit något.</p>

      <p>För jag lyssnade på mig själv. 💭</p>

      <p>Jag vill inte få det att låta som att det här var lätt. Och jag tror inte heller att det ser likadant ut för alla.</p>

      <p>Men om det finns något du längtar efter, och du har möjlighet att ta ett litet steg mot det — kanske är det värt att prova. 🌟</p>

      <p>Jag hade tur som hamnade i en situation där jag kunde börja ge min dröm lite utrymme.</p>

      <p>Och kanske är du också där, eller på väg dit, på ditt eget sätt. 🙏</p>

      <figure class="blog-inline-image">
        <img src="/images/blogg/4.jpg" alt="Atelier med målningsprocess" />
        <figcaption>Jag nu, p\u00e5 min trygga plats</figcaption>
      </figure>

      <p>– Devika</p>
    `,

    // Content (ENGLISH)
    contentEn: `
      <p>🎓 I studied for eight years.</p>

      <p>No, not art — natural science, specifically geology.</p>

      <p>In 2016 I started my university studies in geology.</p>

      <p>I continued until 2024, when I went on sick leave due to mental health issues (more about that in another post, if you want haha).</p>

      <p>It was then, for the first time in my life, that I actually asked myself:<br>
      <strong>What do I really want to do?</strong></p>

      <p>I tried painting, and pretty quickly I understood how much I had missed being creative.</p>

      <p>I could also be creative within geology, but not in this way.</p>

      <h2>Finding my own path</h2>

      <p>A year later I left my master’s studies in geology at Stockholm University and decided to go all in.</p>

      <p>Trying to find my own path toward my dream. One day being able to support myself with my art.</p>

      <p>It is a big dream, I know. But it is really not about getting rich.</p>

      <p>I just want to live a calm and okay life where I do something that feels meaningful to me.</p>

      <p>This year — 2026 — became the beginning.</p>

      <p>I started painting every day. Sometimes for fifteen minutes, sometimes for five hours, haha.</p>

      <p>Even when I had a migraine (which I have almost every day), or when I honestly didn’t have the energy.</p>

      <p>It is pretty scary, isn’t it? To have spent so many years on something and then start over.</p>

      <p>But maybe the fear also means there is something important there.<br>
      That I care. That I want this to work.</p>

      <p>Geology was a “right” choice in many ways. But it never felt right for me.</p>

      <p>This choice is different. It is mine.</p>

      <p>And whether I succeed or fail at this, it already feels like I have won something.</p>

      <p>Because I listened to myself.</p>

      <p>I don’t want to make it sound like this was easy. And I don’t think it looks the same for everyone.</p>

      <p>But if there is something you long for, and you can take a small step toward it — maybe it is worth trying.</p>

      <p>I was lucky to end up in a situation where I could start giving my dream some room.</p>

      <p>And maybe you are there too, or on your way there, in your own way.</p>

      <figure class="blog-inline-image">
        <img src="/images/blogg/4.jpg" alt="Atelier with painting process" />
        <figcaption>Me now, in my safe place</figcaption>
      </figure>

      <p>– Devika</p>
    `,

    // Image
    image: "/images/blogg/3.jpg",
    alt: "Målarpågående i min ateljé",
    imageCaption: "N\u00e4r jag studerade geologi p\u00e5 en f\u00e4ltresa",
    imageCaptionEn: "When I studied geology on a field trip",

    // Tags
    tags: ["livsval", "konstresa", "geologi"],
  },

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
    image: "/images/blogg/Baby.jpg",
    alt: "Jag som en lugn och glad bebis",
    imageCaption: "Jag som en glad liten bebis",
    imageCaptionEn: "Me as a happy little baby",

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
    image: "/images/blogg/2.jpg",
    alt: "Pensel och färgpalett",
    imageCaption: "Natur är min största glädje",
    imageCaptionEn: "Nature is my greatest joy",

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