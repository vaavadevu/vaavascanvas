// blog-posts.js — all blog posts data

const blogPosts = [
  {
    id: "began-to-survive",
    title: "Jag började måla för att överleva",
    titleEn: "I Started Painting to Survive",
    date: "2026-04-28",
    dateFormatted: "28 april 2026",
    author: "Devika",
    excerpt: "Varför jag verkligen började måla, och vad det betyder för mig idag.",
    excerptEn: "Why I really started painting, and what it means to me today.",
    content: `
      <p>Jag tror inte att jag började måla av "rätt" anledning.<br>
      Det var inte för att bli duktig. Inte för att sälja. Inte ens för att ha en hobby.</p>
      
      <p>Jag började för att jag behövde något som fick mig att stanna kvar.</p>
      
      <p>Det fanns perioder där allt kändes tungt. Där dagarna bara gick, utan att jag riktigt var med i dem. Och i allt det där… började jag måla. Inte för att jag trodde jag var bra, utan för att det var något att hålla fast vid.</p>
      
      <h2 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; margin: 30px 0 20px 0;">I början var det rörigt</h2>
      
      <p>Färger överallt, inga riktiga planer, misstag hela tiden. Ibland kändes det som att jag förstörde mer än jag skapade. Som när en underpainting råkade ta bort hela min skiss och jag bara satt där och tänkte: vad gör jag ens?</p>
      
      <p>Men ändå fortsatte jag.</p>
      
      <p>För något hände när jag målade.<br>
      Tiden saktade ner lite. Tankarna blev inte lika högljudda. Jag kunde fokusera på något konkret – en färg, en form, ett litet steg i taget.</p>
      
      <p>Och det räckte.</p>
      
      <h2 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; margin: 30px 0 20px 0;">Jag är fortfarande i början</h2>
      
      <p>Jag är fortfarande i början av min resa. Jag lär mig fortfarande. Jag gör fortfarande misstag (hela tiden). Men jag börjar också se något växa fram – inte bara i mina målningar, utan i mig själv.</p>
      
      <p><strong>Den här bloggen är inte här för att visa perfektion.<br>
      Den är här för att visa processen.</strong></p>
      
      <p>Jag vill dela:</p>
      
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li>hur jag lär mig måla, steg för steg</li>
        <li>vad som går fel (för det gör det ofta)</li>
        <li>vad jag känner under tiden</li>
        <li>och hur konsten sakta börjar ta plats i mitt liv</li>
      </ul>
      
      <p>Kanske är du också i början av något.<br>
      Kanske känner du dig lost ibland.<br>
      Kanske letar du efter något som får dig att känna lite mer igen.</p>
      
      <p>Då hoppas jag att du kan hitta något här.</p>
      
      <p style="margin-top: 40px;"><strong>Det här är bara början.</strong></p>
      
      <p style="text-align: right; margin-top: 10px; font-style: italic;">– Devika</p>
    `,
    contentEn: `
      <p>I don't think I started painting for the "right" reasons.<br>
      It wasn't to become good. Not to sell. Not even as a hobby.</p>
      
      <p>I started because I needed something that would help me stay present.</p>
      
      <p>There were periods when everything felt heavy. When days just passed without me really being part of them. And in all of that… I started painting. Not because I thought I was good, but because it was something to hold onto.</p>
      
      <h2 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; margin: 30px 0 20px 0;">In the beginning, it was messy</h2>
      
      <p>Colors everywhere, no real plans, mistakes constantly. Sometimes it felt like I was destroying more than I was creating. Like when an underpainting accidentally wiped out my entire sketch and I just sat there thinking: what am I even doing?</p>
      
      <p>But I kept going anyway.</p>
      
      <p>Because something happened when I painted.<br>
      Time slowed down a little. My thoughts weren't as loud. I could focus on something concrete – a color, a shape, one small step at a time.</p>
      
      <p>And that was enough.</p>
      
      <h2 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; margin: 30px 0 20px 0;">I'm still at the beginning</h2>
      
      <p>I'm still at the beginning of my journey. I'm still learning. I still make mistakes (all the time). But I'm also starting to see something growing – not just in my paintings, but in myself.</p>
      
      <p><strong>This blog is not here to show perfection.<br>
      It's here to show the process.</strong></p>
      
      <p>I want to share:</p>
      
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li>how I learn to paint, step by step</li>
        <li>what goes wrong (because it does often)</li>
        <li>what I feel along the way</li>
        <li>and how art slowly finds its place in my life</li>
      </ul>
      
      <p>Maybe you're also at the beginning of something.<br>
      Maybe you feel lost sometimes.<br>
      Maybe you're looking for something that makes you feel a little more again.</p>
      
      <p>Then I hope you can find something here.</p>
      
      <p style="margin-top: 40px;"><strong>This is just the beginning.</strong></p>
      
      <p style="text-align: right; margin-top: 10px; font-style: italic;">– Devika</p>
    `,
    image: "/images/Baby.jpg",
    alt: "Jag som en lugn och glad bebis, haha",
    tags: ["inspiration", "process", "beginning"],
  },
];

// Helper function to get a blog post by ID
function getBlogPostById(id) {
  return blogPosts.find(post => post.id === id);
}

// Helper function to get all posts (for listing)
function getAllBlogPosts() {
  return blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
}
